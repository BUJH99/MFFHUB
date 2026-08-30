begin;

-- Stable portrait/form records. Legacy public.uniforms remains available for
-- existing account rows; appearance skills use the upstream portrait id.
create table if not exists public.character_appearances (
  id text primary key,
  character_id text not null references public.characters(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  sort_order int not null default 0,
  image_url text,
  image_local_url text,
  combat_type text check (combat_type in ('Combat','Blast','Speed','Universal','Unknown')) default 'Unknown',
  side text check (side in ('Hero','Villain','Neutral','Unknown')) default 'Unknown',
  gender text,
  species text,
  tags text[] not null default '{}',
  source_url text,
  updated_at timestamptz not null default now(),
  constraint character_appearances_character_name_uniq unique(character_id, name),
  constraint character_appearances_sort_order_check check (sort_order >= 0)
);

create unique index if not exists character_appearances_default_uniq
  on public.character_appearances(character_id)
  where is_default = true;
create index if not exists character_appearances_character_idx
  on public.character_appearances(character_id);

create table if not exists public.appearance_abilities (
  id text primary key,
  appearance_id text not null references public.character_appearances(id) on delete cascade,
  kind text not null,
  source_skill_type text not null,
  source_skill_id bigint,
  name text not null,
  cooldown numeric,
  target text,
  activation text,
  icon text,
  sort_order int not null default 0,
  source_url text,
  raw_data jsonb not null default '{}'::jsonb,
  constraint appearance_abilities_kind_check
    check (kind in ('leader','passive','uniform_effect')),
  constraint appearance_abilities_cooldown_check
    check (cooldown is null or cooldown >= 0),
  constraint appearance_abilities_sort_order_check check (sort_order >= 0),
  constraint appearance_abilities_appearance_source_type_uniq
    unique(appearance_id, source_skill_type)
);

create index if not exists appearance_abilities_appearance_kind_order_idx
  on public.appearance_abilities(appearance_id, kind, sort_order);

create table if not exists public.appearance_ability_effects (
  id text primary key,
  appearance_ability_id text not null references public.appearance_abilities(id) on delete cascade,
  stage_id bigint,
  stage_order int not null,
  effect_order int not null,
  source_effect_id bigint,
  ability_code int,
  effect_name text,
  description text not null,
  duration numeric,
  tick numeric,
  persistent boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  constraint appearance_ability_effects_stage_order_check check (stage_order > 0),
  constraint appearance_ability_effects_effect_order_check check (effect_order > 0),
  constraint appearance_ability_effects_duration_check check (duration is null or duration >= 0),
  constraint appearance_ability_effects_tick_check check (tick is null or tick >= 0),
  constraint appearance_ability_effects_ability_order_uniq
    unique(appearance_ability_id, stage_order, effect_order)
);

create index if not exists appearance_ability_effects_ability_idx
  on public.appearance_ability_effects(appearance_ability_id);

create table if not exists public.appearance_ability_coverage (
  appearance_id text not null references public.character_appearances(id) on delete cascade,
  kind text not null,
  status text not null default 'missing',
  source_url text,
  note text,
  reviewed_at timestamptz,
  primary key(appearance_id, kind),
  constraint appearance_ability_coverage_kind_check
    check (kind in ('leader','passive','uniform_effect')),
  constraint appearance_ability_coverage_status_check
    check (status in ('complete','not_applicable','missing','needs_review'))
);

create index if not exists appearance_ability_coverage_status_idx
  on public.appearance_ability_coverage(status, kind);

alter table public.character_effects
  add column if not exists portrait_id text references public.character_appearances(id) on delete cascade,
  add column if not exists uniform text;

create index if not exists character_effects_portrait_idx
  on public.character_effects(portrait_id);

create or replace view public.v_uniform_skill_matrix
with (security_invoker = true)
as
with ability_payloads as (
  select
    aa.appearance_id,
    aa.kind,
    jsonb_agg(
      jsonb_build_object(
        'id', aa.id,
        'source_skill_type', aa.source_skill_type,
        'source_skill_id', aa.source_skill_id,
        'name', aa.name,
        'cooldown', aa.cooldown,
        'target', aa.target,
        'activation', aa.activation,
        'icon', aa.icon,
        'sort_order', aa.sort_order,
        'source_url', aa.source_url,
        'effects', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', aae.id,
              'stage_id', aae.stage_id,
              'stage_order', aae.stage_order,
              'effect_order', aae.effect_order,
              'source_effect_id', aae.source_effect_id,
              'ability_code', aae.ability_code,
              'effect_name', aae.effect_name,
              'description', aae.description,
              'duration', aae.duration,
              'tick', aae.tick,
              'persistent', aae.persistent,
              'metadata', aae.metadata
            ) order by aae.stage_order, aae.effect_order, aae.id
          )
          from public.appearance_ability_effects aae
          where aae.appearance_ability_id = aa.id
        ), '[]'::jsonb)
      ) order by aa.sort_order, aa.id
    ) as abilities
  from public.appearance_abilities aa
  group by aa.appearance_id, aa.kind
), coverage_payloads as (
  select
    aac.appearance_id,
    jsonb_object_agg(
      aac.kind,
      jsonb_build_object(
        'status', aac.status,
        'source_url', aac.source_url,
        'note', aac.note,
        'reviewed_at', aac.reviewed_at
      ) order by aac.kind
    ) as coverage
  from public.appearance_ability_coverage aac
  group by aac.appearance_id
)
select
  ca.id as appearance_id,
  ca.character_id,
  c.name as character_name,
  ca.name as appearance_name,
  ca.is_default,
  ca.sort_order,
  ca.image_url,
  ca.image_local_url,
  ca.combat_type,
  ca.side,
  ca.gender,
  ca.species,
  ca.tags,
  ca.source_url,
  ca.updated_at,
  coalesce((
    select ap.abilities
    from ability_payloads ap
    where ap.appearance_id = ca.id and ap.kind = 'leader'
  ), '[]'::jsonb) as leader,
  coalesce((
    select ap.abilities
    from ability_payloads ap
    where ap.appearance_id = ca.id and ap.kind = 'passive'
  ), '[]'::jsonb) as passive,
  coalesce((
    select ap.abilities
    from ability_payloads ap
    where ap.appearance_id = ca.id and ap.kind = 'uniform_effect'
  ), '[]'::jsonb) as uniform_effect,
  coalesce(cp.coverage, '{}'::jsonb) as coverage
from public.character_appearances ca
join public.characters c on c.id = ca.character_id
left join coverage_payloads cp on cp.appearance_id = ca.id;

-- Existing views must honor the caller's RLS policies as well.
alter view if exists public.v_character_db_matrix set (security_invoker = true);
alter view if exists public.v_account_spec_matrix set (security_invoker = true);
alter view if exists public.v_alliance_battle_monthly_conditions set (security_invoker = true);

alter table public.character_appearances enable row level security;
alter table public.appearance_abilities enable row level security;
alter table public.appearance_ability_effects enable row level security;
alter table public.appearance_ability_coverage enable row level security;

drop policy if exists "public read character appearances" on public.character_appearances;
drop policy if exists "public read appearance abilities" on public.appearance_abilities;
drop policy if exists "public read appearance ability effects" on public.appearance_ability_effects;
drop policy if exists "public read appearance ability coverage" on public.appearance_ability_coverage;

create policy "public read character appearances" on public.character_appearances
  for select to anon, authenticated using (true);
create policy "public read appearance abilities" on public.appearance_abilities
  for select to anon, authenticated using (true);
create policy "public read appearance ability effects" on public.appearance_ability_effects
  for select to anon, authenticated using (true);
create policy "public read appearance ability coverage" on public.appearance_ability_coverage
  for select to anon, authenticated using (true);

revoke all privileges on table
  public.character_appearances,
  public.appearance_abilities,
  public.appearance_ability_effects,
  public.appearance_ability_coverage,
  public.v_uniform_skill_matrix
from anon, authenticated;

grant select on table
  public.character_appearances,
  public.appearance_abilities,
  public.appearance_ability_effects,
  public.appearance_ability_coverage,
  public.v_uniform_skill_matrix
to anon, authenticated;

commit;
