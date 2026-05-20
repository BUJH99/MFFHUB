import { generatedComicCards } from './generatedComicCards';

export type AccountStatKey =
  | 'allBasicAttack'
  | 'physicalAttack'
  | 'energyAttack'
  | 'maxHp'
  | 'cooldownDuration'
  | 'ignoreDefense'
  | 'ignoreDodge'
  | 'criticalRate'
  | 'criticalDamage'
  | 'attackSpeed'
  | 'elementalDamage'
  | 'instinctAttack'
  | 'pierce'
  | 'physicalDamageTakenDecrease'
  | 'energyDamageTakenDecrease'
  | 'pierceDamageTakenDecrease';

export type StatBlock = Partial<Record<AccountStatKey, number>>;

export type ComicCardType = 'Premium' | 'Semi-Premium' | 'Chest Semi-Premium' | 'Rare' | 'Rare?' | 'Support' | 'Event';

export type ComicCardDefinition = {
  id: string;
  name: string;
  type: ComicCardType;
  fixedStats: string[];
  optionalStats: Record<'stat4' | 'stat5' | 'stat6', string[]>;
  sourceImageUrl: string;
  localImageUrl?: string;
  sourceUrl: string;
  note: string;
};

export type EquippedComicCard = {
  cardId: string;
  quality: number;
  craftedStars: number;
  blueStars: number;
  attackContribution: number;
  pierce: number;
  selectedOptions: string[];
  stats: StatBlock;
  priority: 'core' | 'upgrade' | 'replace';
};

export type XSwordElementId = 'strength' | 'intelligence' | 'judgement' | 'psionic' | 'stamina' | 'dexterity';

export type XSwordElement = {
  id: XSwordElementId;
  name: string;
  koreanName: string;
  colorName: string;
  colorClass: string;
  statKey: AccountStatKey;
  statLabel: string;
  levelValues: number[];
  sourceImageUrl: string;
};

export type EquippedXSword = {
  id: string;
  elementId: XSwordElementId;
  level: number;
  runes: XSwordElementId[];
  optionStats: StatBlock;
  quality: 'shaping' | 'sharpening' | 'refining' | 'honing';
  note: string;
};

export type TeamUpCollectionTheme = {
  id: string;
  name: string;
  targetHeroIds: string[];
  targetHeroes: string[];
  iconImageUrl: string;
  sourceUrl: string;
  recommendedOptions: string[];
};

export type UserTeamUpCollection = {
  themeId: string;
  completedSteps: number;
  collectionLevel: number;
  optionLevel: number;
  appliedOption: string;
  stats: StatBlock;
  tokenProgress: number;
  tokenGoal: number;
  status: 'active' | 'farm' | 'locked';
};

export type TeamUpLevelEffect = {
  level: number;
  allBasicAttack: number;
  pierce: number;
  attackIncrease: number;
  pierceIncrease: number;
};

const THANOSVIBS = 'https://thanosvibs.money';

const statLabels: Record<AccountStatKey, string> = {
  allBasicAttack: 'All Basic Attacks',
  physicalAttack: 'Physical Attack',
  energyAttack: 'Energy Attack',
  maxHp: 'Max HP',
  cooldownDuration: 'Cooldown Duration',
  ignoreDefense: 'Ignore Defense',
  ignoreDodge: 'Ignore Dodge',
  criticalRate: 'Critical Rate',
  criticalDamage: 'Critical Damage',
  attackSpeed: 'Attack Speed',
  elementalDamage: 'Elemental Damage',
  instinctAttack: 'Instinct Attack',
  pierce: 'Pierce',
  physicalDamageTakenDecrease: 'Physical Damage Taken -',
  energyDamageTakenDecrease: 'Energy Damage Taken -',
  pierceDamageTakenDecrease: 'Pierce Damage Taken -',
};

export const comicCardDatabase: ComicCardDefinition[] = generatedComicCards;

export const equippedComicCards: EquippedComicCard[] = [
  {
    cardId: 'futurefightfirstslunasnow',
    quality: 7,
    craftedStars: 6,
    blueStars: 6,
    attackContribution: 24,
    pierce: 5,
    selectedOptions: ['Cooldown Duration', 'Critical Damage', 'Physical Defense'],
    stats: { allBasicAttack: 11, energyAttack: 13, cooldownDuration: 6, criticalDamage: 5, pierce: 5 },
    priority: 'core',
  },
  {
    cardId: 'futurefightfirstswhitefox',
    quality: 7,
    craftedStars: 6,
    blueStars: 6,
    attackContribution: 25,
    pierce: 5,
    selectedOptions: ['Attack Speed', 'Critical Rate', 'Energy Attack'],
    stats: { allBasicAttack: 12, energyAttack: 8, physicalAttack: 5, ignoreDefense: 6, criticalDamage: 6, pierce: 5 },
    priority: 'core',
  },
  {
    cardId: 'blackpanther166',
    quality: 7,
    craftedStars: 6,
    blueStars: 6,
    attackContribution: 25,
    pierce: 5,
    selectedOptions: ['Energy Attack', 'Critical Rate', 'Physical Attack'],
    stats: { allBasicAttack: 13, physicalAttack: 6, energyAttack: 6, cooldownDuration: 6, criticalDamage: 6, pierce: 5 },
    priority: 'core',
  },
  {
    cardId: 'amazingspiderman1999605',
    quality: 6,
    craftedStars: 6,
    blueStars: 6,
    attackContribution: 20,
    pierce: 5,
    selectedOptions: ['Energy Attack', 'Cooldown Duration', 'Critical Damage'],
    stats: { allBasicAttack: 10, energyAttack: 6, physicalAttack: 4, ignoreDefense: 6, attackSpeed: 5, pierce: 5 },
    priority: 'upgrade',
  },
  {
    cardId: 'futurefightfirstscrescentandio',
    quality: 7,
    craftedStars: 6,
    blueStars: 6,
    attackContribution: 24,
    pierce: 5,
    selectedOptions: ['Ignore Defense', 'Critical Damage', 'Energy Attack'],
    stats: { allBasicAttack: 12, energyAttack: 7, physicalAttack: 5, maxHp: 11, ignoreDefense: 6, pierce: 5 },
    priority: 'core',
  },
];

export const xSwordElements: XSwordElement[] = [
  {
    id: 'strength',
    name: 'Strength',
    koreanName: '힘',
    colorName: 'Orange',
    colorClass: 'bg-orange-500',
    statKey: 'physicalAttack',
    statLabel: 'Physical Attack',
    levelValues: [3, 5, 6, 9, 12, 15],
    sourceImageUrl: `${THANOSVIBS}/static/assets/items/sword_strength.png`,
  },
  {
    id: 'intelligence',
    name: 'Intelligence',
    koreanName: '지능',
    colorName: 'Yellow',
    colorClass: 'bg-yellow-400',
    statKey: 'energyDamageTakenDecrease',
    statLabel: 'Energy Damage Taken -',
    levelValues: [2, 3, 4, 5, 7, 9],
    sourceImageUrl: `${THANOSVIBS}/static/assets/items/sword_intelligence.png`,
  },
  {
    id: 'judgement',
    name: 'Judgement',
    koreanName: '심판',
    colorName: 'Red',
    colorClass: 'bg-red-500',
    statKey: 'pierceDamageTakenDecrease',
    statLabel: 'Pierce Damage Taken -',
    levelValues: [3, 4, 5, 7, 9, 12],
    sourceImageUrl: `${THANOSVIBS}/static/assets/items/sword_judgement.png`,
  },
  {
    id: 'psionic',
    name: 'Psionic',
    koreanName: '사이오닉',
    colorName: 'Purple',
    colorClass: 'bg-purple-500',
    statKey: 'energyAttack',
    statLabel: 'Energy Attack',
    levelValues: [3, 5, 6, 9, 12, 15],
    sourceImageUrl: `${THANOSVIBS}/static/assets/items/sword_psionic.png`,
  },
  {
    id: 'stamina',
    name: 'Stamina',
    koreanName: '체력',
    colorName: 'Green',
    colorClass: 'bg-emerald-500',
    statKey: 'physicalDamageTakenDecrease',
    statLabel: 'Physical Damage Taken -',
    levelValues: [2, 3, 4, 5, 7, 9],
    sourceImageUrl: `${THANOSVIBS}/static/assets/items/sword_stamina.png`,
  },
  {
    id: 'dexterity',
    name: 'Dexterity',
    koreanName: '민첩',
    colorName: 'Blue',
    colorClass: 'bg-sky-500',
    statKey: 'instinctAttack',
    statLabel: 'Instinct Attack',
    levelValues: [300, 500, 1000, 1600, 2000, 2400],
    sourceImageUrl: `${THANOSVIBS}/static/assets/items/sword_dexterity.png`,
  },
];

export const equippedXSwords: EquippedXSword[] = [
  {
    id: 'sword-psionic-5',
    elementId: 'psionic',
    level: 5,
    runes: ['psionic', 'psionic', 'psionic', 'psionic', 'psionic', 'judgement'],
    optionStats: { cooldownDuration: 4, elementalDamage: 3 },
    quality: 'refining',
    note: '에너지 딜러 계정의 우선 축. +6 후보.',
  },
  {
    id: 'sword-strength-5',
    elementId: 'strength',
    level: 5,
    runes: ['strength', 'strength', 'strength', 'strength', 'strength', 'dexterity'],
    optionStats: { ignoreDodge: 3, physicalAttack: 2 },
    quality: 'refining',
    note: '컴뱃/물공 딜러 보강용. +6 후보.',
  },
  {
    id: 'sword-dexterity-5',
    elementId: 'dexterity',
    level: 5,
    runes: ['dexterity', 'dexterity', 'dexterity', 'dexterity', 'dexterity', 'stamina'],
    optionStats: { instinctAttack: 600, cooldownDuration: 2 },
    quality: 'refining',
    note: 'T4/아티팩트 계수 보정용.',
  },
  {
    id: 'sword-judgement-5',
    elementId: 'judgement',
    level: 5,
    runes: ['judgement', 'judgement', 'judgement', 'judgement', 'judgement', 'intelligence'],
    optionStats: { pierceDamageTakenDecrease: 2 },
    quality: 'refining',
    note: '아더월드/타임라인 생존 보강.',
  },
  {
    id: 'sword-stamina-4',
    elementId: 'stamina',
    level: 4,
    runes: ['stamina', 'stamina', 'stamina', 'stamina', 'strength', 'psionic'],
    optionStats: { maxHp: 3 },
    quality: 'sharpening',
    note: '방어 쪽 원소 레벨 유지 슬롯.',
  },
  {
    id: 'sword-intelligence-4',
    elementId: 'intelligence',
    level: 4,
    runes: ['intelligence', 'intelligence', 'intelligence', 'intelligence', 'psionic', 'stamina'],
    optionStats: { energyDamageTakenDecrease: 2 },
    quality: 'sharpening',
    note: '마스터리 합산용. +5 이상 목표.',
  },
];

export const teamUpCollectionThemes: TeamUpCollectionTheme[] = [
  {
    id: 'midnight-suns',
    name: 'Midnight Suns',
    targetHeroIds: ['ghost-rider', 'blade', 'doctor-strange', 'iron-fist', 'moon-knight', 'wong', 'doctor-voodoo', 'scarlet-spider', 'man-thing'],
    targetHeroes: ['Ghost Rider', 'Blade', 'Doctor Strange', 'Iron Fist', 'Moon Knight', 'Wong', 'Doctor Voodoo', 'Scarlet Spider', 'Man-Thing'],
    iconImageUrl: '/mff-assets/teamups/midnight-suns.svg',
    sourceUrl: 'https://future-fight.fandom.com/wiki/Team-Up_Collection',
    recommendedOptions: ['Energy Attack', 'All Basic Attacks', 'Skill Cooldown'],
  },
  {
    id: 'sinister-six',
    name: 'Sinister Six',
    targetHeroIds: ['doctor-octopus', 'green-goblin', 'venom', 'sandman', 'lizard', 'kraven', 'mysterio', 'vulture', 'electro'],
    targetHeroes: ['Doctor Octopus', 'Green Goblin', 'Venom', 'Sandman', 'Lizard', 'Kraven the Hunter', 'Mysterio', 'Vulture', 'Electro'],
    iconImageUrl: '/mff-assets/teamups/sinister-six.svg',
    sourceUrl: 'https://future-fight.fandom.com/wiki/Team-Up_Collection',
    recommendedOptions: ['Physical Attack', 'All Basic Attacks', 'Ignore Dodge'],
  },
  {
    id: 'x-force',
    name: 'X-Force',
    targetHeroIds: ['wolverine', 'storm', 'cable', 'x23', 'angel', 'deadpool', 'domino', 'nightcrawler', 'warpath', 'bishop'],
    targetHeroes: ['Wolverine', 'Storm', 'Cable', 'X-23', 'Angel', 'Deadpool', 'Domino', 'Nightcrawler', 'Warpath', 'Bishop'],
    iconImageUrl: '/mff-assets/teamups/x-force.svg',
    sourceUrl: 'https://future-fight.fandom.com/wiki/Team-Up_Collection',
    recommendedOptions: ['All Basic Attacks', 'Physical Attack', 'Energy Attack'],
  },
  {
    id: 'guardians',
    name: 'Guardians of the Galaxy',
    targetHeroIds: ['rocket-raccoon', 'groot', 'gamora', 'drax', 'star-lord', 'mantis', 'adam-warlock', 'beta-ray-bill', 'phyla-vell', 'nova-richard-rider', 'quasar-wendell-vaughn'],
    targetHeroes: ['Rocket Raccoon', 'Groot', 'Gamora', 'Drax', 'Star-Lord', 'Mantis', 'Adam Warlock', 'Beta Ray Bill', 'Phyla-Vell', 'Nova (Richard Rider)', 'Quasar (Wendell Vaughn)'],
    iconImageUrl: '/mff-assets/teamups/guardians.svg',
    sourceUrl: 'https://future-fight.fandom.com/wiki/Team-Up_Collection',
    recommendedOptions: ['All Basic Attacks', 'Skill Cooldown', 'Max HP'],
  },
  {
    id: 'avengers-part-1',
    name: 'The Avengers Part. 1',
    targetHeroIds: ['captain-america', 'hulk', 'iron-man', 'black-widow', 'thor', 'spider-man', 'hawkeye', 'captain-marvel', 'vision', 'ant-man', 'wasp'],
    targetHeroes: ['Captain America', 'Hulk', 'Iron Man', 'Black Widow', 'Thor', 'Spider-Man', 'Hawkeye', 'Captain Marvel', 'Vision', 'Ant-Man', 'Wasp'],
    iconImageUrl: '/mff-assets/teamups/avengers.svg',
    sourceUrl: 'https://future-fight.fandom.com/wiki/Team-Up_Collection',
    recommendedOptions: ['All Basic Attacks', 'Pierce', 'Max HP'],
  },
  {
    id: 'symbiote',
    name: 'Symbiote',
    targetHeroIds: ['spider-man', 'green-goblin', 'malekith', 'venom', 'spider-man-miles-morales', 'carnage', 'agent-venom', 'silver-surfer', 'scream', 'knull', 'toxin', 'sleeper'],
    targetHeroes: ['Spider-Man', 'Green Goblin', 'Malekith', 'Venom', 'Spider-Man (Miles Morales)', 'Carnage', 'Agent Venom', 'Silver Surfer', 'Scream', 'Knull', 'Toxin', 'Sleeper'],
    iconImageUrl: '/mff-assets/teamups/symbiote.svg',
    sourceUrl: 'https://future-fight.fandom.com/wiki/Team-Up_Collection',
    recommendedOptions: ['All Basic Attacks', 'Max HP', 'Basic Damage'],
  },
  {
    id: 'defenders',
    name: 'Defenders',
    targetHeroIds: ['hulk', 'daredevil', 'doctor-strange', 'iron-fist', 'valkyrie', 'namor', 'luke-cage', 'jessica-jones', 'misty-knight', 'silver-surfer'],
    targetHeroes: ['Hulk', 'Daredevil', 'Doctor Strange', 'Iron Fist', 'Valkyrie', 'Namor', 'Luke Cage', 'Jessica Jones', 'Misty Knight', 'Silver Surfer'],
    iconImageUrl: '/mff-assets/teamups/defenders.svg',
    sourceUrl: 'https://future-fight.fandom.com/wiki/Team-Up_Collection',
    recommendedOptions: ['Max HP', 'All Basic Attacks', 'Damage Reduction'],
  },
  {
    id: 'fantastic-four',
    name: 'Fantastic Four',
    targetHeroIds: ['invisible-woman', 'spider-man', 'mister-fantastic', 'medusa', 'human-torch', 'luke-cage', 'black-panther', 'the-thing', 'she-hulk', 'crystal', 'ant-man', 'iceman', 'moon-girl'],
    targetHeroes: ['Invisible Woman', 'Spider-Man', 'Mister Fantastic', 'Medusa', 'Human Torch', 'Luke Cage', 'Black Panther', 'Thing', 'She-Hulk', 'Crystal', 'Ant-Man', 'Iceman', 'Moon Girl'],
    iconImageUrl: '/mff-assets/teamups/fantastic-four.svg',
    sourceUrl: 'https://apps.apple.com/us/app/marvel-future-fight/id955705796',
    recommendedOptions: ['All Basic Attacks', 'Max HP', 'Skill Cooldown'],
  },
];

export const teamUpLevelEffects: TeamUpLevelEffect[] = [
  { level: 1, allBasicAttack: 1, pierce: 0, attackIncrease: 1, pierceIncrease: 0 },
  { level: 2, allBasicAttack: 2, pierce: 0, attackIncrease: 1, pierceIncrease: 0 },
  { level: 3, allBasicAttack: 4, pierce: 0, attackIncrease: 2, pierceIncrease: 0 },
  { level: 4, allBasicAttack: 5, pierce: 0, attackIncrease: 1, pierceIncrease: 0 },
  { level: 5, allBasicAttack: 6, pierce: 0, attackIncrease: 1, pierceIncrease: 0 },
  { level: 6, allBasicAttack: 9, pierce: 1, attackIncrease: 3, pierceIncrease: 1 },
  { level: 7, allBasicAttack: 10, pierce: 1, attackIncrease: 1, pierceIncrease: 0 },
  { level: 8, allBasicAttack: 11, pierce: 1, attackIncrease: 1, pierceIncrease: 0 },
  { level: 9, allBasicAttack: 15, pierce: 2, attackIncrease: 4, pierceIncrease: 1 },
  { level: 10, allBasicAttack: 16, pierce: 2, attackIncrease: 1, pierceIncrease: 0 },
  { level: 11, allBasicAttack: 17, pierce: 2, attackIncrease: 1, pierceIncrease: 0 },
  { level: 12, allBasicAttack: 22, pierce: 3, attackIncrease: 5, pierceIncrease: 1 },
  { level: 13, allBasicAttack: 23, pierce: 3, attackIncrease: 1, pierceIncrease: 0 },
  { level: 14, allBasicAttack: 24, pierce: 3, attackIncrease: 1, pierceIncrease: 0 },
  { level: 15, allBasicAttack: 30, pierce: 5, attackIncrease: 6, pierceIncrease: 2 },
  { level: 16, allBasicAttack: 31, pierce: 5, attackIncrease: 1, pierceIncrease: 0 },
  { level: 17, allBasicAttack: 32, pierce: 5, attackIncrease: 1, pierceIncrease: 0 },
  { level: 18, allBasicAttack: 40, pierce: 10, attackIncrease: 8, pierceIncrease: 5 },
];

const teamUpLevelEffectByLevel = new Map(teamUpLevelEffects.map((effect) => [effect.level, effect]));
const teamUpMaxLevel = teamUpLevelEffects[teamUpLevelEffects.length - 1]?.level ?? 18;

export function getTeamUpLevelEffect(level: unknown): TeamUpLevelEffect | undefined {
  const number = Number(level);
  if (!Number.isFinite(number)) return undefined;
  const normalizedLevel = Math.min(teamUpMaxLevel, Math.max(0, Math.round(number)));
  return teamUpLevelEffectByLevel.get(normalizedLevel);
}

export function getTeamUpLevelStats(level: unknown): StatBlock {
  const effect = getTeamUpLevelEffect(level);
  if (!effect) return {};
  return {
    allBasicAttack: effect.allBasicAttack,
    ...(effect.pierce > 0 ? { pierce: effect.pierce } : {}),
  };
}

export const userTeamUpCollections: UserTeamUpCollection[] = [
  {
    themeId: 'midnight-suns',
    completedSteps: 4,
    collectionLevel: 4,
    optionLevel: 4,
    appliedOption: 'All Basic Attack + Additional Pierce Damage',
    stats: getTeamUpLevelStats(4),
    tokenProgress: 260,
    tokenGoal: 520,
    status: 'farm',
  },
  {
    themeId: 'sinister-six',
    completedSteps: 0,
    collectionLevel: 0,
    optionLevel: 0,
    appliedOption: 'All Basic Attack + Additional Pierce Damage',
    stats: {},
    tokenProgress: 0,
    tokenGoal: 0,
    status: 'locked',
  },
  {
    themeId: 'x-force',
    completedSteps: 6,
    collectionLevel: 6,
    optionLevel: 6,
    appliedOption: 'All Basic Attack + Additional Pierce Damage',
    stats: getTeamUpLevelStats(6),
    tokenProgress: 540,
    tokenGoal: 900,
    status: 'active',
  },
  {
    themeId: 'guardians',
    completedSteps: 3,
    collectionLevel: 3,
    optionLevel: 3,
    appliedOption: 'All Basic Attack + Additional Pierce Damage',
    stats: getTeamUpLevelStats(3),
    tokenProgress: 140,
    tokenGoal: 420,
    status: 'farm',
  },
  {
    themeId: 'avengers-part-1',
    completedSteps: 7,
    collectionLevel: 7,
    optionLevel: 7,
    appliedOption: 'All Basic Attack + Additional Pierce Damage',
    stats: getTeamUpLevelStats(7),
    tokenProgress: 820,
    tokenGoal: 1200,
    status: 'active',
  },
  {
    themeId: 'symbiote',
    completedSteps: 5,
    collectionLevel: 5,
    optionLevel: 5,
    appliedOption: 'All Basic Attack + Additional Pierce Damage',
    stats: getTeamUpLevelStats(5),
    tokenProgress: 340,
    tokenGoal: 720,
    status: 'farm',
  },
  {
    themeId: 'defenders',
    completedSteps: 0,
    collectionLevel: 0,
    optionLevel: 0,
    appliedOption: 'All Basic Attack + Additional Pierce Damage',
    stats: {},
    tokenProgress: 0,
    tokenGoal: 0,
    status: 'locked',
  },
  {
    themeId: 'fantastic-four',
    completedSteps: 0,
    collectionLevel: 0,
    optionLevel: 0,
    appliedOption: 'All Basic Attack + Additional Pierce Damage',
    stats: {},
    tokenProgress: 0,
    tokenGoal: 0,
    status: 'locked',
  },
];

const masteryAttackTable: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 11,
  12: 12,
  13: 13,
  14: 14,
  15: 15,
  16: 16.5,
  17: 18,
  18: 19.5,
  19: 21,
  20: 22.5,
  21: 24,
  22: 25.5,
  23: 27,
  24: 28.5,
  25: 30,
  26: 31.5,
  27: 33,
  28: 34.5,
  29: 36,
  30: 37.5,
  31: 39.5,
  32: 41.5,
  33: 43.5,
  34: 45.5,
  35: 47.5,
  36: 50,
};

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function sumStats(items: Array<{ stats: StatBlock }>) {
  return items.reduce<StatBlock>((total, item) => {
    for (const [key, value] of Object.entries(item.stats)) {
      const statKey = key as AccountStatKey;
      total[statKey] = round1((total[statKey] ?? 0) + Number(value ?? 0));
    }
    return total;
  }, {});
}

export function statLabel(key: AccountStatKey) {
  return statLabels[key];
}

export function getComicCard(cardId: string) {
  return comicCardDatabase.find((card) => card.id === cardId);
}

export function getXSwordElement(elementId: XSwordElementId) {
  return xSwordElements.find((element) => element.id === elementId);
}

export function getTeamUpTheme(themeId: string) {
  return teamUpCollectionThemes.find((theme) => theme.id === themeId);
}

export function getElementLevels(swords = equippedXSwords) {
  const levels = Object.fromEntries(xSwordElements.map((element) => [element.id, 0])) as Record<XSwordElementId, number>;
  for (const sword of swords) {
    levels[sword.elementId] = Math.min(6, levels[sword.elementId] + sword.level);
  }
  return levels;
}

export function getSwordStats(swords = equippedXSwords) {
  const levels = getElementLevels(swords);
  const stats: StatBlock = {};

  for (const element of xSwordElements) {
    const level = levels[element.id];
    if (level <= 0) continue;
    stats[element.statKey] = element.levelValues[level - 1];
  }

  for (const sword of swords) {
    for (const [key, value] of Object.entries(sword.optionStats)) {
      const statKey = key as AccountStatKey;
      stats[statKey] = round1((stats[statKey] ?? 0) + Number(value ?? 0));
    }
  }

  const masteryLevel = Object.values(levels).reduce((sum, level) => sum + Math.min(6, level), 0);
  stats.allBasicAttack = round1((stats.allBasicAttack ?? 0) + (masteryAttackTable[masteryLevel] ?? 0));
  return { levels, masteryLevel, masteryAllAttack: masteryAttackTable[masteryLevel] ?? 0, stats };
}

export function getTeamUpStats(collections = userTeamUpCollections) {
  return sumStats(collections);
}

export function getTeamUpAttackBonusForCharacter(characterId: string) {
  const matching = userTeamUpCollections
    .map((collection) => ({ collection, theme: getTeamUpTheme(collection.themeId) }))
    .filter(({ theme }) => theme?.targetHeroIds.includes(characterId))
    .sort((a, b) => b.collection.collectionLevel - a.collection.collectionLevel)[0];

  if (!matching) return 0;
  const stats = matching.collection.stats;
  return round1((stats.allBasicAttack ?? 0) + (stats.physicalAttack ?? 0) * 0.5 + (stats.energyAttack ?? 0) * 0.5);
}

export const teamUpAttackBonusByCharacter = Object.fromEntries(
  Array.from(
    new Set(
      userTeamUpCollections.flatMap((collection) => getTeamUpTheme(collection.themeId)?.targetHeroIds ?? []),
    ),
  ).map((characterId) => [characterId, getTeamUpAttackBonusForCharacter(characterId)]),
);

export function getTeamUpCoverage(characterIds: string[]) {
  const owned = new Set(characterIds);
  return userTeamUpCollections.map((collection) => {
    const theme = getTeamUpTheme(collection.themeId);
    const covered = theme?.targetHeroIds.filter((id) => owned.has(id)).length ?? 0;
    const total = theme?.targetHeroIds.length ?? 0;
    return {
      collection,
      theme,
      covered,
      total,
      coverage: total ? Math.round((covered / total) * 100) : 0,
    };
  });
}

const cardStats = sumStats(equippedComicCards);
const swordStats = getSwordStats(equippedXSwords);
const teamUpStats = getTeamUpStats(userTeamUpCollections);

const cardAttack = equippedComicCards.reduce((sum, card) => sum + card.attackContribution, 0);
const teamUpAttackBudget = round1((teamUpStats.allBasicAttack ?? 0) + (teamUpStats.physicalAttack ?? 0) * 0.5 + (teamUpStats.energyAttack ?? 0) * 0.5);

export const accountSpecSummary = {
  cardAttack,
  cardPierce: equippedComicCards.reduce((sum, card) => sum + card.pierce, 0),
  cardStats,
  equippedCardCount: equippedComicCards.length,
  fullyCraftedCards: equippedComicCards.filter((card) => card.craftedStars === 6).length,
  fullBlueCards: equippedComicCards.filter((card) => card.blueStars === 6).length,
  swordMasteryLevel: swordStats.masteryLevel,
  swordMasteryAllAttack: swordStats.masteryAllAttack,
  swordStats: swordStats.stats,
  swordLevels: swordStats.levels,
  teamUpStats,
  activeTeamUpCollections: userTeamUpCollections.filter((collection) => collection.status !== 'locked').length,
  teamUpAttackBudget,
  accountAttack: round1(cardAttack + swordStats.masteryAllAttack),
  totalPierce: equippedComicCards.reduce((sum, card) => sum + card.pierce, 0) + (teamUpStats.pierce ?? 0),
  sourceLabel: 'cards/swords + Future Fight Wiki/App Store team-up themes + 커뮤니티 세팅 메모',
};

export const accountSpecRecommendations = [
  equippedComicCards.some((card) => card.priority === 'upgrade')
    ? 'Baby Spidey 카드 품질 7 재굴림 또는 Best Story Ever 교체 후보를 비교하세요.'
    : '카드 5장 모두 코어급입니다.',
  swordStats.masteryLevel < 30
    ? `X-소드 마스터리 ${swordStats.masteryLevel}/36: 지능/체력 슬롯을 +5로 올리면 올공 37.5% 구간에 가까워집니다.`
    : 'X-소드 +5 이상 분산 세팅이 안정권입니다.',
  '팀업 컬렉션은 대상 영웅에게만 적용되므로 Avengers/X-Force/Symbiote 중 현재 로스터 주력과 겹치는 테마를 먼저 올리세요.',
];
