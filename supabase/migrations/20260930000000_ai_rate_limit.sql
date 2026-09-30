create table public.ai_rate_limits (
  device_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  requests integer not null
);
alter table public.ai_rate_limits enable row level security;
revoke all on public.ai_rate_limits from anon, authenticated;

-- One atomic row per authenticated installation; shared by every Edge isolate.
create function public.take_ai_request(p_device_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  insert into public.ai_rate_limits as limits (device_id, window_start, requests)
  values (p_device_id, clock_timestamp(), 1)
  on conflict (device_id) do update set
    requests = case when limits.window_start <= clock_timestamp() - interval '60 seconds'
      then 1 else limits.requests + 1 end,
    window_start = case when limits.window_start <= clock_timestamp() - interval '60 seconds'
      then clock_timestamp() else limits.window_start end
  returning requests into n;
  return n <= 60;
end;
$$;
revoke all on function public.take_ai_request(uuid) from public, anon, authenticated;
grant execute on function public.take_ai_request(uuid) to service_role;
