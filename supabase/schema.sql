-- MFF DATA HUB / Supabase schema
-- 관리 편한 구조: 원천 수집(raw_source_snapshots) + 정규화 테이블 + 관리용 matrix view.

create extension if not exists pgcrypto;

create table if not exists public.characters (
  id text primary key,
  name text not null unique,
  portrait_url text,
  portrait_local_url text,
  combat_type text check (combat_type in ('Combat','Blast','Speed','Universal','Unknown')) default 'Unknown',
  side text check (side in ('Hero','Villain','Neutral','Unknown')) default 'Unknown',
  gender text,
  species text,
  tags text[] default '{}',
  source text default 'manual',
  source_url text,
  updated_at timestamptz default now()
);

create table if not exists public.uniforms (
  id uuid primary key default gen_random_uuid(),
  character_id text references public.characters(id) on delete cascade,
  name text not null,
  acquisition text,
  season text,
  cost text,
  release_update text,
  release_date text,
  image_url text,
  image_local_url text,
  source_url text default 'https://thanosvibs.money/uniforms',
  unique(character_id, name)
);

create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(),
  character_id text references public.characters(id) on delete cascade,
  name text not null,
  exclusive_skill text,
  pve_score text,
  pvp_score text,
  effects jsonb default '[]'::jsonb,
  acquisition text,
  release_update text,
  image_url text,
  image_local_url text,
  source_url text default 'https://thanosvibs.money/artifacts',
  unique(character_id)
);

create table if not exists public.comic_cards (
  id text primary key,
  name text not null unique,
  card_type text default 'Unknown',
  fixed_stats text[] default '{}',
  option_stats jsonb default '{}'::jsonb,
  image_url text,
  image_local_url text,
  source_url text default 'https://thanosvibs.money/cards',
  note text,
  updated_at timestamptz default now()
);

create table if not exists public.user_comic_cards (
  user_id uuid not null,
  slot int not null check (slot between 1 and 5),
  card_id text references public.comic_cards(id) on delete set null,
  quality int,
  crafted_stars int,
  blue_stars int,
  pierce numeric,
  attack_contribution numeric,
  selected_options text[] default '{}',
  stats jsonb default '{}'::jsonb,
  priority text,
  memo text,
  updated_at timestamptz default now(),
  primary key(user_id, slot)
);

create table if not exists public.x_sword_elements (
  id text primary key,
  name text not null,
  korean_name text,
  color_name text,
  stat_key text not null,
  stat_label text not null,
  level_values jsonb default '[]'::jsonb,
  image_url text,
  image_local_url text,
  source_url text default 'https://thanosvibs.money/dailybuggle/script_guide_swords'
);

create table if not exists public.user_x_swords (
  user_id uuid not null,
  slot int not null check (slot between 1 and 6),
  element_id text references public.x_sword_elements(id) on delete set null,
  level int default 0,
  runes text[] default '{}',
  option_stats jsonb default '{}'::jsonb,
  quality text,
  memo text,
  updated_at timestamptz default now(),
  primary key(user_id, slot)
);

create table if not exists public.team_up_collections (
  id text primary key,
  name text not null unique,
  target_hero_ids text[] default '{}',
  target_heroes text[] default '{}',
  icon_image_url text,
  source_url text default 'https://future-fight.fandom.com/wiki/Team-Up_Collection',
  recommended_options text[] default '{}',
  updated_at timestamptz default now()
);

create table if not exists public.user_team_up_collections (
  user_id uuid not null,
  theme_id text not null references public.team_up_collections(id) on delete cascade,
  completed_steps int default 0,
  collection_level int default 0,
  option_level int default 0,
  applied_option text,
  stats jsonb default '{}'::jsonb,
  token_progress int default 0,
  token_goal int default 0,
  status text default 'farm',
  updated_at timestamptz default now(),
  primary key(user_id, theme_id)
);

create table if not exists public.alliance_battle_rotations (
  id text primary key,
  name text not null,
  version text,
  starts_at date,
  reset_timezone text default 'Asia/Seoul',
  source_url text default 'https://thanosvibs.money/abxl',
  community_url text,
  note text,
  updated_at timestamptz default now()
);

create table if not exists public.alliance_battle_conditions (
  id text primary key,
  rotation_id text references public.alliance_battle_rotations(id) on delete cascade,
  round_no int not null check (round_no between 1 and 28),
  mode text check (mode in ('Normal','Extreme','Legend','Infinite Challenge')) not null,
  content text check (content in ('AB','ABX','ABL','Infinity Challenge')) not null,
  is_reset_day boolean default false,
  restrictions text[] default '{}',
  required_type text,
  required_alignment text,
  required_gender text,
  required_tags text[] default '{}',
  cancel_effects text[] default '{}',
  source_url text default 'https://thanosvibs.money/abxl',
  note text,
  updated_at timestamptz default now(),
  unique(rotation_id, round_no, mode)
);

create table if not exists public.character_effects (
  id uuid primary key default gen_random_uuid(),
  character_id text references public.characters(id) on delete cascade,
  uniform_id uuid references public.uniforms(id) on delete cascade,
  source_kind text check (source_kind in ('Leadership','Tier-2 Passive','Tier-3 Passive','Tier-4 Passive','Uniform Effect','Artifact Exclusive Skill','Other')) default 'Other',
  effect_name text not null,
  magnitude numeric,
  magnitude_text text,
  restriction_text text,
  raw_text text,
  source_url text default 'https://thanosvibs.money/supports'
);

create table if not exists public.user_characters (
  user_id uuid not null,
  character_id text references public.characters(id) on delete cascade,
  owned boolean default false,
  tier text,
  level int,
  uniform_id uuid references public.uniforms(id) on delete set null,
  uniform_rank text,
  artifact_id uuid references public.artifacts(id) on delete set null,
  artifact_stars int,
  ctp text,
  memo text,
  updated_at timestamptz default now(),
  primary key(user_id, character_id)
);

create table if not exists public.raw_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text not null,
  fetched_at timestamptz default now(),
  content_hash text,
  payload jsonb not null
);

create or replace view public.v_character_db_matrix as
select
  c.id as character_id,
  c.name as character_name,
  c.portrait_url,
  c.portrait_local_url,
  c.combat_type,
  c.side,
  coalesce(jsonb_agg(distinct jsonb_build_object(
    'uniform_id', u.id,
    'uniform', u.name,
    'acquisition', u.acquisition,
    'release_update', u.release_update,
    'release_date', u.release_date,
    'image_url', u.image_url,
    'image_local_url', u.image_local_url
  )) filter (where u.id is not null), '[]'::jsonb) as uniforms,
  jsonb_build_object(
    'artifact_id', a.id,
    'artifact', a.name,
    'exclusive_skill', a.exclusive_skill,
    'effects', a.effects,
    'pve_score', a.pve_score,
    'pvp_score', a.pvp_score,
    'image_url', a.image_url,
    'image_local_url', a.image_local_url
  ) as artifact,
  coalesce(jsonb_agg(distinct jsonb_build_object(
    'source_kind', e.source_kind,
    'effect_name', e.effect_name,
    'magnitude_text', e.magnitude_text,
    'restriction_text', e.restriction_text,
    'raw_text', e.raw_text,
    'uniform_id', e.uniform_id
  )) filter (where e.id is not null), '[]'::jsonb) as leader_passive_uniform_effects
from public.characters c
left join public.uniforms u on u.character_id = c.id
left join public.artifacts a on a.character_id = c.id
left join public.character_effects e on e.character_id = c.id
group by c.id, a.id;

create or replace view public.v_account_spec_matrix as
with users as (
  select user_id from public.user_comic_cards
  union
  select user_id from public.user_x_swords
  union
  select user_id from public.user_team_up_collections
)
select
  users.user_id,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'slot', ucc.slot,
      'card_id', cc.id,
      'card', cc.name,
      'card_type', cc.card_type,
      'quality', ucc.quality,
      'crafted_stars', ucc.crafted_stars,
      'blue_stars', ucc.blue_stars,
      'pierce', ucc.pierce,
      'attack_contribution', ucc.attack_contribution,
      'selected_options', ucc.selected_options,
      'stats', ucc.stats,
      'image_url', cc.image_url,
      'image_local_url', cc.image_local_url
    ) order by ucc.slot)
    from public.user_comic_cards ucc
    left join public.comic_cards cc on cc.id = ucc.card_id
    where ucc.user_id = users.user_id
  ), '[]'::jsonb) as comic_cards,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'slot', uxs.slot,
      'element_id', xse.id,
      'element', xse.name,
      'level', uxs.level,
      'runes', uxs.runes,
      'option_stats', uxs.option_stats,
      'quality', uxs.quality,
      'image_url', xse.image_url,
      'image_local_url', xse.image_local_url
    ) order by uxs.slot)
    from public.user_x_swords uxs
    left join public.x_sword_elements xse on xse.id = uxs.element_id
    where uxs.user_id = users.user_id
  ), '[]'::jsonb) as x_swords,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'theme_id', tuc.id,
      'theme', tuc.name,
      'completed_steps', utuc.completed_steps,
      'collection_level', utuc.collection_level,
      'option_level', utuc.option_level,
      'applied_option', utuc.applied_option,
      'stats', utuc.stats,
      'token_progress', utuc.token_progress,
      'token_goal', utuc.token_goal,
      'status', utuc.status,
      'target_heroes', tuc.target_heroes
    ) order by tuc.name)
    from public.user_team_up_collections utuc
    left join public.team_up_collections tuc on tuc.id = utuc.theme_id
    where utuc.user_id = users.user_id
  ), '[]'::jsonb) as team_up_collections
from users;

create or replace view public.v_alliance_battle_monthly_conditions as
select
  r.id as rotation_id,
  r.name as rotation_name,
  r.version,
  r.starts_at,
  r.reset_timezone,
  c.round_no,
  c.mode,
  c.content,
  c.is_reset_day,
  c.restrictions,
  c.required_type,
  c.required_alignment,
  c.required_gender,
  c.required_tags,
  c.cancel_effects,
  c.source_url,
  c.note
from public.alliance_battle_rotations r
join public.alliance_battle_conditions c on c.rotation_id = r.id
order by r.starts_at desc nulls last, c.round_no, c.mode;

alter table public.characters enable row level security;
alter table public.uniforms enable row level security;
alter table public.artifacts enable row level security;
alter table public.comic_cards enable row level security;
alter table public.user_comic_cards enable row level security;
alter table public.x_sword_elements enable row level security;
alter table public.user_x_swords enable row level security;
alter table public.team_up_collections enable row level security;
alter table public.user_team_up_collections enable row level security;
alter table public.alliance_battle_rotations enable row level security;
alter table public.alliance_battle_conditions enable row level security;
alter table public.character_effects enable row level security;
alter table public.user_characters enable row level security;


-- Optional app tables for dashboard/optimizer/history.
create table if not exists public.daily_challenges (
  id text primary key,
  challenge_date date not null,
  content text check (content in ('ABX','ABL')) not null,
  label text,
  rotation_round int,
  mode text,
  is_reset_day boolean default false,
  recommended_type text,
  required_alignment text,
  required_gender text,
  required_tags text[] default '{}',
  bonus_tags text[] default '{}',
  banned_tags text[] default '{}',
  cancel_effects text[] default '{}',
  source_url text,
  note text,
  updated_at timestamptz default now()
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  used_at date not null,
  content text not null,
  boss_or_mode text,
  dealer_id text references public.characters(id) on delete set null,
  leader_id text references public.characters(id) on delete set null,
  support_1_id text references public.characters(id) on delete set null,
  support_2_id text references public.characters(id) on delete set null,
  score numeric,
  memo text,
  created_at timestamptz default now()
);

create table if not exists public.calculator_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  preset jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.daily_challenges enable row level security;
alter table public.usage_logs enable row level security;
alter table public.calculator_presets enable row level security;

-- Re-runnable RLS policy setup. Supabase SQL Editor에서 여러 번 실행해도 안 터지게 drop/create 사용.
drop policy if exists "public read characters" on public.characters;
drop policy if exists "public read uniforms" on public.uniforms;
drop policy if exists "public read artifacts" on public.artifacts;
drop policy if exists "public read comic cards" on public.comic_cards;
drop policy if exists "own comic cards" on public.user_comic_cards;
drop policy if exists "public read x sword elements" on public.x_sword_elements;
drop policy if exists "own x swords" on public.user_x_swords;
drop policy if exists "public read team up collections" on public.team_up_collections;
drop policy if exists "own team up collections" on public.user_team_up_collections;
drop policy if exists "public read alliance battle rotations" on public.alliance_battle_rotations;
drop policy if exists "public read alliance battle conditions" on public.alliance_battle_conditions;
drop policy if exists "public read effects" on public.character_effects;
drop policy if exists "public read daily challenges" on public.daily_challenges;
drop policy if exists "own roster" on public.user_characters;
drop policy if exists "own usage logs" on public.usage_logs;
drop policy if exists "own calculator presets" on public.calculator_presets;

create policy "public read characters" on public.characters for select using (true);
create policy "public read uniforms" on public.uniforms for select using (true);
create policy "public read artifacts" on public.artifacts for select using (true);
create policy "public read comic cards" on public.comic_cards for select using (true);
create policy "own comic cards" on public.user_comic_cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "public read x sword elements" on public.x_sword_elements for select using (true);
create policy "own x swords" on public.user_x_swords for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "public read team up collections" on public.team_up_collections for select using (true);
create policy "own team up collections" on public.user_team_up_collections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "public read alliance battle rotations" on public.alliance_battle_rotations for select using (true);
create policy "public read alliance battle conditions" on public.alliance_battle_conditions for select using (true);
create policy "public read effects" on public.character_effects for select using (true);
create policy "public read daily challenges" on public.daily_challenges for select using (true);
create policy "own roster" on public.user_characters for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own usage logs" on public.usage_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own calculator presets" on public.calculator_presets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
