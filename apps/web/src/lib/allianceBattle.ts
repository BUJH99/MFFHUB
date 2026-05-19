import type { Alignment, ChallengeRule, CombatType, Gender } from '@mff-data-hub/types';

export type AllianceBattleMode = 'Normal' | 'Extreme' | 'Legend' | 'Infinite Challenge';
export type AllianceBattleContent = 'AB' | 'ABX' | 'ABL' | 'Infinity Challenge';
export type AllianceBattleRestriction =
  | 'No Restrictions'
  | CombatType
  | Alignment
  | Gender
  | 'Human'
  | 'Alien'
  | 'Mutant'
  | 'Inhuman';

export interface AllianceBattleCondition {
  mode: AllianceBattleMode;
  content: AllianceBattleContent;
  restrictions: AllianceBattleRestriction[];
  recommendedType: CombatType | 'Any';
  requiredAlignment: Alignment | 'Any';
  requiredGender: Gender | 'Any';
  requiredTags: string[];
  cancelEffects: string[];
  label: string;
}

export interface AllianceBattleRound {
  round: number;
  isResetDay: boolean;
  conditions: AllianceBattleCondition[];
}

export interface AllianceBattleCalendarDay {
  date: string;
  dayName: string;
  dayOfMonth: number;
  round: number;
  isResetDay: boolean;
  isToday: boolean;
  conditions: AllianceBattleCondition[];
  abx?: AllianceBattleCondition;
  abl?: AllianceBattleCondition;
  infinite?: AllianceBattleCondition;
}

export const ALLIANCE_BATTLE_SOURCE_URL = 'https://thanosvibs.money/abxl';
export const ALLIANCE_BATTLE_WIKI_URL = 'https://future-fight.fandom.com/wiki/Alliance_Battle';
export const NAVER_ABXL_SEARCH_URL =
  'https://section.cafe.naver.com/ca-fe/home/search/articles?q=%EB%A7%88%EB%B8%94%20%ED%93%A8%EC%B2%98%ED%8C%8C%EC%9D%B4%ED%8A%B8%20ABX%20ABL%20%EC%A1%B0%EA%B1%B4%ED%91%9C';
export const ALLIANCE_BATTLE_ROTATION_VERSION = 'MFF 11.8 community rotation';
export const ALLIANCE_BATTLE_ROTATION_START_DATE = '2026-05-15';
export const KST_TIME_ZONE = 'Asia/Seoul';

const combatTypes: CombatType[] = ['Combat', 'Blast', 'Speed', 'Universal'];
const alignments: Alignment[] = ['Hero', 'Villain', 'Neutral'];
const genders: Gender[] = ['Male', 'Female', 'Other'];
const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

export const restrictionLabels: Record<string, string> = {
  'No Restrictions': '제한 없음',
  Combat: '컴뱃',
  Blast: '블래스트',
  Speed: '스피드',
  Universal: '유니버셜',
  Hero: '영웅',
  Villain: '빌런',
  Neutral: '중립',
  Male: '남성',
  Female: '여성',
  Other: '기타',
  Human: '인간',
  Alien: '외계인',
  Mutant: '뮤턴트',
  Inhuman: '인휴먼',
};

export const cancelEffectLabels: Record<string, string> = {
  silence: '침묵',
  paralyze: '마비',
  burn: '화상',
  snare: '속박',
  shock: '감전',
  fracture: '파열',
};

const ATTRIBUTE_ICON_BASE = 'https://thanosvibs.money/static/attributes';

export type AllianceBattleIconKind = 'restriction' | 'cancel';

export interface AllianceBattleIcon {
  key: string;
  label: string;
  src: string;
  kind: AllianceBattleIconKind;
}

export const restrictionIconSrc: Record<string, string> = {
  'No Restrictions': `${ATTRIBUTE_ICON_BASE}/nores.png`,
  Combat: `${ATTRIBUTE_ICON_BASE}/combat.png`,
  Blast: `${ATTRIBUTE_ICON_BASE}/blast.png`,
  Speed: `${ATTRIBUTE_ICON_BASE}/speed.png`,
  Universal: `${ATTRIBUTE_ICON_BASE}/universal.png`,
  Hero: `${ATTRIBUTE_ICON_BASE}/hero.png`,
  Villain: `${ATTRIBUTE_ICON_BASE}/villain.png`,
  Neutral: `${ATTRIBUTE_ICON_BASE}/nores.png`,
  Male: `${ATTRIBUTE_ICON_BASE}/male.png`,
  Female: `${ATTRIBUTE_ICON_BASE}/female.png`,
  Other: `${ATTRIBUTE_ICON_BASE}/nores.png`,
  Human: `${ATTRIBUTE_ICON_BASE}/human.png`,
  Alien: `${ATTRIBUTE_ICON_BASE}/alien.png`,
  Mutant: `${ATTRIBUTE_ICON_BASE}/mutant.png`,
  Inhuman: `${ATTRIBUTE_ICON_BASE}/inhuman.png`,
};

export const cancelEffectIconSrc: Record<string, string> = {
  silence: `${ATTRIBUTE_ICON_BASE}/buff_silence.png`,
  paralyze: `${ATTRIBUTE_ICON_BASE}/buff_paralyze.png`,
  burn: `${ATTRIBUTE_ICON_BASE}/buff_burn.png`,
  snare: `${ATTRIBUTE_ICON_BASE}/buff_snare.png`,
  shock: `${ATTRIBUTE_ICON_BASE}/buff_shock.png`,
  fracture: `${ATTRIBUTE_ICON_BASE}/buff_fracture.png`,
};

const tagToRestriction: Record<string, AllianceBattleRestriction> = {
  combat: 'Combat',
  blast: 'Blast',
  speed: 'Speed',
  universal: 'Universal',
  hero: 'Hero',
  villain: 'Villain',
  neutral: 'Neutral',
  male: 'Male',
  female: 'Female',
  other: 'Other',
  human: 'Human',
  alien: 'Alien',
  mutant: 'Mutant',
  inhuman: 'Inhuman',
  nores: 'No Restrictions',
  'no-restrictions': 'No Restrictions',
};

const unique = <T>(items: T[]) => Array.from(new Set(items));
const hasNoRestriction = (restrictions: AllianceBattleRestriction[]) =>
  restrictions.length === 0 || restrictions.includes('No Restrictions');
const normalizeTag = (value: string) => value.toLowerCase().replace(/\s+/g, '-');

export function getKstDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getAllianceBattleMonth(today = getKstDateKey()) {
  return today.slice(0, 7);
}

function restrictionIcon(value: string): AllianceBattleIcon {
  const normalized = tagToRestriction[normalizeTag(value)] ?? value;
  const src = restrictionIconSrc[normalized] ?? restrictionIconSrc['No Restrictions'];
  return {
    key: normalized,
    label: restrictionLabels[normalized] ?? normalized,
    src,
    kind: 'restriction',
  };
}

function cancelIcon(effect: string): AllianceBattleIcon {
  return {
    key: effect,
    label: cancelEffectLabels[effect] ?? effect,
    src: cancelEffectIconSrc[effect] ?? restrictionIconSrc['No Restrictions'],
    kind: 'cancel',
  };
}

function condition(mode: AllianceBattleMode, restrictions: AllianceBattleRestriction[], cancelEffects: string[] = []): AllianceBattleCondition {
  const content: AllianceBattleContent =
    mode === 'Extreme' ? 'ABX' : mode === 'Legend' ? 'ABL' : mode === 'Infinite Challenge' ? 'Infinity Challenge' : 'AB';
  const activeRestrictions = hasNoRestriction(restrictions) ? [] : restrictions;
  const recommendedType = activeRestrictions.find((item): item is CombatType => combatTypes.includes(item as CombatType)) ?? 'Any';
  const requiredAlignment = activeRestrictions.find((item): item is Alignment => alignments.includes(item as Alignment)) ?? 'Any';
  const requiredGender = activeRestrictions.find((item): item is Gender => genders.includes(item as Gender)) ?? 'Any';
  const requiredTags = activeRestrictions
    .filter((item) => !combatTypes.includes(item as CombatType))
    .filter((item) => !alignments.includes(item as Alignment))
    .filter((item) => !genders.includes(item as Gender))
    .map(normalizeTag);
  const label = hasNoRestriction(restrictions)
    ? restrictionLabels['No Restrictions']
    : activeRestrictions.map((item) => restrictionLabels[item] ?? item).join(' + ');

  return {
    mode,
    content,
    restrictions: hasNoRestriction(restrictions) ? ['No Restrictions'] : restrictions,
    recommendedType,
    requiredAlignment,
    requiredGender,
    requiredTags,
    cancelEffects: unique(cancelEffects),
    label,
  };
}

const abxCancels = ['silence', 'paralyze', 'burn'];
const ablCancels = ['snare', 'shock', 'fracture'];
const noRestrictions: AllianceBattleRestriction[] = ['No Restrictions'];

export const allianceBattleRotation: AllianceBattleRound[] = [
  { round: 1, isResetDay: true, conditions: [condition('Normal', ['Blast']), condition('Extreme', ['Speed', 'Hero', 'Female'], abxCancels), condition('Legend', ['Universal', 'Male'], ablCancels)] },
  { round: 2, isResetDay: false, conditions: [condition('Normal', noRestrictions), condition('Extreme', noRestrictions, abxCancels), condition('Legend', noRestrictions, ablCancels)] },
  { round: 3, isResetDay: false, conditions: [condition('Infinite Challenge', noRestrictions)] },
  { round: 4, isResetDay: false, conditions: [condition('Normal', ['Speed']), condition('Extreme', ['Combat', 'Female'], abxCancels), condition('Legend', ['Villain', 'Human'], ablCancels)] },
  { round: 5, isResetDay: false, conditions: [condition('Normal', ['Universal']), condition('Extreme', ['Speed', 'Villain'], abxCancels), condition('Legend', ['Blast', 'Hero'], ablCancels)] },
  { round: 6, isResetDay: false, conditions: [condition('Normal', ['Female']), condition('Extreme', ['Universal', 'Villain'], abxCancels), condition('Legend', ['Combat', 'Villain', 'Male'], ablCancels)] },
  { round: 7, isResetDay: false, conditions: [condition('Normal', ['Villain']), condition('Extreme', ['Male', 'Mutant'], abxCancels), condition('Legend', ['Villain', 'Alien'], ablCancels)] },
  { round: 8, isResetDay: true, conditions: [condition('Normal', ['Combat']), condition('Extreme', ['Combat', 'Hero'], abxCancels), condition('Legend', ['Universal', 'Human'], ['snare', 'fracture'])] },
  { round: 9, isResetDay: false, conditions: [condition('Normal', noRestrictions), condition('Extreme', noRestrictions, abxCancels), condition('Legend', noRestrictions, ablCancels)] },
  { round: 10, isResetDay: false, conditions: [condition('Infinite Challenge', noRestrictions)] },
  { round: 11, isResetDay: false, conditions: [condition('Normal', ['Speed']), condition('Extreme', ['Combat', 'Hero', 'Human'], abxCancels), condition('Legend', ['Villain', 'Male'], ablCancels)] },
  { round: 12, isResetDay: false, conditions: [condition('Normal', ['Universal']), condition('Extreme', ['Universal', 'Hero', 'Male'], abxCancels), condition('Legend', ['Hero', 'Female', 'Human'], ablCancels)] },
  { round: 13, isResetDay: false, conditions: [condition('Normal', ['Female']), condition('Extreme', ['Blast', 'Male'], ['silence', 'paralyze']), condition('Legend', ['Female', 'Mutant'], ablCancels)] },
  { round: 14, isResetDay: false, conditions: [condition('Normal', ['Villain']), condition('Extreme', ['Villain', 'Mutant'], abxCancels), condition('Legend', ['Speed', 'Hero', 'Male'], ablCancels)] },
  { round: 15, isResetDay: true, conditions: [condition('Normal', ['Blast']), condition('Extreme', ['Universal', 'Villain'], abxCancels), condition('Legend', ['Speed', 'Villain'], ['shock', 'fracture'])] },
  { round: 16, isResetDay: false, conditions: [condition('Normal', noRestrictions), condition('Extreme', noRestrictions, abxCancels), condition('Legend', noRestrictions, ablCancels)] },
  { round: 17, isResetDay: false, conditions: [condition('Infinite Challenge', noRestrictions)] },
  { round: 18, isResetDay: false, conditions: [condition('Normal', ['Speed']), condition('Extreme', ['Blast', 'Villain'], ['silence', 'paralyze']), condition('Legend', ['Speed', 'Female'], ablCancels)] },
  { round: 19, isResetDay: false, conditions: [condition('Normal', ['Universal']), condition('Extreme', ['Universal', 'Hero'], abxCancels), condition('Legend', ['Combat', 'Alien'], ablCancels)] },
  { round: 20, isResetDay: false, conditions: [condition('Normal', ['Female']), condition('Extreme', ['Female', 'Alien'], abxCancels), condition('Legend', ['Blast', 'Hero', 'Male'], ablCancels)] },
  { round: 21, isResetDay: false, conditions: [condition('Normal', ['Villain']), condition('Extreme', ['Blast', 'Female', 'Human'], abxCancels), condition('Legend', ['Inhuman'], ablCancels)] },
  { round: 22, isResetDay: true, conditions: [condition('Normal', ['Combat']), condition('Extreme', ['Speed', 'Male', 'Human'], abxCancels), condition('Legend', ['Universal', 'Hero', 'Male'], ablCancels)] },
  { round: 23, isResetDay: false, conditions: [condition('Normal', noRestrictions), condition('Extreme', noRestrictions, abxCancels), condition('Legend', noRestrictions, ablCancels)] },
  { round: 24, isResetDay: false, conditions: [condition('Infinite Challenge', noRestrictions)] },
  { round: 25, isResetDay: false, conditions: [condition('Normal', ['Speed']), condition('Extreme', ['Hero', 'Male', 'Alien'], abxCancels), condition('Legend', ['Universal', 'Female'], ['snare', 'fracture'])] },
  { round: 26, isResetDay: false, conditions: [condition('Normal', ['Universal']), condition('Extreme', ['Combat', 'Villain'], abxCancels), condition('Legend', ['Hero', 'Alien'], ablCancels)] },
  { round: 27, isResetDay: false, conditions: [condition('Normal', ['Female']), condition('Extreme', ['Universal', 'Human'], abxCancels), condition('Legend', ['Male', 'Mutant'], ablCancels)] },
  { round: 28, isResetDay: false, conditions: [condition('Normal', ['Villain']), condition('Extreme', ['Villain', 'Female'], abxCancels), condition('Legend', ['Combat', 'Hero', 'Human'], ['snare', 'fracture'])] },
];

function dateToUtcDay(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return dateKey(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
}

function modulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

export function getAllianceBattleRoundForDate(date: string, startDate = ALLIANCE_BATTLE_ROTATION_START_DATE) {
  const dayOffset = dateToUtcDay(date) - dateToUtcDay(startDate);
  return allianceBattleRotation[modulo(dayOffset, allianceBattleRotation.length)];
}

export function getKoreanDayName(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return dayNames[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

export function buildMonthlyAllianceBattleCalendar(monthKey = getAllianceBattleMonth(), today = getKstDateKey()): AllianceBattleCalendarDay[] {
  const [year, month] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const dayOfMonth = index + 1;
    const date = dateKey(year, month, dayOfMonth);
    const round = getAllianceBattleRoundForDate(date);
    const abx = round.conditions.find((item) => item.content === 'ABX');
    const abl = round.conditions.find((item) => item.content === 'ABL');
    const infinite = round.conditions.find((item) => item.content === 'Infinity Challenge');
    return {
      date,
      dayName: getKoreanDayName(date),
      dayOfMonth,
      round: round.round,
      isResetDay: round.isResetDay,
      isToday: date === today,
      conditions: round.conditions,
      abx,
      abl,
      infinite,
    };
  });
}

export function getWeekAllianceBattleCalendar(today = getKstDateKey()): AllianceBattleCalendarDay[] {
  const [year, month, day] = today.split('-').map(Number);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, mondayOffset + index);
    const round = getAllianceBattleRoundForDate(date);
    const abx = round.conditions.find((item) => item.content === 'ABX');
    const abl = round.conditions.find((item) => item.content === 'ABL');
    const infinite = round.conditions.find((item) => item.content === 'Infinity Challenge');
    return {
      date,
      dayName: getKoreanDayName(date),
      dayOfMonth: Number(date.slice(-2)),
      round: round.round,
      isResetDay: round.isResetDay,
      isToday: date === today,
      conditions: round.conditions,
      abx,
      abl,
      infinite,
    };
  });
}

export const monthlyAllianceBattleCalendar = buildMonthlyAllianceBattleCalendar();

function challengeNote(condition: AllianceBattleCondition, day: AllianceBattleCalendarDay) {
  if (condition.content === 'ABX') {
    return `${condition.label} ABX. ${day.isResetDay ? '리셋데이라 2회 입장 구간입니다. ' : ''}Rage/Competition 세팅과 캔슬 가능 스킬 보유 여부를 같이 확인하세요.`;
  }
  return `${condition.label} ABL. ${day.isResetDay ? '리셋데이라 2회 입장 구간입니다. ' : ''}Legend 점수는 생존, 캔슬 안정성, 팀업 컬렉션 대상 여부를 같이 봅니다.`;
}

export function toChallengeRule(day: AllianceBattleCalendarDay, condition: AllianceBattleCondition): ChallengeRule {
  const content = condition.content === 'ABL' ? 'ABL' : 'ABX';
  const cancelLabels = condition.cancelEffects.map((effect) => cancelEffectLabels[effect] ?? effect);
  return {
    id: `${content.toLowerCase()}-${day.date}-round-${day.round}`,
    date: day.date,
    content,
    label: `${content} · ${condition.label}`,
    dayName: `${day.dayName}요일 · Round ${day.round}`,
    rotationRound: day.round,
    mode: condition.mode === 'Legend' ? 'Legend' : 'Extreme',
    recommendedType: condition.recommendedType,
    requiredAlignment: condition.requiredAlignment,
    requiredGender: condition.requiredGender,
    requiredTags: condition.requiredTags,
    bonusTags: condition.restrictions.includes('No Restrictions') ? ['pve'] : [],
    bannedTags: [],
    scoringFocus: cancelLabels.length ? cancelLabels : ['자유 딜러'],
    cancelEffects: condition.cancelEffects,
    isResetDay: day.isResetDay,
    sourceUrl: ALLIANCE_BATTLE_SOURCE_URL,
    note: challengeNote(condition, day),
  };
}

export function getAllianceChallengeRulesForDate(date = getKstDateKey()) {
  const day = buildMonthlyAllianceBattleCalendar(date.slice(0, 7), date).find((item) => item.date === date);
  if (!day) return [];
  return [day.abx, day.abl].filter(Boolean).map((condition) => toChallengeRule(day, condition!));
}

export function getTodaysChallenges(today = getKstDateKey()): ChallengeRule[] {
  return getAllianceChallengeRulesForDate(today);
}

export const APP_TODAY = getKstDateKey();
export const ALLIANCE_BATTLE_MONTH = getAllianceBattleMonth(APP_TODAY);
export const todaysChallenges: ChallengeRule[] = getTodaysChallenges(APP_TODAY);

export function getRestrictionIcons(condition?: AllianceBattleCondition): AllianceBattleIcon[] {
  if (!condition) return [restrictionIcon('No Restrictions')];
  return condition.restrictions.map(restrictionIcon);
}

export function getAllianceAttributeIcon(value?: string): AllianceBattleIcon | undefined {
  if (!value || value === 'ALL' || value === 'Any' || value === 'Unknown') return undefined;
  const normalized = tagToRestriction[normalizeTag(value)] ?? value;
  if (!restrictionIconSrc[normalized]) return undefined;
  return restrictionIcon(normalized);
}

export function getCancelEffectIcons(condition?: AllianceBattleCondition): AllianceBattleIcon[] {
  return condition?.cancelEffects.map(cancelIcon) ?? [];
}

export function getChallengeRestrictionIcons(rule: ChallengeRule): AllianceBattleIcon[] {
  const restrictions = [
    rule.recommendedType !== 'Any' ? rule.recommendedType : undefined,
    rule.requiredAlignment !== 'Any' ? rule.requiredAlignment : undefined,
    rule.requiredGender !== 'Any' ? rule.requiredGender : undefined,
    ...rule.requiredTags.map((tag) => tagToRestriction[normalizeTag(tag)] ?? tag),
  ].filter(Boolean) as string[];

  return (restrictions.length ? restrictions : ['No Restrictions']).map(restrictionIcon);
}

export function getChallengeCancelIcons(rule: ChallengeRule): AllianceBattleIcon[] {
  return (rule.cancelEffects ?? []).map(cancelIcon);
}

export function formatRestrictionLabel(condition?: AllianceBattleCondition) {
  return condition?.label ?? '인피니티 챌린지';
}

export function formatCancelLabels(condition?: AllianceBattleCondition) {
  if (!condition || condition.cancelEffects.length === 0) return '자유';
  return condition.cancelEffects.map((effect) => cancelEffectLabels[effect] ?? effect).join(' / ');
}
