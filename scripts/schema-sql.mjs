import { readFile, writeFile } from "node:fs/promises";
const schema = await readFile("supabase/catalog.schema.json", "utf8");
const sql = `-- Apply ONLY to a brand-new Supabase project created for 9Floor V2.
begin;
create extension if not exists pg_jsonschema with schema extensions;
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
create table private.admin_users(user_id uuid primary key references auth.users(id));
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.admin_users where user_id=auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon,authenticated;
create table public.catalog_releases(revision bigint primary key,document jsonb not null,created_at timestamptz not null default now(),created_by uuid not null references auth.users(id));
create table public.catalog_drafts(id text primary key check(id='main'),document jsonb not null,updated_at timestamptz not null default now());
alter table public.catalog_releases enable row level security;
alter table public.catalog_drafts enable row level security;
create or replace function public.latest_catalog_revision() returns bigint language sql stable security definer set search_path='' as $$select coalesce(max(revision),0) from public.catalog_releases$$;
revoke all on function public.latest_catalog_revision() from public;
grant execute on function public.latest_catalog_revision() to anon,authenticated;
create policy latest_published_read on public.catalog_releases for select to anon,authenticated using (revision=public.latest_catalog_revision());
create policy admin_history_read on public.catalog_releases for select to authenticated using(public.is_admin());
create policy admin_drafts on public.catalog_drafts for all to authenticated using(public.is_admin()) with check(public.is_admin());
revoke all on public.catalog_releases,public.catalog_drafts from anon,authenticated;
grant select on public.catalog_releases to anon,authenticated;
grant select,insert,update,delete on public.catalog_drafts to authenticated;
create or replace function private.valid_catalog(doc jsonb) returns boolean language plpgsql immutable set search_path='' as $fn$
declare ids integer; distinct_ids integer;
begin
 if not extensions.jsonb_matches_schema($schema$${schema}$schema$::json,doc) then return false; end if;
 if (select count(*)<>count(distinct x->>'id') from jsonb_array_elements(doc->'categories') x) then return false; end if;
 if (select count(*)<>count(distinct x->>'id') from jsonb_array_elements(doc->'recipes') x) then return false; end if;
 if (select count(*)<>count(distinct lower(trim(x->>'englishName'))) from jsonb_array_elements(doc->'recipes') x) then return false; end if;
 if (select count(*)<>count(distinct lower(trim(x->>'menuNumber'))) from jsonb_array_elements(doc->'recipes') x where x->>'menuNumber' is not null and trim(x->>'menuNumber')<>'') then return false; end if;
 if exists(select 1 from jsonb_array_elements(doc->'recipes') r where not exists(select 1 from jsonb_array_elements(doc->'categories') c where c->>'id'=r->>'categoryId')) then return false; end if;
 if exists(select 1 from jsonb_array_elements(doc->'recipes') r where r->>'image' is not null and r->>'image' not like 'https://%') then return false; end if;
 return true;
end;$fn$;
create or replace function public.publish_catalog(document jsonb,expected_revision bigint) returns bigint language plpgsql security definer set search_path='' as $fn$
declare latest bigint; old_doc jsonb; recipes jsonb;
begin
 if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
 if pg_column_size(document)>10485760 then raise exception 'DOCUMENT_TOO_LARGE'; end if;
 if not private.valid_catalog(document) then raise exception 'INVALID_CATALOG'; end if;
 perform pg_advisory_xact_lock(98104271);
 select coalesce(max(revision),0) into latest from public.catalog_releases;
 if expected_revision<>latest then raise exception 'REVISION_CONFLICT'; end if;
 select r.document into old_doc from public.catalog_releases r where revision=latest;
 select jsonb_agg(case when old.item is null or (item - 'updatedAt' - 'version') is distinct from (old.item - 'updatedAt' - 'version')
 then jsonb_set(jsonb_set(item,'{version}',to_jsonb(coalesce((old.item->>'version')::integer,0)+1)),'{updatedAt}',to_jsonb(to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')))
 else old.item end order by ord)
 into recipes from jsonb_array_elements(document->'recipes') with ordinality as n(item,ord)
 left join lateral(select o.item from jsonb_array_elements(coalesce(old_doc->'recipes','[]'::jsonb)) as o(item) where o.item->>'id'=n.item->>'id') old on true;
 document=jsonb_set(document,'{recipes}',coalesce(recipes,'[]'::jsonb));
 document=jsonb_set(document,'{revision}',to_jsonb(latest+1));
 insert into public.catalog_releases(revision,document,created_by) values(latest+1,document,auth.uid());
 insert into public.catalog_drafts(id,document) values('main',document) on conflict(id) do update set document=excluded.document,updated_at=now();
 return latest+1;
end;$fn$;
revoke all on function public.publish_catalog(jsonb,bigint) from public;
grant execute on function public.publish_catalog(jsonb,bigint) to authenticated;
-- Public beverage pictures only. No customer data. Upload names are immutable.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('recipe-images','recipe-images',true,5242880,array['image/webp']);
create policy admin_image_insert on storage.objects for insert to authenticated with check(bucket_id='recipe-images' and public.is_admin() and lower(storage.extension(name))='webp');
-- No client UPDATE/DELETE permissions: previous releases keep their image URLs valid.
commit;
-- After creating an owner through Supabase Auth, add that verified UUID via SQL:
-- insert into private.admin_users(user_id) values ('OWNER_AUTH_USER_UUID');
`;
await writeFile("supabase/migrations/001_initial.sql", sql);
