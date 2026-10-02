create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
-- Owner creates the two Vault secrets documented in README. No credential is
-- embedded in cron.job, application tables or a migration committed to Git.
select cron.schedule('qazyna-meta-maintenance','* * * * *',$job$
 select net.http_post(
  url=u.decrypted_secret||'/functions/v1/meta-maintenance',
  headers=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||k.decrypted_secret),
  body='{}'::jsonb,timeout_milliseconds:=60000
 ) from vault.decrypted_secrets u,vault.decrypted_secrets k
 where u.name='qazyna_supabase_url' and k.name='qazyna_meta_cron_secret';
$job$);
