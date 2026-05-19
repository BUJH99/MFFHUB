-- Optional seed data for account-level MFF specs.
-- Run after supabase/schema.sql when you want local reference rows for X-Swords and Team-Up Collections.

insert into public.x_sword_elements (id, name, korean_name, color_name, stat_key, stat_label, level_values, image_url, source_url)
values
  ('strength', 'Strength', '힘', 'Orange', 'physicalAttack', 'Physical Attack', '[3,5,6,9,12,15]'::jsonb, 'https://thanosvibs.money/static/assets/items/sword_strength.png', 'https://thanosvibs.money/dailybuggle/script_guide_swords'),
  ('intelligence', 'Intelligence', '지능', 'Yellow', 'energyDamageTakenDecrease', 'Decrease Energy Damage Taken', '[2,3,4,5,7,9]'::jsonb, 'https://thanosvibs.money/static/assets/items/sword_intelligence.png', 'https://thanosvibs.money/dailybuggle/script_guide_swords'),
  ('judgement', 'Judgement', '심판', 'Red', 'pierceDamageTakenDecrease', 'Decrease Pierce Damage Taken', '[3,4,5,7,9,12]'::jsonb, 'https://thanosvibs.money/static/assets/items/sword_judgement.png', 'https://thanosvibs.money/dailybuggle/script_guide_swords'),
  ('psionic', 'Psionic', '사이오닉', 'Purple', 'energyAttack', 'Energy Attack', '[3,5,6,9,12,15]'::jsonb, 'https://thanosvibs.money/static/assets/items/sword_psionic.png', 'https://thanosvibs.money/dailybuggle/script_guide_swords'),
  ('stamina', 'Stamina', '체력', 'Green', 'physicalDamageTakenDecrease', 'Decrease Physical Damage Taken', '[2,3,4,5,7,9]'::jsonb, 'https://thanosvibs.money/static/assets/items/sword_stamina.png', 'https://thanosvibs.money/dailybuggle/script_guide_swords'),
  ('dexterity', 'Dexterity', '민첩', 'Blue', 'instinctAttack', 'Instinct Attack', '[300,500,1000,1600,2000,2400]'::jsonb, 'https://thanosvibs.money/static/assets/items/sword_dexterity.png', 'https://thanosvibs.money/dailybuggle/script_guide_swords')
on conflict (id) do update set
  name = excluded.name,
  korean_name = excluded.korean_name,
  color_name = excluded.color_name,
  stat_key = excluded.stat_key,
  stat_label = excluded.stat_label,
  level_values = excluded.level_values,
  image_url = excluded.image_url,
  source_url = excluded.source_url;

insert into public.team_up_collections (id, name, target_hero_ids, target_heroes, icon_image_url, source_url, recommended_options)
values
  ('midnight-suns', 'Midnight Suns',
   array['ghost-rider','blade','doctor-strange','iron-fist','moon-knight','wong','doctor-voodoo','scarlet-spider','man-thing'],
   array['Ghost Rider','Blade','Doctor Strange','Iron Fist','Moon Knight','Wong','Doctor Voodoo','Scarlet Spider','Man-Thing'],
   '/mff-assets/characters/doctorstrange6.webp', 'https://future-fight.fandom.com/wiki/Team-Up_Collection', array['Energy Attack','All Basic Attacks','Skill Cooldown']),
  ('sinister-six', 'Sinister Six',
   array['doctor-octopus','green-goblin','venom','sandman','lizard','kraven','mysterio','vulture','electro'],
   array['Doctor Octopus','Green Goblin','Venom','Sandman','Lizard','Kraven the Hunter','Mysterio','Vulture','Electro'],
   '/mff-assets/characters/greengoblin4.webp', 'https://future-fight.fandom.com/wiki/Team-Up_Collection', array['Physical Attack','All Basic Attacks','Ignore Dodge']),
  ('x-force', 'X-Force',
   array['wolverine','storm','cable','x23','angel','deadpool','domino','nightcrawler','warpath','bishop'],
   array['Wolverine','Storm','Cable','X-23','Angel','Deadpool','Domino','Nightcrawler','Warpath','Bishop'],
   '/mff-assets/characters/wolverine7.webp', 'https://future-fight.fandom.com/wiki/Team-Up_Collection', array['All Basic Attacks','Physical Attack','Energy Attack']),
  ('guardians', 'Guardians of the Galaxy',
   array['rocket-raccoon','groot','gamora','drax','star-lord','mantis','adam-warlock','beta-ray-bill','phyla-vell','nova-richard-rider','quasar-wendell-vaughn'],
   array['Rocket Raccoon','Groot','Gamora','Drax','Star-Lord','Mantis','Adam Warlock','Beta Ray Bill','Phyla-Vell','Nova (Richard Rider)','Quasar (Wendell Vaughn)'],
   '/mff-assets/characters/starlord6.webp', 'https://future-fight.fandom.com/wiki/Team-Up_Collection', array['All Basic Attacks','Skill Cooldown','Max HP']),
  ('avengers-part-1', 'The Avengers Part. 1',
   array['captain-america','hulk','iron-man','black-widow','thor','spider-man','hawkeye','captain-marvel','vision','ant-man','wasp'],
   array['Captain America','Hulk','Iron Man','Black Widow','Thor','Spider-Man','Hawkeye','Captain Marvel','Vision','Ant-Man','Wasp'],
   '/mff-assets/characters/captainamerica15.webp', 'https://future-fight.fandom.com/wiki/Team-Up_Collection', array['All Basic Attacks','Pierce','Max HP']),
  ('symbiote', 'Symbiote',
   array['spider-man','green-goblin','malekith','venom','spider-man-miles-morales','carnage','agent-venom','silver-surfer','scream','knull','toxin','sleeper'],
   array['Spider-Man','Green Goblin','Malekith','Venom','Spider-Man (Miles Morales)','Carnage','Agent Venom','Silver Surfer','Scream','Knull','Toxin','Sleeper'],
   '/mff-assets/characters/venom6.webp', 'https://future-fight.fandom.com/wiki/Team-Up_Collection', array['All Basic Attacks','Max HP','Basic Damage']),
  ('defenders', 'Defenders',
   array['hulk','daredevil','doctor-strange','iron-fist','valkyrie','namor','luke-cage','jessica-jones','misty-knight','silver-surfer'],
   array['Hulk','Daredevil','Doctor Strange','Iron Fist','Valkyrie','Namor','Luke Cage','Jessica Jones','Misty Knight','Silver Surfer'],
   '/mff-assets/characters/valkyrie2.webp', 'https://future-fight.fandom.com/wiki/Team-Up_Collection', array['Max HP','All Basic Attacks','Damage Reduction'])
on conflict (id) do update set
  name = excluded.name,
  target_hero_ids = excluded.target_hero_ids,
  target_heroes = excluded.target_heroes,
  icon_image_url = excluded.icon_image_url,
  source_url = excluded.source_url,
  recommended_options = excluded.recommended_options,
  updated_at = now();

