begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();
insert into auth.users(id,email) values('11111111-1111-4111-8111-111111111111','orderin-test-a@example.invalid'),('22222222-2222-4222-8222-222222222222','orderin-test-b@example.invalid');
insert into public.businesses(id,seller_id,local_key,name,type) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','a','A','kofe'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','b','B','aru');
insert into public.channels(id,business_id,type,external_id,display_name,token_encrypted) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','whatsapp','test-phone','A','opaque-test-ciphertext'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','instagram','test-ig','B','opaque-test-ciphertext');
select public.ingest_meta_message('cccccccc-cccc-4ccc-8ccc-cccccccccccc','customer-a','A customer','whatsapp:one','Два латте',null,null,now());
select public.ingest_meta_message('cccccccc-cccc-4ccc-8ccc-cccccccccccc','customer-a','A customer','whatsapp:one','Два латте',null,null,now());
select public.ingest_meta_message('dddddddd-dddd-4ddd-8ddd-dddddddddddd','customer-b','B customer','instagram:one','Hello',null,null,now());
select extensions.is((select count(*) from public.messages),2::bigint,'duplicate webhook inserts no second message');
select extensions.is((select unread_count from public.conversations where business_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),1,'duplicate never increments unread');
select extensions.is((select count(*) from public.meta_ai_jobs),2::bigint,'one durable AI job per inbound message');
select extensions.ok(not has_column_privilege('authenticated','public.channels','token_encrypted','SELECT'),'ciphertext inaccessible to app role');
select extensions.ok(not has_table_privilege('authenticated','public.meta_oauth_states','SELECT'),'OAuth state hidden');
select extensions.ok(not has_function_privilege('authenticated','public.ingest_meta_events(jsonb,jsonb)','EXECUTE'),'app cannot forge webhook ingestion');
select extensions.ok(not has_function_privilege('authenticated','public.apply_meta_status(uuid,text,text,timestamptz)','EXECUTE'),'app cannot forge delivery status');
select extensions.ok((select count(*)=3 from pg_publication_tables where pubname='supabase_realtime' and tablename in ('messages','conversations','order_drafts')),'Realtime publication enabled');
select extensions.ok(not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='channels'),'encrypted tokens not published');
insert into public.order_drafts(business_id,message_id,parsed,confidence) select business_id,id,'{"type":"order","items":[]}',0.5 from public.messages;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select extensions.is((select count(*) from public.businesses),1::bigint,'seller sees own business only');
select extensions.is((select count(*) from public.customers),1::bigint,'seller sees own customers only');
select extensions.is((select count(*) from public.conversations),1::bigint,'seller sees own conversations only');
select extensions.is((select count(*) from public.messages),1::bigint,'seller sees own messages only');
select extensions.is((select count(*) from public.order_drafts),1::bigint,'seller sees own drafts only');
select extensions.is((select count(id) from public.channels),1::bigint,'seller sees own safe channel metadata only');
select extensions.throws_ok('select token_encrypted from public.channels','42501',null,'cannot select encrypted tokens');
select extensions.throws_ok($q$insert into public.businesses(seller_id,local_key,name,type) values('22222222-2222-4222-8222-222222222222','spoof','spoof','kofe')$q$,'42501',null,'cannot create another seller business');
update public.order_drafts set status='accepted' where business_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
reset role;
select extensions.is((select status from public.order_drafts where business_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),'draft','cannot update another seller draft');
select extensions.throws_ok($q$update public.channels set external_id='another-account' where id='cccccccc-cccc-4ccc-8ccc-cccccccccccc'$q$,'P0001',null,'channel identity cannot silently change');
-- Status arrives before the send response and must survive finalization.
insert into public.messages(id,business_id,conversation_id,direction,text,status,client_request_id)
select 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',business_id,id,'out','Reply','sending','ffffffff-ffff-4fff-8fff-ffffffffffff' from public.conversations where business_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
select public.apply_meta_status('cccccccc-cccc-4ccc-8ccc-cccccccccccc','whatsapp:out','read',now());
select public.complete_meta_send('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','whatsapp:out');
select public.apply_meta_status('cccccccc-cccc-4ccc-8ccc-cccccccccccc','whatsapp:out','delivered',now());
select extensions.is((select status from public.messages where id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'),'read','late delivered event cannot downgrade read');
select public.apply_meta_status('dddddddd-dddd-4ddd-8ddd-dddddddddddd','whatsapp:out','failed',now());
select extensions.is((select status from public.messages where id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'),'read','other channel cannot mutate status');
select extensions.is((select count(*) from public.claim_meta_ai_jobs()),2::bigint,'worker claims pending jobs');
select extensions.is((select count(*) from public.claim_meta_ai_jobs()),0::bigint,'leased jobs not claimed twice');
select * from extensions.finish();
rollback;
