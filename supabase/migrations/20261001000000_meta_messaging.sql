create table public.businesses (
 id uuid primary key default gen_random_uuid(),
 seller_id uuid not null references auth.users(id) on delete cascade,
 local_key text not null check(length(local_key) between 1 and 200),
 name text not null check(length(name) between 1 and 200),
 type text not null check(type in ('kofe','aru','dala','nur','tumar','bake')),
 products jsonb not null default '[]' check(jsonb_typeof(products)='array' and jsonb_array_length(products)<=200),
 created_at timestamptz not null default now(), unique(seller_id,local_key)
);
create table public.channels (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 type text not null check(type in ('instagram','whatsapp')),
 external_id text not null, display_name text not null,
 status text not null default 'connected' check(status in ('connected','expired','error','disconnected')),
 token_encrypted text not null, token_expires_at timestamptz,
 token_updated_at timestamptz not null default now(), refresh_locked_until timestamptz, waba_id text,
 unique(type,external_id), unique(business_id,type), unique(id,business_id)
);
create table public.customers (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 channel text not null check(channel in ('instagram','whatsapp')),
 external_user_id text not null, name text not null,
 unique(business_id,channel,external_user_id),unique(id,business_id)
);
create table public.conversations (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 customer_id uuid not null, channel text not null check(channel in ('instagram','whatsapp')),
 last_message_at timestamptz, last_inbound_at timestamptz,
 unread_count integer not null default 0 check(unread_count>=0),
 foreign key(customer_id,business_id) references public.customers(id,business_id) on delete cascade,
 unique(customer_id,channel),unique(id,business_id)
);
create table public.messages (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 conversation_id uuid not null, direction text not null check(direction in ('in','out')),
 text text not null default '', media_url text, media_id text,
 external_message_id text unique,
 sent_at timestamptz not null default now(),
 status text not null check(status in ('received','sending','sent','delivered','read','failed','unknown')),
 client_request_id uuid unique, request_payload_hash text,
 foreign key(conversation_id,business_id) references public.conversations(id,business_id) on delete cascade,
 unique(id,business_id)
);
create index messages_conversation_time on public.messages(conversation_id,sent_at);
create index conversations_business_time on public.conversations(business_id,last_message_at desc);
create table public.order_drafts (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 message_id uuid not null unique, parsed jsonb not null,
 confidence real not null check(confidence between 0 and 1),
 status text not null default 'draft' check(status in ('draft','accepted','dismissed')),
 foreign key(message_id,business_id) references public.messages(id,business_id) on delete cascade
);
create table public.meta_oauth_states (
 state_hash text primary key, seller_id uuid not null references auth.users(id) on delete cascade,
 business_id uuid not null references public.businesses(id) on delete cascade,
 redirect_uri text not null, expires_at timestamptz not null
);
create table public.meta_ai_jobs (
 message_id uuid primary key references public.messages(id) on delete cascade,
 attempts integer not null default 0, available_at timestamptz not null default now(),
 locked_until timestamptz, done boolean not null default false
);
-- Status events may arrive before Graph's send response or out of order.
create table public.meta_message_statuses (
 external_message_id text primary key, channel_id uuid not null references public.channels(id) on delete cascade,
 status text not null, occurred_at timestamptz not null
);

create function public.owns_business(bid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.businesses where id=bid and seller_id=(select auth.uid()));
$$;
revoke all on function public.owns_business(uuid) from public,anon;
grant execute on function public.owns_business(uuid) to authenticated;
alter table public.businesses enable row level security;
create policy business_owner on public.businesses for all to authenticated using(seller_id=(select auth.uid())) with check(seller_id=(select auth.uid()));
revoke all on public.businesses from anon,authenticated;
grant select,insert on public.businesses to authenticated;
grant update(name,type,products) on public.businesses to authenticated;
do $$declare t text;begin
 foreach t in array array['channels','customers','conversations','messages','order_drafts'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy seller_read on public.%I for select to authenticated using(public.owns_business(business_id))',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
 end loop;
 foreach t in array array['meta_oauth_states','meta_ai_jobs','meta_message_statuses'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
 end loop;
end$$;
grant select on public.customers,public.conversations,public.messages,public.order_drafts to authenticated;
-- Column-level grants protect ciphertext even from SELECT * and Realtime (channels is not published).
grant select(id,business_id,type,external_id,display_name,status,token_expires_at,waba_id) on public.channels to authenticated;
grant update(status) on public.order_drafts to authenticated;
create policy seller_draft_status on public.order_drafts for update to authenticated using(public.owns_business(business_id)) with check(public.owns_business(business_id));

create function public.mark_conversation_read(cid uuid, seen_at timestamptz) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.conversations where id=cid and public.owns_business(business_id)) then raise exception 'forbidden'; end if;
 perform 1 from public.conversations where id=cid for update;
 update public.conversations set unread_count=(select count(*) from public.messages where conversation_id=cid and direction='in' and sent_at>seen_at) where id=cid;
end$$;
revoke all on function public.mark_conversation_read(uuid,timestamptz) from public,anon;
grant execute on function public.mark_conversation_read(uuid,timestamptz) to authenticated;

-- Transactional ingestion: duplicate delivery never increments unread or queues AI twice.
create function public.ingest_meta_message(p_channel_id uuid,p_user text,p_name text,p_external text,p_text text,p_media_url text,p_media_id text,p_sent_at timestamptz,p_direction text default 'in') returns uuid
language plpgsql security definer set search_path='' as $$
declare ch public.channels; customer uuid; conv uuid; msg uuid;
begin
 select * into strict ch from public.channels where id=p_channel_id and status<>'disconnected';
 insert into public.customers(business_id,channel,external_user_id,name) values(ch.business_id,ch.type,p_user,p_name)
 on conflict(business_id,channel,external_user_id) do update set name=case when excluded.name<>excluded.external_user_id then excluded.name else customers.name end returning id into customer;
 insert into public.conversations(business_id,customer_id,channel) values(ch.business_id,customer,ch.type)
 on conflict(customer_id,channel) do update set customer_id=excluded.customer_id returning id into conv;
 insert into public.messages(business_id,conversation_id,direction,text,media_url,media_id,external_message_id,sent_at,status)
 values(ch.business_id,conv,p_direction,p_text,p_media_url,p_media_id,p_external,p_sent_at,case when p_direction='in' then 'received' else 'sent' end)
 on conflict(external_message_id) do nothing returning id into msg;
 if msg is null then return null; end if;
 update public.conversations set last_message_at=greatest(last_message_at,p_sent_at),last_inbound_at=case when p_direction='in' then greatest(last_inbound_at,p_sent_at) else last_inbound_at end,
 unread_count=unread_count+case when p_direction='in' then 1 else 0 end where id=conv;
 if p_direction='in' and length(p_text)>0 and length(p_text)<=2000 then insert into public.meta_ai_jobs(message_id) values(msg);end if;
 return msg;
end$$;
revoke all on function public.ingest_meta_message(uuid,text,text,text,text,text,text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.ingest_meta_message(uuid,text,text,text,text,text,text,timestamptz,text) to service_role;

create function public.meta_status_rank(s text) returns integer language sql immutable as $$select case s when 'read' then 4 when 'delivered' then 3 when 'sent' then 1 when 'failed' then 2 else 0 end$$;
create function public.apply_meta_status(p_channel_id uuid,p_external text,p_status text,p_at timestamptz) returns void
language plpgsql security definer set search_path='' as $$
begin
 if p_status not in ('sent','delivered','read','failed') then return;end if;
 insert into public.meta_message_statuses values(p_external,p_channel_id,p_status,p_at)
 on conflict(external_message_id) do update set status=excluded.status,occurred_at=excluded.occurred_at
 where meta_message_statuses.channel_id=excluded.channel_id and public.meta_status_rank(excluded.status)>public.meta_status_rank(meta_message_statuses.status);
 update public.messages m set status=s.status from public.meta_message_statuses s,public.channels c
 where s.external_message_id=p_external and c.id=p_channel_id and s.channel_id=c.id and m.business_id=c.business_id and m.external_message_id=s.external_message_id and m.direction='out'
 and public.meta_status_rank(s.status)>public.meta_status_rank(m.status);
end$$;
revoke all on function public.apply_meta_status(uuid,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.apply_meta_status(uuid,text,text,timestamptz) to service_role;

create function public.claim_meta_ai_jobs() returns setof public.meta_ai_jobs language sql security definer set search_path='' as $$
 update public.meta_ai_jobs set locked_until=now()+interval '2 minutes',attempts=attempts+1
 where message_id in (select message_id from public.meta_ai_jobs where not done and attempts<5 and available_at<=now() and (locked_until is null or locked_until<now()) order by available_at limit 5 for update skip locked)
 returning *;
$$;
revoke all on function public.claim_meta_ai_jobs() from public,anon,authenticated;
grant execute on function public.claim_meta_ai_jobs() to service_role;

alter publication supabase_realtime add table public.conversations, public.messages, public.order_drafts;

create function public.ingest_meta_events(p_messages jsonb,p_statuses jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare ev jsonb; cid uuid;
begin
 for ev in select * from jsonb_array_elements(p_messages) loop
  select id into cid from public.channels where type=ev->>'channel' and external_id=ev->>'account' and status<>'disconnected';
  if cid is not null then perform public.ingest_meta_message(cid,ev->>'user',ev->>'name',ev->>'external',ev->>'text',ev->>'mediaUrl',ev->>'mediaId',(ev->>'sentAt')::timestamptz,ev->>'direction');end if;
 end loop;
 for ev in select * from jsonb_array_elements(p_statuses) loop
  select id into cid from public.channels where type=ev->>'channel' and external_id=ev->>'account';
  if cid is not null then perform public.apply_meta_status(cid,ev->>'external',ev->>'status',(ev->>'at')::timestamptz);end if;
 end loop;
end$$;
revoke all on function public.ingest_meta_events(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.ingest_meta_events(jsonb,jsonb) to service_role;

create function public.complete_meta_send(p_message uuid,p_external text) returns public.messages
language plpgsql security definer set search_path='' as $$
declare m public.messages; echo public.messages; cid uuid;
begin
 select * into strict m from public.messages where id=p_message for update;
 select * into echo from public.messages where external_message_id=p_external and id<>p_message for update;
 if echo.id is not null then
  if echo.business_id<>m.business_id or echo.conversation_id<>m.conversation_id or echo.direction<>'out' then raise exception 'conflict';end if;
  delete from public.messages where id=echo.id;
 end if;
 update public.messages set external_message_id=p_external,status='sent' where id=p_message returning * into m;
 update public.conversations set last_message_at=greatest(last_message_at,m.sent_at) where id=m.conversation_id;
 select ch.id into cid from public.channels ch join public.conversations c on c.business_id=ch.business_id and c.channel=ch.type where c.id=m.conversation_id;
 perform public.apply_meta_status(cid,p_external,s.status,s.occurred_at) from public.meta_message_statuses s where s.external_message_id=p_external and s.channel_id=cid;
 select * into m from public.messages where id=p_message;
 return m;
end$$;
revoke all on function public.complete_meta_send(uuid,text) from public,anon,authenticated;
grant execute on function public.complete_meta_send(uuid,text) to service_role;

create function public.guard_channel_identity() returns trigger language plpgsql set search_path='' as $$
begin
 if new.business_id<>old.business_id or new.type<>old.type or new.external_id<>old.external_id then raise exception 'channel identity cannot be reassigned';end if;
 return new;
end$$;
create trigger immutable_channel_identity before update on public.channels for each row execute function public.guard_channel_identity();
grant all on public.businesses,public.channels,public.customers,public.conversations,public.messages,public.order_drafts,public.meta_ai_jobs,public.meta_oauth_states,public.meta_message_statuses to service_role;

create function public.claim_meta_refresh() returns setof public.channels language sql security definer set search_path='' as $$
 update public.channels set refresh_locked_until=now()+interval '2 minutes'
 where id in (select id from public.channels where type='instagram' and status='connected'
 and token_expires_at>now() and token_expires_at<now()+interval '7 days'
 and token_updated_at<now()-interval '24 hours' and (refresh_locked_until is null or refresh_locked_until<now())
 order by token_expires_at limit 5 for update skip locked) returning *;
$$;
revoke all on function public.claim_meta_refresh() from public,anon,authenticated;
grant execute on function public.claim_meta_refresh() to service_role;
