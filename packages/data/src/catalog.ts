import syncedPayload from '../generated/thanosvibs.json';

export type CatalogUniform = {
  name: string;
  imageUrl?: string;
  sourceImageUrl?: string;
  acquisition?: string;
  release?: string;
  leader?: string[];
  passive?: string[];
  uniformEffect?: string[];
};

export type CatalogArtifact = {
  name: string;
  skill: string;
  imageUrl?: string;
  sourceImageUrl?: string;
  pve?: 'Low' | 'Medium' | 'High';
  pvp?: 'Low' | 'Medium' | 'High';
  effects: string[];
};

export type CatalogCharacter = {
  id: string;
  name: string;
  imageUrl: string;
  type: 'Combat' | 'Blast' | 'Speed' | 'Universal' | 'Unknown';
  side: 'Hero' | 'Villain' | 'Neutral' | 'Unknown';
  tags: string[];
  artifact?: CatalogArtifact;
  uniforms: CatalogUniform[];
  sourceStatus: 'synced' | 'manual' | 'placeholder';
};

export const slugify = (name: string) =>
  name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '').trim();

export const portraitUrl = (name: string) => `https://thanosvibs.money/static/assets/portraits/${slugify(name)}.png`;

const commonLeader = (amount = 45) => [`All Basic Attacks +${amount}%`, '조건 일치 시 ABX/ABL 추천 점수 보너스'];
const commonPassive = (damage = 35) => [`Basic Damage Dealt +${damage}%`, 'Ignore Dodge / Chain Hit 계열 버프 후보'];
const artifact = (name: string, skill: string, effects: string[] = ['Exclusive Skill 효과', 'Instinct 계수 보정']): CatalogArtifact => ({ name, skill, pve: 'Medium', pvp: 'Medium', effects });
const uni = (name: string, opts: Partial<CatalogUniform> = {}): CatalogUniform => ({
  name,
  acquisition: opts.acquisition ?? 'THANO$VIB$ sync 필요',
  release: opts.release ?? 'manual seed',
  leader: opts.leader ?? [],
  passive: opts.passive ?? [],
  uniformEffect: opts.uniformEffect ?? [],
});

const seed = (
  name: string,
  type: CatalogCharacter['type'],
  side: CatalogCharacter['side'],
  tags: string[],
  uniforms: CatalogUniform[] = [],
  art?: CatalogArtifact,
  sourceStatus: CatalogCharacter['sourceStatus'] = 'manual',
): CatalogCharacter => ({
  id: slugify(name),
  name,
  imageUrl: portraitUrl(name),
  type,
  side,
  tags,
  artifact: art,
  uniforms: uniforms.length ? uniforms : [uni('Modern', { leader: commonLeader(), passive: commonPassive() })],
  sourceStatus,
});

type GeneratedSync = {
  characters?: Array<{
    id: string;
    name: string;
    portraitUrl?: string;
    localPortraitUrl?: string;
    combatType?: CatalogCharacter['type'];
    side?: CatalogCharacter['side'];
    gender?: string;
    species?: string;
    tags?: string[];
  }>;
  uniforms?: Array<{
    characterId: string;
    name: string;
    imageUrl?: string;
    localImageUrl?: string;
    acquisition?: string;
    releaseUpdate?: string;
    releaseDate?: string;
  }>;
  artifacts?: Array<{
    characterId: string;
    name: string;
    exclusiveSkill?: string;
    pveScore?: string;
    pvpScore?: string;
    effects?: string[];
    imageUrl?: string;
    localImageUrl?: string;
  }>;
  supports?: Array<{
    characterId: string;
    uniform?: string;
    leadership?: string[];
    passive?: string[];
    uniformEffect?: string[];
    artifactExclusiveSkill?: string[];
  }>;
};

const synced = syncedPayload as GeneratedSync;

function scoreLevel(value?: string): CatalogArtifact['pve'] {
  return value === 'Low' || value === 'Medium' || value === 'High' ? value : undefined;
}

function releaseLabel(update?: string, date?: string) {
  return [update, date].filter(Boolean).join(' · ') || undefined;
}

function buildSyncedCatalogCharacters(): CatalogCharacter[] {
  const uniformsByCharacter = new Map<string, CatalogUniform[]>();
  const supportsByUniform = new Map<string, GeneratedSync['supports']>();
  const characterImageById = new Map(
    (synced.characters ?? []).map((character) => [character.id, character.localPortraitUrl ?? character.portraitUrl ?? portraitUrl(character.name)]),
  );

  for (const support of synced.supports ?? []) {
    const key = `${support.characterId}|${slugify(support.uniform ?? 'Modern')}`;
    supportsByUniform.set(key, [...(supportsByUniform.get(key) ?? []), support]);
  }

  for (const uniform of synced.uniforms ?? []) {
    const key = `${uniform.characterId}|${slugify(uniform.name)}`;
    const supportRows = supportsByUniform.get(key) ?? [];
    const catalogUniform: CatalogUniform = {
      name: uniform.name,
      imageUrl: uniform.localImageUrl ?? uniform.imageUrl,
      sourceImageUrl: uniform.imageUrl,
      acquisition: uniform.acquisition,
      release: releaseLabel(uniform.releaseUpdate, uniform.releaseDate),
      leader: mergeStringList(...supportRows.map((row) => row?.leadership ?? [])),
      passive: mergeStringList(...supportRows.map((row) => row?.passive ?? [])),
      uniformEffect: mergeStringList(...supportRows.map((row) => row?.uniformEffect ?? [])),
    };
    uniformsByCharacter.set(uniform.characterId, [...(uniformsByCharacter.get(uniform.characterId) ?? []), catalogUniform]);
  }

  for (const support of synced.supports ?? []) {
    const key = `${support.characterId}|${slugify(support.uniform ?? 'Modern')}`;
    const rows = uniformsByCharacter.get(support.characterId) ?? [];
    if (rows.some((row) => slugify(row.name) === slugify(support.uniform ?? 'Modern'))) continue;
    rows.push({
      name: support.uniform ?? 'Modern',
      imageUrl: characterImageById.get(support.characterId),
      leader: support.leadership ?? [],
      passive: support.passive ?? [],
      uniformEffect: support.uniformEffect ?? [],
    });
    uniformsByCharacter.set(support.characterId, rows);
    supportsByUniform.delete(key);
  }

  return (synced.characters ?? []).map((character) => {
    const artifactRow = (synced.artifacts ?? []).find((row) => row.characterId === character.id);
    return {
      id: character.id,
      name: character.name,
      imageUrl: character.localPortraitUrl ?? character.portraitUrl ?? portraitUrl(character.name),
      type: character.combatType ?? 'Unknown',
      side: character.side ?? 'Unknown',
      tags: mergeStringList(character.gender ? [`Gender:${character.gender}`] : [], character.species ? [`Species:${character.species}`] : [], character.tags ?? []),
      artifact: artifactRow
        ? {
            name: artifactRow.name,
            skill: artifactRow.exclusiveSkill ?? 'Exclusive Skill',
            imageUrl: artifactRow.localImageUrl ?? artifactRow.imageUrl,
            sourceImageUrl: artifactRow.imageUrl,
            pve: scoreLevel(artifactRow.pveScore),
            pvp: scoreLevel(artifactRow.pvpScore),
            effects: artifactRow.effects ?? [],
          }
        : undefined,
      uniforms: uniformsByCharacter.get(character.id) ?? [uni('Modern')],
      sourceStatus: 'synced',
    };
  });
}

const syncedCatalogCharacters = buildSyncedCatalogCharacters();

export const manualCatalogCharacters: CatalogCharacter[] = [
  seed('Abomination','Combat','Villain',['Gamma Radiation','Villain','Leadership'],[
    uni('Modern',{ leader:['All Basic Attacks +60%'], passive:['Chain Hit Damage +20%','Basic Damage Dealt to Villains +45%','Basic Damage Dealt to Heroes +45%']}),
    uni('Infected Bioweapon',{ leader:['All Basic Attacks +65%'], passive:['Ignore Dodge +45%','Basic Damage Dealt to Villains +60%','Basic Damage Dealt to Heroes +60%']})
  ], artifact('Strange Creature','Gamma Boost',['All Basic Attacks +18~25% + Instinct','Max HP +4~10% + Instinct'])),
  seed('Absorbing Man','Combat','Villain',['Durability','Villain'],[uni('Fear Itself',{passive:['Reflect 기반 회복','생존형 PvP 후보']})], artifact('Omni-Morph','Endless Absorption',['Reflect Damage 기반 HP 회복','Cooldown 1 sec'])),
  seed('Adam Warlock','Universal','Hero',['Power Cosmic','Hero','PVP'],[uni('Sovereign Savior',{passive:['Revive / Recovery','PvP 생존 보정']})], artifact('Light of Life','Miraculous Resurrection',['HP 조건 회복','Instinct 추가 회복'])),
  seed('Aero','Speed','Hero',['Agility','Hero'],[uni('Modern',{passive:['Ignore debuff chance','All Basic Attacks 증가']})], artifact('Breath of the Wind','Healing Wind',['Debuffed 조건 발동','All Basic Attacks +5~20%'])),
  seed('Agent 13','Speed','Hero',['Agent','Hero'],[uni('Modern',{passive:['Ignore Dodge','All Basic Attacks']})], artifact('Hestia-3','The Sniper',['Ignore Dodge','All Basic Attacks'])),
  seed('Agent Venom','Combat','Hero',['Symbiote','Hero'],[
    uni('All-New, All-Different',{ leader:['Physical Attack +30%'], passive:['적 HP 25% 이상 대상 피해 증가','받는 피해 감소']}),
    uni('Classic',{ leader:['Physical Attack +30%'], uniformEffect:['Chain Hit Damage Received -35%','Chain Hit Damage +20%']})
  ], artifact('Anti-Venom Legacy','Symbiote Support',['Basic Damage Dealt +5~20%','Basic Damage Received -15~30%'])),
  seed('Captain America','Combat','Hero',['Leadership','Human','Hero'],[
    uni('Galactic Talon',{acquisition:'1750 Crystals', release:'Update 11.8', leader:commonLeader(55), passive:['Hero allies damage buff','Combat 조건 가산']}),
    uni('Back to Basics',{leader:commonLeader(50), passive:commonPassive(40)}),
    uni('Phoenix Force',{leader:['All Basic Attacks +45%'], passive:['Fire Damage','Phoenix Force tag']})
  ], artifact('The First Avenger','Unbreakable Will',['All Basic Attacks','Damage to Villains'])),
  seed('Venom','Combat','Hero',['Symbiote','Strong','Hero'],[
    uni('Snow Symbiote',{acquisition:'1750 Crystals', release:'Update 11.8', leader:['Symbiote allies damage'], passive:['Self recovery','ABX Combat 후보']}),
    uni('King in Black',{passive:['Basic Damage Dealt','Heal','Symbiote synergy']})
  ], artifact('Klyntar Rage','Symbiote King',['Recovery','All Basic Attacks'])),
  seed('Stryfe','Blast','Villain',['Mutant','Villain'],[uni('The Tyrant of Spring',{acquisition:'April Fools Exclusive', release:'Update 11.7.5', leader:['Mutant allies attack'], passive:['Mind Damage','Villain damage']})], artifact('Chaos Seed','Tyrant Mind',['Mind Damage','Damage to Heroes'])),
  seed('Crystal','Blast','Hero',['Inhuman','Elemental','Hero'],[uni('Spring Lady',{acquisition:'April Fools Exclusive', release:'Update 11.7.5', leader:['Element damage'], passive:['Cold/Fire resist','Support effect 후보']})], artifact('Royal Voice','Elemental Command',['All Element Damage','Team support'])),
  seed('Kid Omega','Blast','Hero',['Mutant','Mind','Hero'],[uni('Uncanny X-Men',{release:'Update 11.7', leader:['Mind Damage +'], passive:['Mutant synergy','Mind damage buff']})], artifact('Omega Mind','Psychic Pressure',['Mind Damage','Ignore Dodge'])),
  seed('Dazzler','Blast','Hero',['Mutant','Support','Hero'],[uni('X-Song',{release:'Update 11.7', leader:['Mutant allies attack'], passive:['Boss damage support','Energy Attack support']})], artifact('Light Show','Dazzling Stage',['Mutant allies damage','Critical Rate'])),
  seed('Polaris','Blast','Hero',['Mutant','Leadership','Support'],[uni('Uncanny X-Men',{release:'Update 11.7', leader:['Mutant allies All Basic Attacks'], passive:['Support damage to Villains/Heroes']})], artifact('Magnetic Heir','Polar Field',['Mutant allies attack','Damage support'])),
  seed('Phyla-Vell','Universal','Hero',['Cosmic','Hero','Support'],[uni('Marvel Cosmic Invasion',{release:'Update 11.6.5', leader:['Universal allies attack'], passive:['Cosmic allies support','Energy damage']})], artifact('Kree Legacy','Cosmic Support',['All Basic Attacks','Boss damage'])),
  seed('Nova (Richard Rider)','Universal','Hero',['Cosmic','Hero'],[uni('Marvel Cosmic Invasion',{release:'Update 11.6.5', leader:['Universal allies attack'], passive:['PvE dealer 보정','Cosmic synergy']})], artifact('Nova Force','Human Rocket',['Energy Attack','Chain Hit'])),
  seed('Sentinel','Universal','Villain',['Machine','Mutant counter','Villain'],[uni('Stark Sentinels Mk II',{release:'Update 11.6', leader:['Machine allies attack'], passive:['Mutant 대상 보너스','PvP utility']})], artifact('Master Mold Protocol','Mutant Hunter',['Damage to Mutants','All Defense'])),
  seed('Destroyer','Universal','Villain',['Asgardian','Machine','Villain'],[uni('The Mighty Thor',{release:'Update 11.6', leader:['Lightning resist'], passive:['Reflect','PvP wall 후보']})], artifact('Enchanted Armor','Uru Shell',['Reflect','Max HP'])),
  seed('Vision','Blast','Hero',['Machine','Hero'],[uni('Ultimate Vision',{release:'Update 11.6', leader:['Energy Attack +'], passive:['Machine synergy','PvE dealer 후보']})], artifact('Density Shift','Ultimate Intellect',['Energy Attack','Skill Damage'])),
  seed('Ultron','Universal','Villain',['Machine','Villain'],[uni('All-Father Ultron',{release:'Update 11.6', leader:['Machine allies attack'], passive:['Villain dealer','PvP utility']})], artifact('Age of Ultron','Machine God',['All Basic Attacks','Damage reduction'])),
  seed('Kang the Conqueror','Universal','Villain',['Time','Villain'],[uni('Rama-Tut',{release:'Update 11.5.5b', leader:['Villain allies attack'], passive:['PvP pressure','Time tag']})], artifact('Temporal Throne','Conquest Loop',['Damage accumulation','HP recovery'])),
  seed('Scarlet Spider','Speed','Hero',['Spider-Sense','Hero'],[uni('Gift Deliverer',{release:'Update 11.5.5a', leader:['Spider-Sense allies attack'], passive:['Dodge','Chain Hit']})], artifact('Clone Web','Scarlet Sting',['Dodge','Damage to Boss'])),
  seed('Madelyne Pryor','Blast','Villain',['Mutant','Phoenix Force','Villain'],[uni('Winter Queen',{release:'Update 11.5.5a', leader:['Mutant allies attack'], passive:['Mind/Fire damage','Villain dealer']})], artifact('Goblin Queen','Inferno Crown',['Mind Damage','Damage to Heroes'])),
  seed('Luna Snow','Blast','Hero',['Cold','Female','Hero'],[uni('Light Sirius Armor',{leader:['Female allies attack'], passive:['Cold Damage','ABX/ABL 고점 후보']}), uni('Lifestyle Series 2',{passive:['Cold Damage','Proc/Rage 적합']})], artifact('Snowflake Stage','Icy Performance',['Cold Damage','All Basic Attacks'])),
  seed('Jean Grey','Universal','Hero',['Phoenix Force','Mutant','Female'],[uni('Dark Phoenix',{leader:['Mutant allies attack'], passive:['PvP sustain','Phoenix Force']})], artifact('Phoenix Egg','Rebirth Flame',['Revive','Fire Damage'])),
  seed('Thanos','Universal','Villain',['Pure Evil','Power Cosmic','Villain'],[uni('The Mad Titan',{leader:['Villain allies attack'], passive:['PvP pressure','Damage reduction']})], artifact('Infinity Gauntlet','Mad Titan Rule',['Damage to Heroes','Max HP'])),
  seed('Spider-Man','Speed','Hero',['Spider-Sense','Male','Hero'],[uni('No Way Home',{passive:['PvP dodge','Web utility']}), uni('Back to Basics',{passive:['PvE proc friendly','Spider-Sense synergy']})], artifact('Spider Signal','Friendly Neighborhood',['Dodge','Damage to Villains'])),
  seed('Doctor Strange','Blast','Hero',['Magic','Male','Hero'],[uni('Multiverse of Madness',{leader:['Energy Attack +'], passive:['Skill Damage','Magic synergy']})], artifact('Eye of Agamotto','Sorcerer Supreme',['Skill Damage','Ignore Dodge'])),
  seed('Black Panther','Combat','Hero',['Leadership','Human','Hero'],[uni('Shuri Legacy',{leader:['Hero allies attack'], passive:['Boss damage','Combat PvE']})], artifact('Heart-Shaped Herb','King of Wakanda',['All Basic Attacks','Critical Damage'])),
  seed('Shuri','Speed','Hero',['Support','Female','Hero'],[uni('Wakanda Forever',{leader:['Hero allies attack'], passive:['Damage to Villains','Support meta']})], artifact('Wakandan Genius','Princess Support',['Damage to Villains','All Basic Attacks'])),
  seed('White Fox','Speed','Hero',['Leadership','Support','Female'],[uni('Lifestyle Series 2',{leader:['Leadership allies attack'], passive:['Damage to Villains','Debuff utility']})], artifact('Fox Spirit','Leadership Charm',['Leadership allies damage','Ignore Dodge'])),
  seed('Ghost Panther','Universal','Hero',['Fire','Support','Hero'],[uni('Modern',{leader:['Fire Damage +'], passive:['Fire allies support','Damage to Villains']})], artifact('Spirit of Vengeance','Panther Flame',['Fire Damage','All Basic Attacks'])),
  seed('Nick Fury','Speed','Hero',['Leadership','Agent','Support'],[uni('Modern',{leader:['Hero allies attack'], passive:['Damage to Villains','Leadership support']})], artifact('S.H.I.E.L.D. File','Director Order',['Hero allies damage','Critical Rate'])),
  seed('Coulson','Speed','Hero',['Agent','Support','Hero'],[uni('Modern',{passive:['Damage to Villains','Critical Rate support']})], artifact('Agent Watch','Veteran Support',['Damage to Villains','Critical Damage'])),
  seed('Valkyrie','Combat','Hero',['Asgardian','Support','Female'],[uni('Love and Thunder',{leader:['All Basic Attacks'], passive:['Damage to Boss','Ignore Dodge support']})], artifact('Dragonfang','Chooser of the Slain',['Boss Damage','Ignore Dodge'])),
  seed('Beta Ray Bill','Universal','Hero',['Lightning','Leadership','Hero'],[uni('Modern',{leader:['Lightning Damage +60%'], passive:['Lightning dealer','Universal PvE']})], artifact('Stormbreaker','Korbinite Thunder',['Lightning Damage','Skill Damage'])),
  seed('Thor','Universal','Hero',['Lightning','Asgardian','Hero'],[uni('Love and Thunder',{leader:['Lightning Damage +'], passive:['Lightning damage','ABL Universal 후보']})], artifact('Mjolnir','God of Thunder',['Lightning Damage','All Basic Attacks'])),
  seed('Iron Man','Blast','Hero',['Machine','Leadership','Hero'],[uni('Back to Basics',{leader:['Blast allies attack'], passive:['Energy Attack','Proc friendly']})], artifact('Arc Reactor','Genius Billionaire',['Energy Attack','Skill Damage'])),
  seed('Black Bolt','Universal','Hero',['Inhuman','Male','Hero'],[uni('Fallen Soul',{leader:['Inhuman allies attack'], passive:['Silence/energy dealer','ABL 후보']})], artifact('Silent King','The Voice',['Energy Attack','Boss Damage'])),
  seed('Magneto','Blast','Villain',['Mutant','Leadership','Villain'],[uni('Krakoan Winter',{leader:['Mutant allies attack'], passive:['Villain dealer','Metal control']})], artifact('Magnetic Crown','Master of Magnetism',['Energy Attack','Damage to Heroes'])),
  seed('Doctor Doom','Universal','Villain',['Fantastic Four','Machine','Villain'],[uni('God Emperor',{leader:['Villain allies attack'], passive:['PvP/PvE hybrid','Damage reduction']})], artifact('Doom Mask','Sovereign Will',['All Basic Attacks','Max HP'])),
  seed('Mephisto','Blast','Villain',['Pure Evil','Fire','Villain'],[uni('Modern',{leader:['Villain allies attack'], passive:['Fire Damage','PvE dealer']})], artifact('Hellfire Contract','Lord of Hell',['Fire Damage','Damage to Heroes'])),
  seed('Scarlet Witch','Universal','Hero',['Chaos Magic','Female','Mutant'],[uni('Multiverse of Madness',{leader:['Mind Damage +'], passive:['Mind dealer','PvE blast/universal 후보']})], artifact('Darkhold Page','Chaos Magic',['Mind Damage','Skill Damage'])),
  seed('Rogue','Speed','Hero',['Mutant','Female','Hero'],[uni('Excalibur',{leader:['Speed allies attack'], passive:['Lightning damage','ABL Speed 후보']})], artifact('Power Absorption','Southern Strike',['Lightning Damage','All Basic Attacks'])),
  seed('Moon Knight','Combat','Hero',['Weapon Master','Male','Hero'],[uni('Mr. Knight',{leader:['Combat allies attack'], passive:['Physical dealer','ABX Combat']})], artifact('Crescent Darts','Fist of Khonshu',['Physical Attack','Boss Damage'])),
  seed('Carnage','Combat','Villain',['Symbiote','Male','Villain'],[uni('Absolute Carnage',{leader:['Symbiote allies attack'], passive:['PvP pressure','Bleed/Symbiote']})], artifact('Carnage Symbiote','Red Hunger',['Damage to Heroes','Recovery'])),
  seed('Green Goblin','Speed','Villain',['Sinister Six','Leadership','Villain'],[uni('Red Goblin',{leader:['Villain allies attack'], passive:['Support/dealer hybrid','Fire damage']})], artifact('Goblin Formula','Mad Formula',['Damage to Heroes','All Basic Attacks'])),
  seed('Mysterio','Blast','Villain',['Sinister Six','Villain'],[uni('Far From Home',{leader:['Villain allies attack'], passive:['Mind damage','Illusion utility']})], artifact('Illusion Tech','Master Illusionist',['Mind Damage','Dodge'])),
  seed('Gwenpool','Speed','Hero',['Weapon Master','Female','Hero'],[uni('April Pool',{leader:['Female allies attack'], passive:['Speed dealer','Proc friendly']})], artifact('Fourth Wall','Meta Cut',['Skill Damage','Critical Damage'])),
  seed('Deadpool','Speed','Hero',['Weapon Master','Mutant','Male'],[uni('Holiday Party',{leader:['All Basic Attacks'], passive:['Defense Down','PvE utility']})], artifact('Chimichanga','Merc Regen',['Recovery','Damage to Villains'])),
  seed('Cable','Blast','Hero',['Mutant','Leadership','Male'],[uni('Summer Days',{leader:['Ignore Dodge +'], passive:['Energy dealer','ABX Blast']} )], artifact('Techno Organic Arm','Future Soldier',['Ignore Dodge','Energy Attack'])),
  seed('Hulk','Combat','Hero',['Gamma Radiation','Male','Hero'],[uni('Immortal Hulk',{leader:['HP based attack'], passive:['PvP sustain','Gamma synergy']})], artifact('Green Door','Strongest There Is',['Max HP','All Basic Attacks'])),
  seed('She-Hulk','Combat','Hero',['Gamma Radiation','Female','Support'],[uni('Lawyer Up',{leader:['Damage to Male enemies'], passive:['Support utility']})], artifact('Attorney Badge','Court Power',['Damage to Male','HP'])),
  seed('Sif','Combat','Hero',['Asgardian','Female','Support'],[uni('Asgard Invasion',{leader:['Combat allies attack'], passive:['Boss damage support','Physical Attack']})], artifact('Shield Maiden','Asgardian Guard',['Boss Damage','All Basic Attacks'])),
  seed('Taskmaster','Combat','Villain',['Weapon Master','Support','Villain'],[uni('Black Widow Movie',{leader:['Weapon Master attack'], passive:['Damage to Heroes/Villains support']})], artifact('Photographic Reflexes','Copycat Combat',['Damage support','Ignore Dodge'])),
  seed('Wave','Speed','Hero',['Support','Female','Hero'],[uni('Modern',{leader:['Hero allies attack'], passive:['Damage to Villains support']})], artifact('Ocean Blessing','Wave Rider',['Hero allies damage','All Basic Attacks'])),
  seed('Ancient One','Blast','Hero',['Magic','Support','Hero'],[uni('Doctor Strange 2',{leader:['Energy Attack +'], passive:['Element damage support','Remove debuff']})], artifact('Kamar-Taj Relic','Mystic Teacher',['Energy Attack','Element Damage'])),
  seed('Proxima Midnight','Speed','Villain',['Black Order','Female','Villain'],[uni('Dark Obsidian Armor',{leader:['Villain allies attack'], passive:['Physical dealer','Black Order synergy']})], artifact('Black Order Spear','Midnight Hunt',['Physical Attack','Damage to Heroes'])),
  seed('Corvus Glaive','Speed','Villain',['Black Order','Male','Villain'],[uni('Dark Obsidian Armor',{leader:['Speed allies attack'], passive:['PvP revive/utility','Villain dealer']})], artifact('Glaive','Shadow Strike',['Dodge','Damage to Heroes'])),
  seed('Supergiant','Universal','Villain',['Black Order','Female','Mind'],[uni('Dark Obsidian Armor',{leader:['Mind Damage +'], passive:['Mind dealer','ABL Universal Villain']})], artifact('Mind Stone Echo','Black Order Mind',['Mind Damage','Energy Attack'])),
  seed('Ebony Maw','Blast','Villain',['Black Order','Support','Villain'],[uni('Dark Obsidian Armor',{leader:['Energy Attack +'], passive:['Universal damage received down','Element support']})], artifact('Maw Grimoire','Whispering Maw',['Damage reduction','Element Damage'])),
  seed('Cull Obsidian','Combat','Villain',['Black Order','Male','Villain'],[uni('Dark Obsidian Armor',{leader:['Combat attack'], passive:['Physical dealer','Tank']})], artifact('Obsidian Chain','Brutal Guard',['Physical Attack','Max HP'])),
  seed('Silver Surfer','Universal','Hero',['Power Cosmic','Male','Hero'],[uni('Black',{leader:['Universal attack'], passive:['Reflect/PvP','Cosmic synergy']})], artifact('Surfboard','Herald Light',['Reflect','All Basic Attacks'])),
  seed('Blue Dragon','Blast','Hero',['Warriors of the Sky','Lightning','Female'],[uni('Sun Bird Temple',{leader:['Lightning Damage +'], passive:['Lightning dealer','ABL blast']})], artifact('Blue Dragon Relic','Storm Dance',['Lightning Damage','All Basic Attacks'])),
  seed('Shadow Shell','Speed','Hero',['Warriors of the Sky','Poison','Female'],[uni('Moon Temple Defenders',{leader:['Poison Damage +'], passive:['Poison dealer','Speed PvE']})], artifact('Shadow Shell Relic','Toxic Guard',['Poison Damage','Skill Damage'])),
  seed('Sun Bird','Universal','Hero',['Warriors of the Sky','Fire','Male'],[uni('Moon Temple Defenders',{leader:['Fire Damage +'], passive:['Fire dealer','Support revive']})], artifact('Sun Bird Relic','Solar Blessing',['Fire Damage','Revive'])),
  seed('War Tiger','Combat','Hero',['Warriors of the Sky','Male'],[uni('Moon Temple Defenders',{leader:['Combat attack'], passive:['Physical dealer','Warriors synergy']})], artifact('War Tiger Relic','Tiger Fang',['Physical Attack','Boss Damage'])),
];

export const placeholderCatalogCharacters: CatalogCharacter[] = [
    'Black Widow','Hawkeye','Kate Bishop','Falcon','Winter Soldier','War Machine','Ant-Man','Wasp','Yellowjacket','Quicksilver','Storm','Cyclops','Wolverine','X-23','Professor X','Emma Frost','Namor','Iceman','Psylocke','Colossus','Gambit','Bishop','Jubilee','Mystique','Sabretooth','Apocalypse','Mr. Sinister','Exodus','Rachel Summers','Hope Summers','Invisible Woman','Mister Fantastic','Human Torch','The Thing','Maker','Silver Sable','Doctor Octopus','Kraven','Electro','Sandman','Rhino','Vulture','Scorpion','Kingpin','Bullseye','Daredevil','Elektra','Punisher','Luke Cage','Jessica Jones','Iron Fist','Moon Girl','Devil Dinosaur','Squirrel Girl','Ms. Marvel','Kamala Khan','Captain Marvel','Spectrum','Blue Marvel','America Chavez','Wiccan','Hulkling','Kate Pryde','Makkari','Sersi','Ikaris','Thena','Gilgamesh','Kingo','Ajak','Mantis','Star-Lord','Gamora','Rocket Raccoon','Groot','Drax','Nebula','Yondu','Adam Warlock','Moondragon','Gladiator','Quasar','Angela','Hela','Loki','Odin','Heimdall','Jane Foster','Enchantress','Skurge','Angela','Angela','Hyperion','Sentry','Ares','Moonstone','Bullseye','Songbird','Baron Zemo','Red Skull','Crossbones','Sin','Viper','Doctor Voodoo','Clea','Hellstorm','Satana','Morbius','Blade','Ghost Rider','Robbie Reyes','Man-Thing','Werewolf By Night','Elsa Bloodstone','Morgan Le Fay','Knull','Gorr','Molecule Man','Victorious','Morgan Le Fay','Ulik','Malekith','Kurse','Fandral','Volstagg','Hogun','Rescue','Ironheart','Riri Williams','Whiplash','Titania','Amadeus Cho','Red Hulk','Red She-Hulk','Skaar','A-Bomb','Betty Ross','Red Guardian','Yelena Belova','Echo','Maya Lopez','Kahhori','Misty Knight','White Tiger','Shang-Chi','Wenwu','Katy','Karnak','Medusa','Gorgon','Maximus','Quake','Phil Coulson','Lincoln Campbell','Deathlok','Lash','Crystal','Inferno','Moonstone','Klaue','Killmonger','Ulysses Klaue','M’Baku','Okoye','Nakia','Namora','M’Baku','Spider-Gwen','Spider-Woman','Silk','Spider-Man (Miles Morales)','Spider-Man 2099','Scarlet Spider','Anti-Man','Nova (Sam Alexander)','Kid Kaiju','Crescent','Io','Luna Snow','Sharon Rogers','Aero','Sword Master','Wave','White Fox'
].filter((v, i, a) => a.indexOf(v) === i).map((name, idx) => seed(
  name,
  ['Combat','Blast','Speed','Universal'][idx % 4] as CatalogCharacter['type'],
  idx % 5 === 0 ? 'Villain' : 'Hero',
  ['sync-needed'],
  [uni('Modern',{leader: commonLeader(30 + (idx % 4)*5), passive: commonPassive(25 + (idx % 5)*5)})],
  artifact(`${name} Artifact`, 'Exclusive Skill', ['THANO$VIB$ artifacts sync로 실제 효과 갱신 필요']),
  'placeholder',
));


function mergeStringList(...lists: string[][]) {
  return Array.from(new Set(lists.flat().filter(Boolean)));
}

function mergeUniforms(a: CatalogUniform[] = [], b: CatalogUniform[] = []) {
  const byName = new Map<string, CatalogUniform>();
  [...a, ...b].forEach((uniform) => {
    const key = slugify(uniform.name || 'modern');
    const prev = byName.get(key);
    if (!prev) {
      byName.set(key, { ...uniform });
      return;
    }
    byName.set(key, {
      ...prev,
      ...uniform,
      acquisition: uniform.acquisition ?? prev.acquisition,
      release: uniform.release ?? prev.release,
      leader: mergeStringList(prev.leader ?? [], uniform.leader ?? []),
      passive: mergeStringList(prev.passive ?? [], uniform.passive ?? []),
      uniformEffect: mergeStringList(prev.uniformEffect ?? [], uniform.uniformEffect ?? []),
    });
  });
  return Array.from(byName.values());
}

function mergeCharacters(items: CatalogCharacter[]) {
  const byId = new Map<string, CatalogCharacter>();

  items.forEach((character) => {
    const previous = byId.get(character.id);
    if (!previous) {
      byId.set(character.id, { ...character, tags: mergeStringList(character.tags), uniforms: mergeUniforms(character.uniforms) });
      return;
    }

    byId.set(character.id, {
      ...previous,
      // 기존 seed/manual 데이터가 보통 더 정제되어 있어서 기본값은 먼저 들어온 값을 보존함.
      // 단, 비어있거나 Unknown이면 뒤쪽 sync/placeholder 값으로 보강함.
      name: previous.name || character.name,
      imageUrl: previous.imageUrl || character.imageUrl,
      type: previous.type === 'Unknown' ? character.type : previous.type,
      side: previous.side === 'Unknown' ? character.side : previous.side,
      tags: mergeStringList(previous.tags, character.tags),
      artifact: previous.artifact ?? character.artifact,
      uniforms: mergeUniforms(previous.uniforms, character.uniforms),
      sourceStatus: previous.sourceStatus === 'placeholder' ? character.sourceStatus : previous.sourceStatus,
    });
  });

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export const syncedCatalogCharacterCount = syncedCatalogCharacters.length;
const combinedCatalogCharacters = [...syncedCatalogCharacters, ...manualCatalogCharacters];
const combinedWithPlaceholders = [...combinedCatalogCharacters, ...placeholderCatalogCharacters];

export const catalogCharacters: CatalogCharacter[] = mergeCharacters(combinedCatalogCharacters);
export const catalogCharactersWithPlaceholders: CatalogCharacter[] = mergeCharacters(combinedWithPlaceholders);

export const duplicateCharacterIds = combinedCatalogCharacters.reduce<Record<string, number>>((acc, character) => {
  acc[character.id] = (acc[character.id] ?? 0) + 1;
  return acc;
}, {});

export const catalogStats = {
  count: catalogCharacters.length,
  rawCount: combinedCatalogCharacters.length,
  syncedCount: syncedCatalogCharacters.length,
  manualCount: manualCatalogCharacters.length,
  placeholderCount: placeholderCatalogCharacters.length,
  duplicateCount: Object.values(duplicateCharacterIds).filter((count) => count > 1).length,
  source: 'synced + manual; placeholders are exported separately',
  columns: ['Character Image', 'Artifact', 'Leader/Passive Aggregate', 'Uniforms'],
};
