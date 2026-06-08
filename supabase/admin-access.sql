-- MFF DATA HUB admin access setup.
-- Run this in Supabase SQL Editor after supabase/schema.sql has succeeded.
-- Replace YOUR_LOGIN_ID near the bottom with the account id you signed up with.

alter table public.raw_source_snapshots enable row level security;

drop policy if exists "admin manage profiles" on public.app_profiles;
drop policy if exists "admin write characters" on public.characters;
drop policy if exists "admin write uniforms" on public.uniforms;
drop policy if exists "admin write artifacts" on public.artifacts;
drop policy if exists "admin write comic cards" on public.comic_cards;
drop policy if exists "admin write x sword elements" on public.x_sword_elements;
drop policy if exists "admin write team up collections" on public.team_up_collections;
drop policy if exists "admin write alliance battle rotations" on public.alliance_battle_rotations;
drop policy if exists "admin write alliance battle conditions" on public.alliance_battle_conditions;
drop policy if exists "admin write effects" on public.character_effects;
drop policy if exists "admin write daily challenges" on public.daily_challenges;
drop policy if exists "admin manage raw source snapshots" on public.raw_source_snapshots;

create policy "admin manage profiles" on public.app_profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin write characters" on public.characters for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin write uniforms" on public.uniforms for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin write artifacts" on public.artifacts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin write comic cards" on public.comic_cards for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin write x sword elements" on public.x_sword_elements for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin write team up collections" on public.team_up_collections for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin write alliance battle rotations" on public.alliance_battle_rotations for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin write alliance battle conditions" on public.alliance_battle_conditions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin write effects" on public.character_effects for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin write daily challenges" on public.daily_challenges for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manage raw source snapshots" on public.raw_source_snapshots for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public grant select on tables to anon, authenticated;
alter default privileges in schema public grant insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;

do $$
declare
  admin_login_id text := 'YOUR_LOGIN_ID';
begin
  if admin_login_id = 'YOUR_LOGIN_ID' then
    raise notice 'Replace YOUR_LOGIN_ID with your signed-up login id, then run again to promote admin.';
    return;
  end if;

  update public.app_profiles
  set role = 'admin',
      updated_at = now()
  where login_id = lower(admin_login_id);

  if not found then
    raise notice 'No app_profiles row found for login_id=%', admin_login_id;
  end if;
end $$;

select user_id, login_id, nickname, role, created_at, updated_at
from public.app_profiles
order by created_at desc;
