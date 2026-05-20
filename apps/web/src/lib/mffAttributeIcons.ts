const ATTRIBUTE_ICON_BASE = 'https://thanosvibs.money/static/attributes';

export type AttributeFilterKey = 'type' | 'species' | 'gender' | 'side' | 'instinct' | 'ability';

export type MffAttributeIcon = {
  key: string;
  group: AttributeFilterKey;
  label: string;
  src: string;
};

export type FilterIconGroup = {
  key: AttributeFilterKey;
  label: string;
  options: MffAttributeIcon[];
};

const icon = (group: AttributeFilterKey, key: string, filename: string, label: string): MffAttributeIcon => ({
  key,
  group,
  label,
  src: `${ATTRIBUTE_ICON_BASE}/${filename}.png`,
});

const typeOptions = [
  icon('type', 'Combat', 'combat', '컴뱃'),
  icon('type', 'Blast', 'blast', '블래스트'),
  icon('type', 'Speed', 'speed', '스피드'),
  icon('type', 'Universal', 'universal', '유니버셜'),
];

const speciesOptions = [
  icon('species', 'Human', 'human', '인간'),
  icon('species', 'Mutant', 'mutant', '뮤턴트'),
  icon('species', 'Inhuman', 'inhuman', '인휴먼'),
  icon('species', 'Alien', 'alien', '외계인'),
  icon('species', 'Creature', 'creature', '크리처'),
  icon('species', 'Other', 'other', '기타'),
];

const genderOptions = [
  icon('gender', 'Male', 'male', '남성'),
  icon('gender', 'Female', 'female', '여성'),
  icon('gender', 'Neutral', 'genderneutral', '중립'),
];

const sideOptions = [
  icon('side', 'Hero', 'hero', '영웅'),
  icon('side', 'Villain', 'villain', '빌런'),
  icon('side', 'Neutral', 'sideneutral', '중립'),
];

const instinctOptions = [
  icon('instinct', 'Justice', 'instinct_justice', '정의'),
  icon('instinct', 'Cruelty', 'instinct_cruelty', '잔혹'),
  icon('instinct', 'Order', 'instinct_order', '질서'),
  icon('instinct', 'Destruction', 'instinct_destruction', '파괴'),
];

const abilityOptions = [
  icon('ability', 'Agent', 'agent', '요원'),
  icon('ability', 'Agility', 'agility', '민첩'),
  icon('ability', 'Annihilators', 'annihilators', '어나일레이터스'),
  icon('ability', 'Blackorder', 'blackorder', '블랙 오더'),
  icon('ability', 'Chaosmagic', 'chaosmagic', '카오스 매직'),
  icon('ability', 'Chill', 'chill', '냉기'),
  icon('ability', 'Coldblooded', 'coldblooded', '냉혈'),
  icon('ability', 'Command', 'command', '지휘'),
  icon('ability', 'Cosmiccube', 'cosmiccube', '코스믹 큐브'),
  icon('ability', 'Darkavengers', 'darkavengers', '다크 어벤져스'),
  icon('ability', 'Defenders', 'defenders', '디펜더스'),
  icon('ability', 'Durability', 'durability', '내구'),
  icon('ability', 'Energyprojection', 'energyprojection', '에너지 방출'),
  icon('ability', 'Eternals', 'eternals', '이터널스'),
  icon('ability', 'Fantasticfour', 'fantasticfour', '판타스틱 포'),
  icon('ability', 'Fastmovement', 'fastmovement', '빠른 이동'),
  icon('ability', 'Flame', 'flame', '화염'),
  icon('ability', 'Gammaradiation', 'gammaradiation', '감마선'),
  icon('ability', 'Guardiansofthegalaxy', 'guardiansofthegalaxy', '가디언즈 오브 갤럭시'),
  icon('ability', 'Healing', 'healing', '회복'),
  icon('ability', 'Heightenedsenses', 'heightenedsenses', '초감각'),
  icon('ability', 'Hellfire', 'hellfire', '헬파이어'),
  icon('ability', 'Infinitywarps', 'infinitywarps', '인피니티 워프스'),
  icon('ability', 'Leadership', 'leadership', '리더십'),
  icon('ability', 'Machine', 'machine', '기계'),
  icon('ability', 'Magic', 'magic', '마법'),
  icon('ability', 'Mind', 'mind', '정신'),
  icon('ability', 'Mindresist', 'mindresist', '정신 저항'),
  icon('ability', 'Olympus', 'olympus', '올림푸스'),
  icon('ability', 'Phoenixforce', 'phoenixforce', '피닉스 포스'),
  icon('ability', 'Poison', 'poison', '독'),
  icon('ability', 'Powercosmic', 'powercosmic', '파워 코스믹'),
  icon('ability', 'Pureevil', 'pureevil', '순수 악'),
  icon('ability', 'Shock', 'shock', '감전'),
  icon('ability', 'Sinistersix', 'sinistersix', '시니스터 식스'),
  icon('ability', 'Spider Sense', 'spider-sense', '스파이더 센스'),
  icon('ability', 'Strong', 'strong', '힘'),
  icon('ability', 'Symbiote', 'symbiote', '심비오트'),
  icon('ability', 'Timefreezingimmunity', 'timefreezingimmunity', '시간 정지 면역'),
  icon('ability', 'Thunderbolts', 'thunderbolts', '썬더볼츠'),
  icon('ability', 'Warriorsofthesky', 'warriorsofthesky', '워리어즈 오브 더 스카이'),
  icon('ability', 'Weaponsmaster', 'weaponsmaster', '무기 전문가'),
  icon('ability', 'Youngavengers', 'youngavengers', '영 어벤져스'),
  icon('ability', 'Zombie', 'zombie', '좀비'),
];

export const filterIconGroups: FilterIconGroup[] = [
  { key: 'type', label: '타입', options: typeOptions },
  { key: 'species', label: '종족', options: speciesOptions },
  { key: 'gender', label: '성별', options: genderOptions },
  { key: 'side', label: '진영', options: sideOptions },
  { key: 'instinct', label: '천성', options: instinctOptions },
  { key: 'ability', label: '능력', options: abilityOptions },
];

export function normalizeAttributeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

const iconsByGroupAndKey = new Map<string, MffAttributeIcon>();
const iconsByKey = new Map<string, MffAttributeIcon>();
for (const group of filterIconGroups) {
  for (const option of group.options) {
    iconsByGroupAndKey.set(`${group.key}:${normalizeAttributeKey(option.key)}`, option);
    iconsByKey.set(normalizeAttributeKey(option.key), option);
  }
}

const attributeAliases: Record<string, string> = {
  weaponmaster: 'weaponsmaster',
};

export function getMffAttributeIcon(value?: string, group?: AttributeFilterKey) {
  if (!value || value === 'ALL' || value === 'Any' || value === 'Unknown') return undefined;
  const normalized = attributeAliases[normalizeAttributeKey(value)] ?? normalizeAttributeKey(value);
  return group ? iconsByGroupAndKey.get(`${group}:${normalized}`) : iconsByKey.get(normalized);
}

export function getMffAbilityIcons(tags: string[] = []) {
  const icons = tags
    .map((tag) => getMffAttributeIcon(tag, 'ability'))
    .filter((item): item is MffAttributeIcon => Boolean(item));
  return Array.from(new Map(icons.map((item) => [item.key, item])).values());
}
