-- ABX / ABL 28-round monthly rotation seed.
-- Source: https://thanosvibs.money/abxl
-- Community verification channel: Naver Cafe search for "마블 퓨처파이트 ABX ABL 조건표"

insert into public.alliance_battle_rotations (
  id, name, version, starts_at, reset_timezone, source_url, community_url, note
) values (
  'mff-11-8-abxl-28-round',
  'ABX / ABL 28-Round Monthly Rotation',
  'MFF 11.8 community rotation',
  date '2026-05-15',
  'Asia/Seoul',
  'https://thanosvibs.money/abxl',
  'https://section.cafe.naver.com/ca-fe/home/search/articles?q=%EB%A7%88%EB%B8%94%20%ED%93%A8%EC%B2%98%ED%8C%8C%EC%9D%B4%ED%8A%B8%20ABX%20ABL%20%EC%A1%B0%EA%B1%B4%ED%91%9C',
  'THANO$VIB$ lists the current ABXL monthly 28-round rotation. starts_at is the app anchor for the May 2026 calendar.'
) on conflict (id) do update set
  name = excluded.name,
  version = excluded.version,
  starts_at = excluded.starts_at,
  reset_timezone = excluded.reset_timezone,
  source_url = excluded.source_url,
  community_url = excluded.community_url,
  note = excluded.note,
  updated_at = now();

with rows(round_no, mode, content, is_reset_day, restrictions, required_type, required_alignment, required_gender, required_tags, cancel_effects, note) as (
  values
    (1,'Extreme','ABX',true,array['Speed','Hero','Female']::text[],'Speed','Hero','Female',array[]::text[],array['silence','paralyze','burn']::text[],'Speed + Hero + Female'),
    (1,'Legend','ABL',true,array['Universal','Male']::text[],'Universal',null,'Male',array[]::text[],array['snare','shock','fracture']::text[],'Universal + Male'),
    (2,'Extreme','ABX',false,array['No Restrictions']::text[],null,null,null,array[]::text[],array['silence','paralyze','burn']::text[],'No Restrictions'),
    (2,'Legend','ABL',false,array['No Restrictions']::text[],null,null,null,array[]::text[],array['snare','shock','fracture']::text[],'No Restrictions'),
    (3,'Infinite Challenge','Infinity Challenge',false,array['No Restrictions']::text[],null,null,null,array[]::text[],array[]::text[],'AB Infinite Challenge'),
    (4,'Extreme','ABX',false,array['Combat','Female']::text[],'Combat',null,'Female',array[]::text[],array['silence','paralyze','burn']::text[],'Combat + Female'),
    (4,'Legend','ABL',false,array['Villain','Human']::text[],null,'Villain',null,array['human']::text[],array['snare','shock','fracture']::text[],'Villain + Human'),
    (5,'Extreme','ABX',false,array['Speed','Villain']::text[],'Speed','Villain',null,array[]::text[],array['silence','paralyze','burn']::text[],'Speed + Villain'),
    (5,'Legend','ABL',false,array['Blast','Hero']::text[],'Blast','Hero',null,array[]::text[],array['snare','shock','fracture']::text[],'Blast + Hero'),
    (6,'Extreme','ABX',false,array['Universal','Villain']::text[],'Universal','Villain',null,array[]::text[],array['silence','paralyze','burn']::text[],'Universal + Villain'),
    (6,'Legend','ABL',false,array['Combat','Villain','Male']::text[],'Combat','Villain','Male',array[]::text[],array['snare','shock','fracture']::text[],'Combat + Villain + Male'),
    (7,'Extreme','ABX',false,array['Male','Mutant']::text[],null,null,'Male',array['mutant']::text[],array['silence','paralyze','burn']::text[],'Male + Mutant'),
    (7,'Legend','ABL',false,array['Villain','Alien']::text[],null,'Villain',null,array['alien']::text[],array['snare','shock','fracture']::text[],'Villain + Alien'),
    (8,'Extreme','ABX',true,array['Combat','Hero']::text[],'Combat','Hero',null,array[]::text[],array['silence','paralyze','burn']::text[],'Combat + Hero'),
    (8,'Legend','ABL',true,array['Universal','Human']::text[],'Universal',null,null,array['human']::text[],array['snare','fracture']::text[],'Universal + Human'),
    (9,'Extreme','ABX',false,array['No Restrictions']::text[],null,null,null,array[]::text[],array['silence','paralyze','burn']::text[],'No Restrictions'),
    (9,'Legend','ABL',false,array['No Restrictions']::text[],null,null,null,array[]::text[],array['snare','shock','fracture']::text[],'No Restrictions'),
    (10,'Infinite Challenge','Infinity Challenge',false,array['No Restrictions']::text[],null,null,null,array[]::text[],array[]::text[],'AB Infinite Challenge'),
    (11,'Extreme','ABX',false,array['Combat','Hero','Human']::text[],'Combat','Hero',null,array['human']::text[],array['silence','paralyze','burn']::text[],'Combat + Hero + Human'),
    (11,'Legend','ABL',false,array['Villain','Male']::text[],null,'Villain','Male',array[]::text[],array['snare','shock','fracture']::text[],'Villain + Male'),
    (12,'Extreme','ABX',false,array['Universal','Hero','Male']::text[],'Universal','Hero','Male',array[]::text[],array['silence','paralyze','burn']::text[],'Universal + Hero + Male'),
    (12,'Legend','ABL',false,array['Hero','Female','Human']::text[],null,'Hero','Female',array['human']::text[],array['snare','shock','fracture']::text[],'Hero + Female + Human'),
    (13,'Extreme','ABX',false,array['Blast','Male']::text[],'Blast',null,'Male',array[]::text[],array['silence','paralyze']::text[],'Blast + Male'),
    (13,'Legend','ABL',false,array['Female','Mutant']::text[],null,null,'Female',array['mutant']::text[],array['snare','shock','fracture']::text[],'Female + Mutant'),
    (14,'Extreme','ABX',false,array['Villain','Mutant']::text[],null,'Villain',null,array['mutant']::text[],array['silence','paralyze','burn']::text[],'Villain + Mutant'),
    (14,'Legend','ABL',false,array['Speed','Hero','Male']::text[],'Speed','Hero','Male',array[]::text[],array['snare','shock','fracture']::text[],'Speed + Hero + Male'),
    (15,'Extreme','ABX',true,array['Universal','Villain']::text[],'Universal','Villain',null,array[]::text[],array['silence','paralyze','burn']::text[],'Universal + Villain'),
    (15,'Legend','ABL',true,array['Speed','Villain']::text[],'Speed','Villain',null,array[]::text[],array['shock','fracture']::text[],'Speed + Villain'),
    (16,'Extreme','ABX',false,array['No Restrictions']::text[],null,null,null,array[]::text[],array['silence','paralyze','burn']::text[],'No Restrictions'),
    (16,'Legend','ABL',false,array['No Restrictions']::text[],null,null,null,array[]::text[],array['snare','shock','fracture']::text[],'No Restrictions'),
    (17,'Infinite Challenge','Infinity Challenge',false,array['No Restrictions']::text[],null,null,null,array[]::text[],array[]::text[],'AB Infinite Challenge'),
    (18,'Extreme','ABX',false,array['Blast','Villain']::text[],'Blast','Villain',null,array[]::text[],array['silence','paralyze']::text[],'Blast + Villain'),
    (18,'Legend','ABL',false,array['Speed','Female']::text[],'Speed',null,'Female',array[]::text[],array['snare','shock','fracture']::text[],'Speed + Female'),
    (19,'Extreme','ABX',false,array['Universal','Hero']::text[],'Universal','Hero',null,array[]::text[],array['silence','paralyze','burn']::text[],'Universal + Hero'),
    (19,'Legend','ABL',false,array['Combat','Alien']::text[],'Combat',null,null,array['alien']::text[],array['snare','shock','fracture']::text[],'Combat + Alien'),
    (20,'Extreme','ABX',false,array['Female','Alien']::text[],null,null,'Female',array['alien']::text[],array['silence','paralyze','burn']::text[],'Female + Alien'),
    (20,'Legend','ABL',false,array['Blast','Hero','Male']::text[],'Blast','Hero','Male',array[]::text[],array['snare','shock','fracture']::text[],'Blast + Hero + Male'),
    (21,'Extreme','ABX',false,array['Blast','Female','Human']::text[],'Blast',null,'Female',array['human']::text[],array['silence','paralyze','burn']::text[],'Blast + Female + Human'),
    (21,'Legend','ABL',false,array['Inhuman']::text[],null,null,null,array['inhuman']::text[],array['snare','shock','fracture']::text[],'Inhuman'),
    (22,'Extreme','ABX',true,array['Speed','Male','Human']::text[],'Speed',null,'Male',array['human']::text[],array['silence','paralyze','burn']::text[],'Speed + Male + Human'),
    (22,'Legend','ABL',true,array['Universal','Hero','Male']::text[],'Universal','Hero','Male',array[]::text[],array['snare','shock','fracture']::text[],'Universal + Hero + Male'),
    (23,'Extreme','ABX',false,array['No Restrictions']::text[],null,null,null,array[]::text[],array['silence','paralyze','burn']::text[],'No Restrictions'),
    (23,'Legend','ABL',false,array['No Restrictions']::text[],null,null,null,array[]::text[],array['snare','shock','fracture']::text[],'No Restrictions'),
    (24,'Infinite Challenge','Infinity Challenge',false,array['No Restrictions']::text[],null,null,null,array[]::text[],array[]::text[],'AB Infinite Challenge'),
    (25,'Extreme','ABX',false,array['Hero','Male','Alien']::text[],null,'Hero','Male',array['alien']::text[],array['silence','paralyze','burn']::text[],'Hero + Male + Alien'),
    (25,'Legend','ABL',false,array['Universal','Female']::text[],'Universal',null,'Female',array[]::text[],array['snare','fracture']::text[],'Universal + Female'),
    (26,'Extreme','ABX',false,array['Combat','Villain']::text[],'Combat','Villain',null,array[]::text[],array['silence','paralyze','burn']::text[],'Combat + Villain'),
    (26,'Legend','ABL',false,array['Hero','Alien']::text[],null,'Hero',null,array['alien']::text[],array['snare','shock','fracture']::text[],'Hero + Alien'),
    (27,'Extreme','ABX',false,array['Universal','Human']::text[],'Universal',null,null,array['human']::text[],array['silence','paralyze','burn']::text[],'Universal + Human'),
    (27,'Legend','ABL',false,array['Male','Mutant']::text[],null,null,'Male',array['mutant']::text[],array['snare','shock','fracture']::text[],'Male + Mutant'),
    (28,'Extreme','ABX',false,array['Villain','Female']::text[],null,'Villain','Female',array[]::text[],array['silence','paralyze','burn']::text[],'Villain + Female'),
    (28,'Legend','ABL',false,array['Combat','Hero','Human']::text[],'Combat','Hero',null,array['human']::text[],array['snare','fracture']::text[],'Combat + Hero + Human')
)
insert into public.alliance_battle_conditions (
  id, rotation_id, round_no, mode, content, is_reset_day, restrictions,
  required_type, required_alignment, required_gender, required_tags,
  cancel_effects, source_url, note
)
select
  'mff-abxl-r' || lpad(round_no::text, 2, '0') || '-' || case when content = 'Infinity Challenge' then 'infinitychallenge' else lower(content) end,
  'mff-11-8-abxl-28-round',
  round_no,
  mode,
  content,
  is_reset_day,
  restrictions,
  required_type,
  required_alignment,
  required_gender,
  required_tags,
  cancel_effects,
  'https://thanosvibs.money/abxl',
  note
from rows
on conflict (id) do update set
  rotation_id = excluded.rotation_id,
  round_no = excluded.round_no,
  mode = excluded.mode,
  content = excluded.content,
  is_reset_day = excluded.is_reset_day,
  restrictions = excluded.restrictions,
  required_type = excluded.required_type,
  required_alignment = excluded.required_alignment,
  required_gender = excluded.required_gender,
  required_tags = excluded.required_tags,
  cancel_effects = excluded.cancel_effects,
  source_url = excluded.source_url,
  note = excluded.note,
  updated_at = now();
