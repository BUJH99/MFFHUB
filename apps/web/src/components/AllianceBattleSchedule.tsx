'use client';

import Image from 'next/image';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { characters, userRoster } from '@/lib/data';
import {
  ALLIANCE_BATTLE_ROTATION_START_DATE,
  allianceBattleRotation,
  getAllianceBattleRoundForDate,
  getCancelEffectIcons,
  getKoreanDayName,
  getKstDateKey,
  getAllianceAttributeIcon,
  getRestrictionIcons,
  formatRestrictionLabel,
  type AllianceBattleCalendarDay,
  type AllianceBattleCondition,
  type AllianceBattleIcon,
} from '@/lib/allianceBattle';
import { catalogCharacters, type CatalogCharacter, type CatalogUniform } from '@mff-data-hub/data';
import type { Character, CombatType } from '@mff-data-hub/types';

type ScheduleContent = 'ABX' | 'ABL';
type SheetTone = 'abx' | 'abl';
type SheetMember = {
  id: string;
  name: string;
  portraitUrl: string;
  ctp: string;
  uniformName?: string;
};
type TeamKind = 'tagPlay' | 'soloDeal';
type PickerState = {
  kind: 'character' | 'ctp';
  slotKey: string;
  member: SheetMember;
  label: string;
  condition?: AllianceBattleCondition;
  conditionLabel?: string;
} | null;
type UsageCountRow = {
  member: SheetMember;
  tagPlay: number;
  soloDeal: number;
  total: number;
  ctpMembers: Record<string, CtpUsageMember>;
};
type UsageRoleGroup = 'buffer' | 'dealer';
type UsageCombatType = CombatType | 'Unknown';
type TrackedCtpKey = 'competition' | 'rage' | 'insight' | 'liberation';
type CtpUsageMember = {
  member: SheetMember;
  count: number;
};
type CtpNeedRow = {
  key: TrackedCtpKey;
  label: string;
  ctp: string;
  members: CtpUsageMember[];
};
type UsageTypeGroup = {
  type: UsageCombatType;
  rows: UsageCountRow[];
};
type UsageCountSummary = {
  buffers: UsageTypeGroup[];
  dealers: UsageTypeGroup[];
};
type RoleOverrides = Record<string, UsageRoleGroup>;
type UsageCountOptions = {
  contents?: ScheduleContent[];
  teamKinds?: TeamKind[];
  roleOverrides?: RoleOverrides;
};
type UsageLookup = Record<UsageRoleGroup, Map<string, UsageCountRow>>;
type BattleRoundChunk = {
  label: string;
  days: AllianceBattleCalendarDay[];
};
type SheetCustomizations = {
  memberOverrides: Record<string, SheetMember>;
  ctpOverrides: Record<string, string>;
  roleOverrides: RoleOverrides;
};
type TeamReadiness = {
  ready: boolean;
  reasons: string[];
};

const contentMeta: Record<ScheduleContent, { title: string; tone: SheetTone; modeLabel: string }> = {
  ABX: { title: 'ABX 표', tone: 'abx', modeLabel: 'Extreme' },
  ABL: { title: 'ABL 표', tone: 'abl', modeLabel: 'Legend' },
};

const sheetCustomizationStorageKey = 'mff-data-hub:alliance-battle-sheet:v1';

const portrait = (slug: string) => `/mff-assets/characters/${slug}.webp`;
const normalizeCharacterKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const characterById = new Map(characters.map((character) => [character.id, character]));
const appCharacterByCatalogKey = new Map<string, Character>();
const catalogCharacterByKey = new Map<string, CatalogCharacter>();
const rosterByCharacterId = new Map(userRoster.map((item) => [item.characterId, item]));
const catalogCharacterIdAliases: Record<string, string> = {
  hades: 'hadespluto',
  'hulk-red': 'redhulk',
  valeria: 'valeriarichards',
};

for (const character of characters) {
  appCharacterByCatalogKey.set(normalizeCharacterKey(character.id), character);
  appCharacterByCatalogKey.set(normalizeCharacterKey(character.slug), character);
  appCharacterByCatalogKey.set(normalizeCharacterKey(character.name), character);
}

for (const character of catalogCharacters) {
  const appCharacter = appCharacterByCatalogKey.get(normalizeCharacterKey(character.id)) ?? appCharacterByCatalogKey.get(normalizeCharacterKey(character.name));
  catalogCharacterByKey.set(normalizeCharacterKey(character.id), character);
  catalogCharacterByKey.set(normalizeCharacterKey(character.name), character);
  if (appCharacter) {
    catalogCharacterByKey.set(normalizeCharacterKey(appCharacter.id), character);
    catalogCharacterByKey.set(normalizeCharacterKey(appCharacter.slug), character);
    catalogCharacterByKey.set(normalizeCharacterKey(appCharacter.name), character);
  }
}

for (const [aliasId, catalogId] of Object.entries(catalogCharacterIdAliases)) {
  const catalogCharacter = catalogCharacterByKey.get(normalizeCharacterKey(catalogId));
  if (catalogCharacter) {
    catalogCharacterByKey.set(normalizeCharacterKey(aliasId), catalogCharacter);
  }
}

const defaultCtpByCharacterId: Record<string, string> = {
  'agent-venom': 'Rage',
  ares: 'Rage',
  athena: 'Insight',
  'black-cat': 'Insight',
  blackbolt: 'Insight',
  bullseye: 'Rage',
  crescent: 'Insight',
  crystal: 'Judgement',
  cyclops: 'Insight',
  dazzler: 'Insight',
  'doctor-strange': 'Rage',
  'doctor-voodoo': 'Insight',
  dormammu: 'Rage',
  enchantress: 'Insight',
  gambit: 'Judgement',
  gamora: 'Rage',
  'ghost-panther': 'Insight',
  gladiator: 'Rage',
  'green-goblin': 'Insight',
  hades: 'Judgement',
  hulk: 'Rage',
  'hulk-red': 'Rage',
  ironheart: 'Energy',
  'iron-man': 'Energy',
  'invisible-woman': 'Insight',
  'jean-grey': 'Judgement',
  kidomega: 'Judgement',
  kingpin: 'Rage',
  loki: 'Rage',
  'luna-snow': 'Judgement',
  'madelyne-pryor': 'Judgement',
  mbaku: 'Insight',
  medusa: 'Rage',
  mephisto: 'Rage',
  'misty-knight': 'Insight',
  'moon-knight': 'Rage',
  'morgan-le-fay': 'Judgement',
  msmarvelkamalakhan: 'Judgement',
  mysterio: 'Rage',
  mystique: 'Insight',
  'nick-fury': 'Insight',
  odin: 'Rage',
  'phil-coulson': 'Insight',
  phylavell: 'Insight',
  polaris: 'Insight',
  proximamidnight: 'Rage',
  'nova-richard-rider': 'Energy',
  ronan: 'Insight',
  satana: 'Insight',
  'scarlet-spider': 'Energy',
  'scarlet-witch': 'Judgement',
  sin: 'Insight',
  sleeper: 'Rage',
  storm: 'Judgement',
  sylvie: 'Rage',
  taskmaster: 'Insight',
  thor: 'Rage',
  valeria: 'Insight',
  valkyrie: 'Insight',
  venom: 'Rage',
  'white-fox': 'Insight',
  'winter-soldier': 'Energy',
  wolverine: 'Rage',
  x23: 'Rage',
  yondu: 'Insight',
  zeus: 'Judgement',
};

const abxCharacterCatalog = {
  whiteFox: { id: 'white-fox', name: '화이트 폭스', portraitUrl: portrait('whitefox2') },
  mistyKnight: { id: 'misty-knight', name: '미스티 나이트', portraitUrl: portrait('mistyknight') },
  lunaSnow: { id: 'luna-snow', name: '루나 스노우', portraitUrl: portrait('lunasnow5') },
  valkyrie: { id: 'valkyrie', name: '발키리', portraitUrl: portrait('valkyrie2') },
  doctorStrange: { id: 'doctor-strange', name: '닥터 스트레인지', portraitUrl: portrait('doctorstrange6') },
  philCoulson: { id: 'phil-coulson', name: '필 콜슨', portraitUrl: portrait('philcoulson2') },
  nickFury: { id: 'nick-fury', name: '닉 퓨리', portraitUrl: portrait('nickfury4') },
  dazzler: { id: 'dazzler', name: '대즐러', portraitUrl: portrait('dazzler1') },
  cyclops: { id: 'cyclops', name: '사이클롭스', portraitUrl: portrait('cyclops5') },
  storm: { id: 'storm', name: '스톰', portraitUrl: portrait('storm5') },
  ghostPanther: { id: 'ghost-panther', name: '고스트 팬서', portraitUrl: portrait('ghostpanther') },
  satana: { id: 'satana', name: '사타나', portraitUrl: portrait('satana2') },
  mephisto: { id: 'mephisto', name: '메피스토', portraitUrl: portrait('mephisto1') },
  crescent: { id: 'crescent', name: '크레센트', portraitUrl: portrait('crescent3') },
  athena: { id: 'athena', name: '아테나', portraitUrl: portrait('athena') },
  sin: { id: 'sin', name: '신', portraitUrl: portrait('sin1') },
  bullseye: { id: 'bullseye', name: '불스아이', portraitUrl: portrait('bullseye3') },
  milesMorales: { id: 'spidermanmilesmorales', name: '마일즈 모랄레스', portraitUrl: portrait('milesmorales5') },
  blackCat: { id: 'black-cat', name: '블랙 캣', portraitUrl: portrait('blackcat3') },
  dormammu: { id: 'dormammu', name: '도르마무', portraitUrl: portrait('dormammu1') },
  hades: { id: 'hades', name: '하데스', portraitUrl: portrait('hades') },
  proximaMidnight: { id: 'proximamidnight', name: '프록시마 미드나이트', portraitUrl: portrait('proximamidnight2') },
  morganLeFay: { id: 'morgan-le-fay', name: '모건 르 페이', portraitUrl: portrait('morganlefay1') },
  wolverine: { id: 'wolverine', name: '울버린', portraitUrl: portrait('wolverine7') },
  gambit: { id: 'gambit', name: '갬빗', portraitUrl: portrait('gambit2') },
  silverSamurai: { id: 'silver-samurai', name: '실버 사무라이', portraitUrl: portrait('silversamurai') },
  gladiator: { id: 'gladiator', name: '글래디에이터', portraitUrl: portrait('gladiator1') },
  sleeper: { id: 'sleeper', name: '슬리퍼', portraitUrl: portrait('sleeper') },
  venom: { id: 'venom', name: '베놈', portraitUrl: portrait('venom6') },
  mbaku: { id: 'mbaku', name: '음바쿠', portraitUrl: portrait('mbaku1') },
  agentVenom: { id: 'agent-venom', name: '에이전트 베놈', portraitUrl: portrait('agentvenom3') },
  novaRichardRider: { id: 'nova-richard-rider', name: '리처드 라이더', portraitUrl: portrait('nova1') },
  loki: { id: 'loki', name: '로키', portraitUrl: portrait('loki8') },
  odin: { id: 'odin', name: '오딘', portraitUrl: portrait('odin3') },
  ronan: { id: 'ronan', name: '로난', portraitUrl: portrait('ronan3') },
  thor: { id: 'thor', name: '토르', portraitUrl: portrait('thor10') },
  zeus: { id: 'zeus', name: '제우스', portraitUrl: portrait('zeus') },
  madelynePryor: { id: 'madelyne-pryor', name: '매들린 프라이어', portraitUrl: portrait('madelynepryor1') },
  polaris: { id: 'polaris', name: '폴라리스', portraitUrl: portrait('polaris1') },
  jeanGrey: { id: 'jean-grey', name: '진 그레이', portraitUrl: portrait('jeangrey4') },
  mystique: { id: 'mystique', name: '미스틱', portraitUrl: portrait('mystique1') },
  mysterio: { id: 'mysterio', name: '미스테리오', portraitUrl: portrait('mysterio2') },
  ironMan: { id: 'iron-man', name: '아이언맨', portraitUrl: portrait('ironman10') },
  enchantress: { id: 'enchantress', name: '인챈트리스', portraitUrl: portrait('enchantress2') },
  sylvie: { id: 'sylvie', name: '실비', portraitUrl: portrait('sylvie') },
  gamora: { id: 'gamora', name: '가모라', portraitUrl: portrait('gamora5') },
  ironheart: { id: 'ironheart', name: '아이언하트', portraitUrl: portrait('ironheart2') },
  invisibleWoman: { id: 'invisible-woman', name: '인비저블 우먼', portraitUrl: portrait('invisiblewoman4') },
  valeriaRichards: { id: 'valeria', name: '발레리아 리처즈', portraitUrl: portrait('valeriarichards') },
  scarletSpider: { id: 'scarlet-spider', name: '스칼렛 스파이더', portraitUrl: portrait('scarletspider2') },
  moonKnight: { id: 'moon-knight', name: '문 나이트', portraitUrl: portrait('moonknight4') },
  greenGoblin: { id: 'green-goblin', name: '그린 고블린', portraitUrl: portrait('greengoblin4') },
  x23: { id: 'x23', name: 'X 23', portraitUrl: portrait('x233') },
  medusa: { id: 'medusa', name: '메두사', portraitUrl: portrait('medusa3') },
  crystal: { id: 'crystal', name: '크리스탈', portraitUrl: portrait('crystal3') },
  msMarvel: { id: 'msmarvelkamalakhan', name: '미즈 마블', portraitUrl: portrait('kamalakhan5') },
  blackBolt: { id: 'blackbolt', name: '블랙 볼트', portraitUrl: portrait('blackbolt4') },
  phylaVell: { id: 'phylavell', name: '파일라 벨', portraitUrl: portrait('phylavell1') },
  yondu: { id: 'yondu', name: '욘두', portraitUrl: portrait('yondu3') },
  hulk: { id: 'hulk', name: '헐크', portraitUrl: portrait('hulk8') },
  ares: { id: 'ares', name: '아레스', portraitUrl: portrait('ares1') },
  kingpin: { id: 'kingpin', name: '킹핀', portraitUrl: portrait('kingpin3') },
  winterSoldier: { id: 'winter-soldier', name: '윈터 솔져', portraitUrl: portrait('wintersoldier6') },
  taskmaster: { id: 'taskmaster', name: '태스크마스터', portraitUrl: portrait('taskmaster2') },
  kidOmega: { id: 'kidomega', name: '키드 오메가', portraitUrl: portrait('kidomega1') },
  redHulk: { id: 'hulk-red', name: '레드 헐크', portraitUrl: portrait('redhulk3') },
  scarletWitch: { id: 'scarlet-witch', name: '스칼렛 위치', portraitUrl: portrait('scarletwitch7') },
  doctorVoodoo: { id: 'doctor-voodoo', name: '닥터 부두', portraitUrl: portrait('doctorvoodoo2') },
} as const;

type AbxCharacterKey = keyof typeof abxCharacterCatalog;
type AbxBestCombo = {
  tagPlay: AbxCharacterKey[];
  soloDeal: AbxCharacterKey[];
};
type ComboSlotCtpSet = Partial<Record<TeamKind, readonly [string, string, string]>>;
type ComboSlotCtpDefaults = Partial<Record<ScheduleContent, Partial<Record<number, ComboSlotCtpSet>>>>;

const combo = (tagPlay: AbxCharacterKey[], soloDeal: AbxCharacterKey[]): AbxBestCombo => ({ tagPlay, soloDeal });
const abxFreeCombo = combo(['valkyrie', 'doctorStrange', 'philCoulson'], ['yondu', 'odin', 'athena']);
const infinityChallengeCombo = combo(['dazzler', 'cyclops', 'storm'], ['ghostPanther', 'satana', 'mephisto']);
const universalVillainCombo = combo(['dormammu', 'hades', 'mephisto'], ['morganLeFay', 'hades', 'mephisto']);
const thunderGodCombo = combo(['thor', 'zeus', 'odin'], ['novaRichardRider', 'odin', 'doctorVoodoo']);

const abxBestCombos: Partial<Record<number, AbxBestCombo>> = {
  1: combo(['whiteFox', 'mistyKnight', 'lunaSnow'], ['whiteFox', 'mistyKnight', 'lunaSnow']),
  2: abxFreeCombo,
  3: infinityChallengeCombo,
  4: combo(['valkyrie', 'crescent', 'athena'], ['valkyrie', 'crescent', 'athena']),
  5: combo(['sin', 'bullseye', 'blackCat'], ['sin', 'blackCat', 'bullseye']),
  6: universalVillainCombo,
  7: combo(['wolverine', 'gambit', 'cyclops'], ['silverSamurai', 'cyclops', 'gambit']),
  8: combo(['valkyrie', 'gladiator', 'athena'], ['valkyrie', 'agentVenom', 'venom']),
  9: abxFreeCombo,
  10: infinityChallengeCombo,
  11: combo(['mbaku', 'crescent', 'venom'], ['agentVenom', 'mbaku', 'venom']),
  12: thunderGodCombo,
  13: combo(['cyclops', 'doctorStrange', 'philCoulson'], ['philCoulson', 'cyclops', 'gambit']),
  14: combo(['cyclops', 'polaris', 'jeanGrey'], ['mystique', 'polaris', 'jeanGrey']),
  15: universalVillainCombo,
  16: abxFreeCombo,
  17: infinityChallengeCombo,
  18: combo(['mysterio', 'doctorStrange', 'ironMan'], ['mysterio', 'doctorStrange', 'enchantress']),
  19: thunderGodCombo,
  20: combo(['valkyrie', 'gamora', 'athena'], ['valkyrie', 'gamora', 'athena']),
  21: combo(['ironheart', 'invisibleWoman', 'valeriaRichards'], ['ironheart', 'invisibleWoman', 'valeriaRichards']),
  22: combo(['scarletSpider', 'bullseye', 'moonKnight'], ['scarletSpider', 'greenGoblin', 'bullseye']),
  23: abxFreeCombo,
  24: infinityChallengeCombo,
  25: combo(['thor', 'zeus', 'odin'], ['yondu', 'odin', 'ronan']),
  26: combo(['hulk', 'ares', 'winterSoldier'], ['taskmaster', 'ares', 'redHulk']),
  27: combo(['satana', 'scarletWitch', 'doctorVoodoo'], ['satana', 'scarletWitch', 'doctorVoodoo']),
  28: combo(['sin', 'scarletWitch', 'enchantress'], ['sin', 'scarletWitch', 'enchantress']),
};

const ablFreeCombo = combo(['yondu', 'odin', 'athena'], ['ghostPanther', 'satana', 'mephisto']);
const ablMindFemaleCombo = combo(['sin', 'scarletWitch', 'morganLeFay'], ['sin', 'scarletWitch', 'morganLeFay']);
const ablLunaCombo = combo(['whiteFox', 'mistyKnight', 'lunaSnow'], ['whiteFox', 'mistyKnight', 'lunaSnow']);
const richardRiderCombo = combo(['novaRichardRider', 'zeus', 'odin'], ['novaRichardRider', 'odin', 'doctorVoodoo']);

const ablBestCombos: Partial<Record<number, AbxBestCombo>> = {
  1: richardRiderCombo,
  2: ablFreeCombo,
  4: ablMindFemaleCombo,
  5: combo(['dazzler', 'cyclops', 'storm'], ['dazzler', 'cyclops', 'storm']),
  6: combo(['hulk', 'ares', 'kingpin'], ['taskmaster', 'ares', 'redHulk']),
  7: combo(['enchantress', 'hades', 'ares'], ['proximaMidnight', 'hades', 'enchantress']),
  8: combo(['satana', 'scarletWitch', 'morganLeFay'], ['satana', 'scarletWitch', 'morganLeFay']),
  9: ablFreeCombo,
  11: combo(['mysterio', 'redHulk', 'mephisto'], ['mysterio', 'redHulk', 'mephisto']),
  12: ablLunaCombo,
  13: combo(['x23', 'storm', 'dazzler'], ['dazzler', 'polaris', 'storm']),
  14: combo(['scarletSpider', 'nickFury', 'moonKnight'], ['scarletSpider', 'nickFury', 'moonKnight']),
  15: combo(['sin', 'milesMorales', 'bullseye'], ['sin', 'milesMorales', 'blackCat']),
  16: ablFreeCombo,
  18: ablLunaCombo,
  19: combo(['athena', 'gladiator', 'ares'], ['valkyrie', 'ares', 'athena']),
  20: combo(['cyclops', 'doctorStrange', 'philCoulson'], ['philCoulson', 'cyclops', 'gambit']),
  21: combo(['medusa', 'crystal', 'msMarvel'], ['medusa', 'blackBolt', 'crystal']),
  22: richardRiderCombo,
  23: ablFreeCombo,
  25: combo(['satana', 'scarletWitch', 'phylaVell'], ['satana', 'scarletWitch', 'phylaVell']),
  26: combo(['yondu', 'odin', 'athena'], ['yondu', 'odin', 'athena']),
  27: combo(['kidOmega', 'cyclops', 'gambit'], ['silverSamurai', 'cyclops', 'gambit']),
  28: combo(['agentVenom', 'mbaku', 'venom'], ['agentVenom', 'mbaku', 'venom']),
};

const ctpOptions = [
  'Rage',
  'Competition',
  'Insight',
  'Liberation',
  'Conquest',
  'Greed',
  'Judgement',
  'Energy',
  'Destruction',
  'Authority',
  'Regeneration',
  'Refinement',
  'Transcendence',
  'Patience',
] as const;

const comboSlotCtpDefaults: ComboSlotCtpDefaults = {
  ABX: {
    1: { tagPlay: ['Liberation', 'Insight', 'Competition'], soloDeal: ['Liberation', 'Insight', 'Competition'] },
    2: { tagPlay: ['Liberation', 'Rage', 'Insight'], soloDeal: ['Liberation', 'Competition', 'Insight'] },
    3: { tagPlay: ['Insight', 'Liberation', 'Rage'], soloDeal: ['Insight', 'Liberation', 'Competition'] },
    4: { tagPlay: ['Liberation', 'Rage', 'Insight'], soloDeal: ['Liberation', 'Rage', 'Insight'] },
    5: { tagPlay: ['Liberation', 'Rage', 'Insight'], soloDeal: ['Liberation', 'Insight', 'Rage'] },
    6: { tagPlay: ['Insight', 'Competition', 'Competition'], soloDeal: ['Insight', 'Competition', 'Competition'] },
    7: { tagPlay: ['Energy', 'Rage', 'Liberation'], soloDeal: ['Insight', 'Liberation', 'Rage'] },
    8: { tagPlay: ['Liberation', 'Rage', 'Insight'], soloDeal: ['Liberation', 'Liberation', 'Rage'] },
    9: { tagPlay: ['Liberation', 'Rage', 'Insight'], soloDeal: ['Liberation', 'Competition', 'Insight'] },
    10: { tagPlay: ['Insight', 'Liberation', 'Rage'], soloDeal: ['Insight', 'Liberation', 'Competition'] },
    11: { tagPlay: ['Insight', 'Rage', 'Competition'], soloDeal: ['Liberation', 'Insight', 'Rage'] },
    12: { tagPlay: ['Rage', 'Judgement', 'Competition'], soloDeal: ['Liberation', 'Competition', 'Insight'] },
    13: { tagPlay: ['Liberation', 'Rage', 'Insight'], soloDeal: ['Insight', 'Liberation', 'Rage'] },
    14: { tagPlay: ['Liberation', 'Insight', 'Competition'], soloDeal: ['Insight', 'Liberation', 'Competition'] },
    15: { tagPlay: ['Insight', 'Competition', 'Competition'], soloDeal: ['Insight', 'Competition', 'Competition'] },
    16: { tagPlay: ['Liberation', 'Rage', 'Insight'], soloDeal: ['Liberation', 'Competition', 'Insight'] },
    17: { tagPlay: ['Insight', 'Liberation', 'Rage'], soloDeal: ['Insight', 'Liberation', 'Competition'] },
    18: { tagPlay: ['Liberation', 'Rage', 'Insight'], soloDeal: ['Liberation', 'Rage', 'Insight'] },
    19: { tagPlay: ['Rage', 'Judgement', 'Competition'], soloDeal: ['Liberation', 'Competition', 'Insight'] },
    20: { tagPlay: ['Liberation', 'Rage', 'Insight'], soloDeal: ['Liberation', 'Rage', 'Insight'] },
    21: { tagPlay: ['Liberation', 'Rage', 'Insight'], soloDeal: ['Liberation', 'Rage', 'Insight'] },
    22: { tagPlay: ['Liberation', 'Rage', 'Competition'], soloDeal: ['Liberation', 'Insight', 'Rage'] },
    23: { tagPlay: ['Liberation', 'Rage', 'Insight'], soloDeal: ['Liberation', 'Competition', 'Insight'] },
    24: { tagPlay: ['Insight', 'Liberation', 'Rage'], soloDeal: ['Insight', 'Liberation', 'Competition'] },
    25: { tagPlay: ['Rage', 'Judgement', 'Competition'], soloDeal: ['Liberation', 'Competition', 'Insight'] },
    26: { tagPlay: ['Insight', 'Rage', 'Rage'], soloDeal: ['Liberation', 'Rage', 'Insight'] },
    27: { tagPlay: ['Liberation', 'Competition', 'Insight'], soloDeal: ['Liberation', 'Rage', 'Insight'] },
    28: { tagPlay: ['Liberation', 'Competition', 'Insight'], soloDeal: ['Liberation', 'Rage', 'Insight'] },
  },
  ABL: {
    1: { tagPlay: ['Liberation', 'Judgement', 'Competition'], soloDeal: ['Liberation', 'Competition', 'Insight'] },
    2: { tagPlay: ['Liberation', 'Competition', 'Insight'], soloDeal: ['Insight', 'Liberation', 'Competition'] },
    4: { tagPlay: ['Liberation', 'Competition', 'Insight'], soloDeal: ['Liberation', 'Rage', 'Insight'] },
    5: { tagPlay: ['Insight', 'Liberation', 'Rage'], soloDeal: ['Insight', 'Liberation', 'Rage'] },
    6: { tagPlay: ['Insight', 'Rage', 'Rage'], soloDeal: ['Liberation', 'Rage', 'Insight'] },
    7: { tagPlay: ['Insight', 'Competition', 'Rage'], soloDeal: ['Liberation', 'Competition', 'Insight'] },
    8: { tagPlay: ['Liberation', 'Competition', 'Insight'], soloDeal: ['Liberation', 'Rage', 'Insight'] },
    9: { tagPlay: ['Liberation', 'Competition', 'Insight'], soloDeal: ['Insight', 'Liberation', 'Competition'] },
    11: { tagPlay: ['Liberation', 'Insight', 'Competition'], soloDeal: ['Liberation', 'Insight', 'Competition'] },
    12: { tagPlay: ['Liberation', 'Insight', 'Competition'], soloDeal: ['Liberation', 'Insight', 'Competition'] },
    13: { tagPlay: ['Liberation', 'Rage', 'Insight'], soloDeal: ['Insight', 'Liberation', 'Rage'] },
    14: { tagPlay: ['Liberation', 'Insight', 'Competition'], soloDeal: ['Liberation', 'Insight', 'Rage'] },
    15: { tagPlay: ['Liberation', 'Competition', 'Rage'], soloDeal: ['Liberation', 'Competition', 'Insight'] },
    16: { tagPlay: ['Liberation', 'Competition', 'Insight'], soloDeal: ['Insight', 'Liberation', 'Competition'] },
    18: { tagPlay: ['Liberation', 'Insight', 'Competition'], soloDeal: ['Liberation', 'Insight', 'Competition'] },
    19: { tagPlay: ['Insight', 'Rage', 'Rage'], soloDeal: ['Liberation', 'Rage', 'Insight'] },
    20: { tagPlay: ['Liberation', 'Rage', 'Insight'], soloDeal: ['Insight', 'Liberation', 'Rage'] },
    21: { tagPlay: ['Liberation', 'Competition', 'Competition'], soloDeal: ['Liberation', 'Insight', 'Competition'] },
    22: { tagPlay: ['Liberation', 'Judgement', 'Competition'], soloDeal: ['Liberation', 'Competition', 'Insight'] },
    23: { tagPlay: ['Liberation', 'Competition', 'Insight'], soloDeal: ['Insight', 'Liberation', 'Competition'] },
    25: { tagPlay: ['Liberation', 'Competition', 'Insight'], soloDeal: ['Liberation', 'Rage', 'Insight'] },
    26: { tagPlay: ['Liberation', 'Competition', 'Insight'], soloDeal: ['Liberation', 'Competition', 'Insight'] },
    27: { tagPlay: ['Competition', 'Liberation', 'Rage'], soloDeal: ['Insight', 'Liberation', 'Rage'] },
    28: { tagPlay: ['Liberation', 'Insight', 'Competition'], soloDeal: ['Liberation', 'Insight', 'Rage'] },
  },
};

function buildDefaultCtpByComboSlot(defaults: ComboSlotCtpDefaults) {
  const result: Record<string, string> = {};

  for (const [content, rounds] of Object.entries(defaults) as Array<[ScheduleContent, NonNullable<ComboSlotCtpDefaults[ScheduleContent]>]>) {
    for (const [roundKey, teams] of Object.entries(rounds)) {
      if (!teams) continue;

      const round = Number(roundKey);

      for (const [teamKind, ctps] of Object.entries(teams) as Array<[TeamKind, readonly [string, string, string]]>) {
        ctps.forEach((ctp, index) => {
          result[makeSlotKey(content, round, teamKind, index)] = ctp;
        });
      }
    }
  }

  return result;
}

const defaultCtpByComboSlot = buildDefaultCtpByComboSlot(comboSlotCtpDefaults);

function getEquippedCtp(characterId: string, fallback?: string) {
  return rosterByCharacterId.get(characterId)?.ctp ?? defaultCtpByCharacterId[characterId] ?? fallback ?? 'Rage';
}

function toAbxMember(key: AbxCharacterKey): SheetMember {
  const item = abxCharacterCatalog[key];
  const character = characterById.get(item.id);
  return {
    id: item.id,
    name: item.name,
    portraitUrl: character?.portraitUrl ?? item.portraitUrl,
    ctp: getEquippedCtp(item.id, character?.ctpRecommendations[0]),
  };
}

function toCatalogMember(character: CatalogCharacter): SheetMember {
  const appCharacter = appCharacterByCatalogKey.get(normalizeCharacterKey(character.id)) ?? appCharacterByCatalogKey.get(normalizeCharacterKey(character.name));
  const characterId = appCharacter?.id ?? character.id;

  return {
    id: characterId,
    name: appCharacter?.name ?? character.name,
    portraitUrl: appCharacter?.portraitUrl ?? character.imageUrl,
    ctp: getEquippedCtp(characterId, appCharacter?.ctpRecommendations[0]),
  };
}

function getCatalogCharacterForMember(member: SheetMember) {
  return catalogCharacterByKey.get(normalizeCharacterKey(member.id)) ?? catalogCharacterByKey.get(normalizeCharacterKey(member.name));
}

function getUniformOptionsForMember(member: SheetMember): CatalogUniform[] {
  return getCatalogCharacterForMember(member)?.uniforms ?? [{ name: '기본', imageUrl: member.portraitUrl, leader: [], passive: [], uniformEffect: [] }];
}

function applyUniformToMember(member: SheetMember, uniform: CatalogUniform): SheetMember {
  const catalogCharacter = getCatalogCharacterForMember(member);
  const appCharacter = appCharacterByCatalogKey.get(normalizeCharacterKey(catalogCharacter?.id ?? member.id)) ?? appCharacterByCatalogKey.get(normalizeCharacterKey(catalogCharacter?.name ?? member.name));
  const characterId = appCharacter?.id ?? member.id;

  return {
    id: characterId,
    name: member.name,
    portraitUrl: uniform.imageUrl ?? catalogCharacter?.imageUrl ?? appCharacter?.portraitUrl ?? member.portraitUrl,
    ctp: getEquippedCtp(characterId, appCharacter?.ctpRecommendations[0] ?? member.ctp),
    uniformName: uniform.name,
  };
}

function mergePickerMembers(...groups: SheetMember[][]) {
  const byCharacterKey = new Map<string, SheetMember>();

  for (const group of groups) {
    for (const member of group) {
      const key = normalizeCharacterKey(member.id || member.name);
      if (!byCharacterKey.has(key)) byCharacterKey.set(key, member);
    }
  }

  return Array.from(byCharacterKey.values()).sort((left, right) => left.name.localeCompare(right.name, 'ko'));
}

const characterPickerMembers = mergePickerMembers(
  (Object.keys(abxCharacterCatalog) as AbxCharacterKey[]).map(toAbxMember),
  catalogCharacters.map(toCatalogMember),
);

function getAppCharacterForMember(member: SheetMember) {
  return characterById.get(member.id)
    ?? appCharacterByCatalogKey.get(normalizeCharacterKey(member.id))
    ?? appCharacterByCatalogKey.get(normalizeCharacterKey(member.name));
}

function addConditionToken(tokens: Set<string>, value?: string) {
  if (!value || value === 'Any' || value === 'Unknown') return;
  const token = normalizeCharacterKey(value);
  if (token) tokens.add(token);
}

function addConditionTags(tokens: Set<string>, tags?: readonly string[]) {
  tags?.forEach((tag) => addConditionToken(tokens, tag));
}

function addAppCharacterConditionTokens(tokens: Set<string>, character?: Character) {
  if (!character) return;
  addConditionToken(tokens, character.type);
  addConditionToken(tokens, character.alignment);
  addConditionToken(tokens, character.gender);
  addConditionToken(tokens, character.species);
  addConditionTags(tokens, character.tags);
}

function addCatalogCharacterConditionTokens(tokens: Set<string>, character?: CatalogCharacter) {
  if (!character) return;
  addConditionToken(tokens, character.type);
  addConditionToken(tokens, character.side);
  addConditionTags(tokens, character.tags);
}

function addUniformConditionTokens(tokens: Set<string>, uniform: CatalogUniform) {
  addConditionToken(tokens, uniform.type);
  addConditionToken(tokens, uniform.side);
  addConditionToken(tokens, uniform.gender);
  addConditionToken(tokens, uniform.species);
  addConditionTags(tokens, uniform.tags);
}

function getMemberConditionTokenGroups(member: SheetMember) {
  const appCharacter = getAppCharacterForMember(member);
  const catalogCharacter = getCatalogCharacterForMember(member);
  const baseTokens = new Set<string>();
  addAppCharacterConditionTokens(baseTokens, appCharacter);
  addCatalogCharacterConditionTokens(baseTokens, catalogCharacter);

  const tokenGroups = [baseTokens];
  for (const uniform of catalogCharacter?.uniforms ?? []) {
    const uniformTokens = new Set(baseTokens);
    addUniformConditionTokens(uniformTokens, uniform);
    tokenGroups.push(uniformTokens);
  }

  return tokenGroups;
}

function getConditionRequiredTokens(condition?: AllianceBattleCondition) {
  if (!condition) return [];

  return [
    condition.recommendedType,
    condition.requiredAlignment,
    condition.requiredGender,
    ...condition.requiredTags,
  ]
    .filter((value) => value !== 'Any')
    .map((value) => normalizeCharacterKey(value))
    .filter(Boolean);
}

function hasConditionToken(tokens: Set<string>, token: string) {
  if (token === 'hero') return tokens.has('hero') || tokens.has('superhero');
  if (token === 'villain') return tokens.has('villain') || tokens.has('supervillain');
  return tokens.has(token);
}

function matchesAllianceBattleCondition(member: SheetMember, condition?: AllianceBattleCondition) {
  const requiredTokens = getConditionRequiredTokens(condition);
  if (requiredTokens.length === 0) return true;

  return getMemberConditionTokenGroups(member).some((tokens) => requiredTokens.every((token) => hasConditionToken(tokens, token)));
}

function getRestrictedPickerMembers(condition?: AllianceBattleCondition) {
  return characterPickerMembers.filter((member) => matchesAllianceBattleCondition(member, condition));
}

function normalizeCtpSlug(ctp: string) {
  return ctp
    .replace(/^Mighty\s+/i, '')
    .replace(/^Brilliant\s+/i, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function ctpIconSrc(ctp: string) {
  return `https://thanosvibs.money/static/assets/items/ctp_${normalizeCtpSlug(ctp)}.png`;
}

function normalizeCtpKeyForReadiness(ctp: string) {
  const value = ctp
    .replace(/^Mighty\s+/i, '')
    .replace(/^Brilliant\s+/i, '')
    .trim()
    .toLowerCase();
  const compact = value.replace(/[^a-z0-9가-힣]+/g, '');

  if (compact.includes('분노') || compact.includes('rage')) return 'rage';
  if (compact.includes('경쟁') || compact.includes('competition')) return 'competition';
  if (compact.includes('통찰') || compact.includes('insight')) return 'insight';
  if (compact.includes('해방') || compact.includes('liberation')) return 'liberation';
  return compact;
}

function isDealerReadyCtp(ctp: string) {
  return ['rage', 'competition'].includes(normalizeCtpKeyForReadiness(ctp));
}

function isZeusJudgementDealer(member?: SheetMember | null) {
  return Boolean(member && normalizeCharacterKey(member.id) === 'zeus' && normalizeCtpKeyForReadiness(member.ctp) === 'judgement');
}

function isDealerReadyMember(member: SheetMember) {
  return isDealerReadyCtp(member.ctp) || isZeusJudgementDealer(member);
}

function isBufferReadyCtp(ctp: string) {
  return ['insight', 'liberation'].includes(normalizeCtpKeyForReadiness(ctp));
}

function isSoloDealBufferSetReady(bufferCtps: string[]) {
  const normalized = bufferCtps.map(normalizeCtpKeyForReadiness);
  const unique = new Set(normalized);
  return normalized.length === 2
    && unique.size === 2
    && unique.has('insight')
    && unique.has('liberation');
}

function emptySheetCustomizations(): SheetCustomizations {
  return { memberOverrides: {}, ctpOverrides: {}, roleOverrides: {} };
}

function migrateDealerSlotOverrides(dealerSlotOverrides: Record<string, number> = {}): RoleOverrides {
  return Object.entries(dealerSlotOverrides).reduce<RoleOverrides>((roles, [dealerKey, index]) => {
    if (!dealerKey.endsWith(':dealer') || typeof index !== 'number' || index < 0 || index > 2) return roles;
    roles[`${dealerKey.slice(0, -':dealer'.length)}:${index}`] = 'dealer';
    return roles;
  }, {});
}

function readStoredCustomizations(): SheetCustomizations {
  if (typeof window === 'undefined') return emptySheetCustomizations();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(sheetCustomizationStorageKey) ?? '{}') as {
      memberOverrides?: Record<string, SheetMember>;
      ctpOverrides?: Record<string, string>;
      roleOverrides?: RoleOverrides;
      dealerSlotOverrides?: Record<string, number>;
    };
    return {
      memberOverrides: parsed.memberOverrides ?? {},
      ctpOverrides: parsed.ctpOverrides ?? {},
      roleOverrides: parsed.roleOverrides ?? migrateDealerSlotOverrides(parsed.dealerSlotOverrides),
    };
  } catch {
    return emptySheetCustomizations();
  }
}

function writeStoredCustomizations(customizations: SheetCustomizations) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(sheetCustomizationStorageKey, JSON.stringify(customizations));
  } catch {
    // Local customizations are optional; the table still works if storage is blocked.
  }
}

function areCustomizationsEqual(left: SheetCustomizations, right: SheetCustomizations) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function IconStrip({ icons, size = 'md' }: { icons: AllianceBattleIcon[]; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-7 w-7 p-0.5' : 'h-10 w-10 p-1';

  return (
    <div className="flex flex-nowrap items-center justify-center gap-1 leading-none">
      {icons.map((icon) => (
        <span key={`${icon.kind}-${icon.key}`} className={`${sizeClass} grid shrink-0 place-items-center bg-white`} title={icon.label}>
          <Image src={icon.src} alt={icon.label} width={36} height={36} unoptimized className="block h-full w-full object-contain" />
        </span>
      ))}
    </div>
  );
}

function PlayerCell({
  member,
  label,
  slotKey,
  role,
  onCharacterClick,
  onCtpClick,
  onToggleRole,
}: {
  member?: SheetMember | null;
  label: string;
  slotKey: string;
  role: UsageRoleGroup;
  onCharacterClick?: () => void;
  onCtpClick?: () => void;
  onToggleRole?: () => void;
}) {
  const roleLabel = role === 'dealer' ? '딜러' : '버퍼';

  if (!member) {
    return (
      <div className="flex min-h-[60px] flex-col items-center justify-center text-[10px] font-bold text-slate-400">
        <span className="grid h-9 w-9 place-items-center border border-slate-300 bg-slate-50">-</span>
        <span className="mt-1">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-[72px] flex-col items-center justify-center text-center" title={`${roleLabel} · ${member.name}${member.uniformName ? ` · ${member.uniformName}` : ''} · ${member.ctp}`}>
      <div className="grid grid-cols-[18px_40px_22px] items-center gap-1">
        <button
          type="button"
          onClick={onToggleRole}
          data-testid={`alliance-battle-toggle-role-${slotKey}`}
          aria-pressed={role === 'dealer'}
          className={`flex h-10 w-[18px] flex-col items-center justify-center border text-[9px] font-black leading-none transition ${role === 'dealer' ? 'border-yellow-500 bg-yellow-300 text-slate-950' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-yellow-300 hover:bg-yellow-50 hover:text-slate-950'}`}
          aria-label={`${member.name} ${role === 'dealer' ? '버퍼로 변경' : '딜러로 변경'}`}
        >
          {roleLabel.split('').map((syllable, syllableIndex) => (
            <span key={`${syllable}-${syllableIndex}`}>{syllable}</span>
          ))}
        </button>
        <button type="button" onClick={onCharacterClick} className="group grid h-10 w-10 place-items-center border border-slate-300 bg-white transition hover:border-purple-500 hover:ring-2 hover:ring-purple-100" aria-label={`${member.name} 캐릭터 교체`}>
          <Image src={member.portraitUrl} alt={member.name} width={38} height={38} unoptimized className="h-[38px] w-[38px] object-cover" />
        </button>
        <button type="button" onClick={onCtpClick} className="grid h-[22px] w-[22px] place-items-center rounded-full transition hover:bg-purple-50 hover:ring-2 hover:ring-purple-100" aria-label={`${member.name} CTP 교체`}>
          <Image src={ctpIconSrc(member.ctp)} alt={`${member.name} ${member.ctp}`} width={20} height={20} unoptimized className="h-5 w-5 object-contain drop-shadow-sm" />
        </button>
      </div>
      <p className="mt-0.5 max-w-[88px] whitespace-normal break-words text-[10px] font-black leading-[1.05] text-slate-950">{member.name}</p>
      {member.uniformName ? <p className="max-w-[112px] whitespace-normal break-words text-[9px] font-bold leading-[1.05] text-purple-600">{member.uniformName}</p> : null}
    </div>
  );
}

function TeamBlock({
  content,
  round,
  teamKind,
  members,
  label,
  condition,
  roleOverrides,
  onToggleRole,
  onOpenPicker,
}: {
  content: ScheduleContent;
  round: number;
  teamKind: TeamKind;
  members: Array<SheetMember | null>;
  label: string;
  condition?: AllianceBattleCondition;
  roleOverrides: RoleOverrides;
  onToggleRole: (slotKey: string) => void;
  onOpenPicker: (picker: PickerState) => void;
}) {
  const readiness = evaluateTeamReadiness(content, round, teamKind, members, roleOverrides);

  return (
    <div className="grid min-w-[332px] grid-cols-[50px_minmax(276px,1fr)] items-center gap-1 px-0.5 py-0">
      <TeamStatusRail teamKind={teamKind} readiness={readiness} />
      <div className="grid grid-cols-3 items-center gap-1">
        {members.map((member, index) => {
          const key = makeSlotKey(content, round, teamKind, index);
          const slotLabel = `${index + 1}번`;
          return (
            <PlayerCell
              key={key}
              member={member}
              label={slotLabel}
              slotKey={key}
              role={getSlotRole(content, round, teamKind, index, roleOverrides, member)}
              onToggleRole={member ? () => onToggleRole(key) : undefined}
              onCharacterClick={member ? () => onOpenPicker({ kind: 'character', slotKey: key, member, label: `${round}회차 ${label} ${slotLabel}`, condition, conditionLabel: formatRestrictionLabel(condition) }) : undefined}
              onCtpClick={member ? () => onOpenPicker({ kind: 'ctp', slotKey: key, member, label: `${round}회차 ${label} ${slotLabel}` }) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

function TeamStatusRail({ teamKind, readiness }: { teamKind: TeamKind; readiness: TeamReadiness }) {
  const title = readiness.ready ? '완료: CTP 조건 충족' : readiness.reasons.join(' / ');

  return (
    <div className="flex min-h-[64px] flex-col items-center justify-center gap-1 border-r border-slate-200 pr-1 text-center" title={title}>
      <span className={`w-full rounded px-1 py-0.5 text-[9px] font-black leading-none ${teamKind === 'tagPlay' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
        {usageTeamLabels[teamKind]}
      </span>
      <div className="flex items-center justify-center gap-1">
        <span
          data-testid="alliance-battle-team-ready-check"
          className={`grid h-5 w-5 place-items-center rounded-full border ${readiness.ready ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-slate-50 text-slate-300'}`}
          aria-label={readiness.ready ? '조합 조건 완료' : '조합 조건 미완료'}
        >
          <CheckCircle2 size={13} strokeWidth={3} />
        </span>
        <span
          data-testid="alliance-battle-team-ready-warning"
          className={`grid h-5 w-5 place-items-center rounded-full border ${readiness.ready ? 'border-slate-200 bg-slate-50 text-slate-300' : 'border-amber-400 bg-amber-300 text-slate-950'}`}
          aria-label={readiness.ready ? '보완 없음' : '조합 조건 보완'}
        >
          <AlertTriangle size={12} strokeWidth={3} />
        </span>
      </div>
      <span className={`text-[9px] font-black leading-none ${readiness.ready ? 'text-emerald-600' : 'text-amber-700'}`}>
        {readiness.ready ? '완료' : '보완'}
      </span>
    </div>
  );
}

function abxComboMembers(keys?: AbxCharacterKey[]) {
  return keys?.map(toAbxMember) ?? [];
}

function makeSlotKey(content: ScheduleContent, round: number, teamKind: TeamKind, index: number) {
  return `${content}:${round}:${teamKind}:${index}`;
}

function getDefaultSlotRole(index: number, member?: SheetMember | null): UsageRoleGroup {
  if (member) {
    if (isBufferReadyCtp(member.ctp)) return 'buffer';
    if (isDealerReadyMember(member)) return 'dealer';
  }

  return index === 1 ? 'dealer' : 'buffer';
}

function getSlotRole(content: ScheduleContent, round: number, teamKind: TeamKind, index: number, roleOverrides: RoleOverrides, member?: SheetMember | null) {
  return roleOverrides[makeSlotKey(content, round, teamKind, index)] ?? getDefaultSlotRole(index, member);
}

function evaluateTeamReadiness(
  content: ScheduleContent,
  round: number,
  teamKind: TeamKind,
  members: Array<SheetMember | null>,
  roleOverrides: RoleOverrides,
): TeamReadiness {
  const occupiedSlots = members
    .map((member, index) => ({
      member,
      role: getSlotRole(content, round, teamKind, index, roleOverrides, member),
    }))
    .filter((slot): slot is { member: SheetMember; role: UsageRoleGroup } => Boolean(slot.member));
  const dealers = occupiedSlots.filter((slot) => slot.role === 'dealer');
  const buffers = occupiedSlots.filter((slot) => slot.role === 'buffer');
  const reasons: string[] = [];

  if (dealers.length !== 1) {
    reasons.push('딜러 1명 지정 필요');
  } else if (!isDealerReadyMember(dealers[0].member)) {
    reasons.push('딜러 CTP 분노/경쟁 필요');
  }

  if (teamKind === 'soloDeal') {
    if (!isSoloDealBufferSetReady(buffers.map((slot) => slot.member.ctp))) {
      reasons.push('솔딜 버퍼 CTP 통찰+해방 중복 없이 필요');
    }
  } else if (buffers.length === 0 || !buffers.every((slot) => isBufferReadyCtp(slot.member.ctp))) {
    reasons.push('태그플 버퍼 CTP 통찰 또는 해방 필요');
  }

  return {
    ready: reasons.length === 0,
    reasons,
  };
}

function resolveMember(baseMember: SheetMember, slotKey: string, memberOverrides: Record<string, SheetMember>, ctpOverrides: Record<string, string>) {
  const memberOverride = memberOverrides[slotKey];
  const member = memberOverride ?? baseMember;
  const slotDefaultCtp = memberOverride ? undefined : defaultCtpByComboSlot[slotKey];
  return { ...member, ctp: ctpOverrides[slotKey] ?? slotDefaultCtp ?? member.ctp };
}

function resolveTeamMembers(
  content: ScheduleContent,
  round: number,
  teamKind: TeamKind,
  members: SheetMember[],
  memberOverrides: Record<string, SheetMember>,
  ctpOverrides: Record<string, string>,
) {
  const slots = (members.length ? [...members, null, null, null] : [null, null, null]).slice(0, 3);

  return slots.map((baseMember, index) => {
    if (!baseMember) return null;
    return resolveMember(baseMember, makeSlotKey(content, round, teamKind, index), memberOverrides, ctpOverrides);
  });
}

function getBestComboForDay(day: AllianceBattleCalendarDay, content: ScheduleContent) {
  return content === 'ABX' ? abxBestCombos[day.round] : ablBestCombos[day.round];
}

const usageCombatTypes: UsageCombatType[] = ['Combat', 'Blast', 'Speed', 'Universal'];
const usageContents: ScheduleContent[] = ['ABX', 'ABL'];
const usageTeamKinds: TeamKind[] = ['tagPlay', 'soloDeal'];
const usageTeamLabels: Record<TeamKind, string> = {
  tagPlay: '태그플',
  soloDeal: '솔딜',
};
const usageRoleLabels: Record<UsageRoleGroup, string> = {
  buffer: '버퍼',
  dealer: '딜러',
};
const dealerNeedCtpKeys = ['competition', 'rage'] as const;
const bufferNeedCtpKeys = ['insight', 'liberation'] as const;
const ctpNeedDefinitions: Record<TrackedCtpKey, { label: string; ctp: string }> = {
  competition: { label: '경쟁', ctp: 'Competition' },
  rage: { label: '분노', ctp: 'Rage' },
  insight: { label: '통찰', ctp: 'Insight' },
  liberation: { label: '해방', ctp: 'Liberation' },
};

function getMemberCombatType(member: SheetMember): UsageCombatType {
  const appCharacter = characterById.get(member.id)
    ?? appCharacterByCatalogKey.get(normalizeCharacterKey(member.id))
    ?? appCharacterByCatalogKey.get(normalizeCharacterKey(member.name));
  const catalogCharacter = getCatalogCharacterForMember(member);
  const type = appCharacter?.type ?? catalogCharacter?.type;

  return type === 'Combat' || type === 'Blast' || type === 'Speed' || type === 'Universal' ? type : 'Unknown';
}

function buildUsageRows(counts: Map<string, UsageCountRow>) {
  return Array.from(counts.values()).sort((left, right) => {
    if (right.total !== left.total) return right.total - left.total;
    if (right.tagPlay !== left.tagPlay) return right.tagPlay - left.tagPlay;
    if (right.soloDeal !== left.soloDeal) return right.soloDeal - left.soloDeal;
    return left.member.name.localeCompare(right.member.name, 'ko');
  });
}

function getTrackedCtpKey(ctp: string): TrackedCtpKey | null {
  const key = normalizeCtpKeyForReadiness(ctp);
  return key === 'competition' || key === 'rage' || key === 'insight' || key === 'liberation' ? key : null;
}

function getUsageCtpMemberKey(member: SheetMember) {
  return normalizeCtpKeyForReadiness(member.ctp);
}

function addUsageCtpMember(row: UsageCountRow, member: SheetMember) {
  const key = getUsageCtpMemberKey(member);
  const current = row.ctpMembers[key];

  if (current) {
    current.count += 1;
    current.member = member;
    return;
  }

  row.ctpMembers[key] = { member, count: 1 };
}

function addUsageCount(counts: Map<string, UsageCountRow>, member: SheetMember, teamKind: TeamKind) {
  const key = normalizeCharacterKey(member.id || member.name);
  const current = counts.get(key);

  if (current) {
    current[teamKind] += 1;
    current.total += 1;
    addUsageCtpMember(current, member);
    return;
  }

  counts.set(key, {
    member,
    tagPlay: teamKind === 'tagPlay' ? 1 : 0,
    soloDeal: teamKind === 'soloDeal' ? 1 : 0,
    total: 1,
    ctpMembers: { [getUsageCtpMemberKey(member)]: { member, count: 1 } },
  });
}

function createUsageBuckets() {
  return {
    buffer: new Map<string, UsageCountRow>(),
    dealer: new Map<string, UsageCountRow>(),
  } satisfies UsageLookup;
}

function groupUsageRowsByType(rows: UsageCountRow[]) {
  const rowsByType = new Map<UsageCombatType, UsageCountRow[]>();

  for (const row of rows) {
    const type = getMemberCombatType(row.member);
    rowsByType.set(type, [...(rowsByType.get(type) ?? []), row]);
  }

  const types = [...usageCombatTypes, ...Array.from(rowsByType.keys()).filter((type) => !usageCombatTypes.includes(type))];
  return types
    .map((type) => ({ type, rows: rowsByType.get(type) ?? [] }))
    .filter((group) => group.rows.length > 0 || group.type !== 'Unknown');
}

function getUsageRowCtpMembers(row: UsageCountRow) {
  const members = Object.values(row.ctpMembers);
  return members.length ? members : [{ member: row.member, count: row.total }];
}

function buildCtpNeedRows(groups: UsageTypeGroup[], keys: readonly TrackedCtpKey[]): CtpNeedRow[] {
  const buckets = new Map<TrackedCtpKey, Map<string, CtpUsageMember>>(
    keys.map((key) => [key, new Map<string, CtpUsageMember>()]),
  );

  groups.flatMap((group) => group.rows).forEach((row) => {
    getUsageRowCtpMembers(row).forEach((usage) => {
      const { member } = usage;
      const key = getTrackedCtpKey(member.ctp);
      if (!key || !buckets.has(key)) return;
      const bucket = buckets.get(key);
      const memberKey = normalizeCharacterKey(member.id || member.name);
      const current = bucket?.get(memberKey);
      if (current) {
        current.count += usage.count;
        current.member = member;
      } else {
        bucket?.set(memberKey, { member, count: usage.count });
      }
    });
  });

  return keys.map((key) => ({
    key,
    ...ctpNeedDefinitions[key],
    members: Array.from(buckets.get(key)?.values() ?? []).sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.member.name.localeCompare(right.member.name, 'ko');
    }),
  }));
}

function buildUsageLookup(
  calendar: AllianceBattleCalendarDay[],
  memberOverrides: Record<string, SheetMember>,
  ctpOverrides: Record<string, string>,
  options: UsageCountOptions = {},
): UsageLookup {
  const buckets = createUsageBuckets();
  const contents = options.contents ?? usageContents;
  const teamKinds = options.teamKinds ?? usageTeamKinds;
  const roleOverrides = options.roleOverrides ?? {};

  for (const day of calendar) {
    for (const content of contents) {
      const comboForDay = getBestComboForDay(day, content);

      for (const teamKind of teamKinds) {
        abxComboMembers(comboForDay?.[teamKind]).slice(0, 3).forEach((baseMember, index) => {
          const slotKey = makeSlotKey(content, day.round, teamKind, index);
          const member = resolveMember(baseMember, slotKey, memberOverrides, ctpOverrides);
          const role = getSlotRole(content, day.round, teamKind, index, roleOverrides, member);
          addUsageCount(buckets[role], member, teamKind);
        });
      }
    }
  }

  return buckets;
}

function summarizeUsageLookup(lookup: UsageLookup): UsageCountSummary {
  return {
    buffers: groupUsageRowsByType(buildUsageRows(lookup.buffer)),
    dealers: groupUsageRowsByType(buildUsageRows(lookup.dealer)),
  };
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
}

function buildRotationSheetCalendar(today: string): AllianceBattleCalendarDay[] {
  const todayRound = getAllianceBattleRoundForDate(today).round;

  return allianceBattleRotation.map((round, index) => {
    const date = addDays(ALLIANCE_BATTLE_ROTATION_START_DATE, index);
    const abx = round.conditions.find((item) => item.content === 'ABX');
    const abl = round.conditions.find((item) => item.content === 'ABL');
    const infinite = round.conditions.find((item) => item.content === 'Infinity Challenge');

    return {
      date,
      dayName: getKoreanDayName(date),
      dayOfMonth: Number(date.slice(-2)),
      round: round.round,
      isResetDay: round.isResetDay,
      isToday: round.round === todayRound,
      conditions: round.conditions,
      abx,
      abl,
      infinite,
    };
  });
}

function getUsageCount(row: UsageCountRow | undefined, teamKind: TeamKind) {
  if (!row) return 0;
  return teamKind === 'tagPlay' ? row.tagPlay : row.soloDeal;
}

function ScheduleRow({
  day,
  content,
  teamKind,
  roleOverrides,
  memberOverrides,
  ctpOverrides,
  onToggleRole,
  onOpenPicker,
}: {
  day: AllianceBattleCalendarDay;
  content: ScheduleContent;
  teamKind: TeamKind;
  roleOverrides: RoleOverrides;
  memberOverrides: Record<string, SheetMember>;
  ctpOverrides: Record<string, string>;
  onToggleRole: (slotKey: string) => void;
  onOpenPicker: (picker: PickerState) => void;
}) {
  const condition = content === 'ABX' ? day.abx : day.abl;
  const isInfinityChallenge = !condition && Boolean(day.infinite);
  const manualCombo = getBestComboForDay(day, content);
  const cancelIcons = getCancelEffectIcons(condition);
  const activeMembers = resolveTeamMembers(
    content,
    day.round,
    teamKind,
    abxComboMembers(manualCombo?.[teamKind]),
    memberOverrides,
    ctpOverrides,
  );
  const activeTeamLabel = usageTeamLabels[teamKind];

  if (!condition && !manualCombo) {
    return (
      <tr className={day.isToday ? 'bg-lime-50' : 'bg-white'}>
        <td className="w-[136px] border border-black bg-white px-0.5 py-0.5 align-middle">
          <div className="grid min-h-[64px] place-items-center px-1 text-center text-sm font-black leading-snug text-slate-950">
            {isInfinityChallenge ? '-' : 'ㅇㅅㅇ'}
          </div>
        </td>
        <td className="w-[104px] border border-black bg-white px-0.5 py-0.5 align-middle">
          <div className="flex min-h-[64px] flex-col items-center justify-center gap-0.5">
            <div className="grid h-7 place-items-center text-xs font-black leading-none text-slate-400">-</div>
            <div className="grid w-full max-w-[76px] grid-cols-2 border-t border-black text-center text-[10px] font-black leading-none text-slate-700">
              <span className="border-r border-black py-0.5">{day.round}회차</span>
              <span className="py-0.5">{day.dayName}</span>
            </div>
          </div>
        </td>
        <td className="border border-black px-0.5 py-0.5 align-middle" data-testid="alliance-battle-empty-combo">
          <div className="grid min-h-[64px] place-items-center text-sm font-black text-slate-500">없음</div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={day.isToday ? 'bg-lime-50' : 'bg-white'}>
      <td className="w-[136px] border border-black bg-white px-0.5 py-0.5 align-middle">
        {isInfinityChallenge ? (
          <div className="grid min-h-[64px] place-items-center px-1 text-center text-sm font-black leading-snug text-slate-950">
            인피니티<br />챌린지
          </div>
        ) : (
          <div className="flex min-h-[64px] items-center justify-center">
            <IconStrip icons={getRestrictionIcons(condition)} />
          </div>
        )}
      </td>
      <td className="w-[104px] border border-black bg-white px-0.5 py-0.5 align-middle">
        <div className="flex min-h-[64px] flex-col items-center justify-center gap-0.5">
          <IconStrip icons={cancelIcons} size="sm" />
          <div className="grid w-full max-w-[76px] grid-cols-2 border-t border-black text-center text-[10px] font-black leading-none text-slate-700">
            <span className="border-r border-black py-0.5">{day.round}회차</span>
            <span className="py-0.5">{day.dayName}</span>
          </div>
        </div>
      </td>
      <td className="border border-black px-0.5 py-0.5 align-middle">
        <TeamBlock
          content={content}
          round={day.round}
          teamKind={teamKind}
          members={activeMembers}
          label={activeTeamLabel}
          condition={condition}
          roleOverrides={roleOverrides}
          onToggleRole={onToggleRole}
          onOpenPicker={onOpenPicker}
        />
      </td>
    </tr>
  );
}

function PickerPanel({
  picker,
  onSelectCharacter,
  onSelectCtp,
  onClose,
}: {
  picker: PickerState;
  onSelectCharacter: (member: SheetMember) => void;
  onSelectCtp: (ctp: string) => void;
  onClose: () => void;
}) {
  const [characterQuery, setCharacterQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<SheetMember | null>(null);
  const deferredCharacterQuery = useDeferredValue(characterQuery);
  const restrictedCharacterPickerMembers = useMemo(() => getRestrictedPickerMembers(picker?.condition), [picker?.condition]);
  const visibleCharacterPickerMembers = useMemo(() => {
    const query = deferredCharacterQuery.trim().toLowerCase();
    if (!query) return restrictedCharacterPickerMembers;

    return restrictedCharacterPickerMembers.filter((member) => `${member.name} ${member.id}`.toLowerCase().includes(query));
  }, [deferredCharacterQuery, restrictedCharacterPickerMembers]);
  const selectedUniformOptions = useMemo(() => (selectedMember ? getUniformOptionsForMember(selectedMember) : []), [selectedMember]);

  useEffect(() => {
    if (picker?.kind === 'character') {
      setCharacterQuery('');
      setSelectedMember(picker.member);
      return;
    }
    setSelectedMember(null);
  }, [picker]);

  if (!picker) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6" data-testid="alliance-battle-picker">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-purple-600">{picker.kind === 'character' ? '캐릭터 교체' : 'CTP 교체'}</p>
          <h3 className="text-sm font-black text-slate-950">{picker.label} · {picker.member.name}</h3>
        </div>
        <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-black text-slate-600 hover:bg-slate-50">닫기</button>
      </div>

      {picker.kind === 'character' ? (
        <>
          <div className="shrink-0 border-b border-slate-100 p-3">
            <div className="flex items-center gap-2">
              <input
                value={characterQuery}
                onChange={(event) => setCharacterQuery(event.target.value)}
                placeholder="캐릭터 검색"
                aria-label="캐릭터 검색"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
              />
              <span className="rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-600">{visibleCharacterPickerMembers.length}/{restrictedCharacterPickerMembers.length}</span>
            </div>
            {picker.conditionLabel ? (
              <p data-testid="alliance-battle-picker-condition" className="mt-2 rounded-xl bg-purple-50 px-3 py-2 text-[11px] font-black text-purple-700">
                조건: {picker.conditionLabel}
              </p>
            ) : null}
          </div>
          <div className="grid min-h-0 flex-1 gap-3 overflow-hidden p-3 lg:grid-cols-[260px_1fr]">
            <div data-testid="alliance-battle-character-scroll" className="min-h-0 overscroll-contain overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
              <p className="mb-2 px-1 text-[11px] font-black text-slate-500">1. 캐릭터 선택</p>
              <div className="grid grid-cols-2 gap-2">
                {visibleCharacterPickerMembers.length ? visibleCharacterPickerMembers.map((member) => {
                  const selected = selectedMember?.id === member.id;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedMember(member)}
                      className={`rounded-xl border p-2 text-center transition hover:border-purple-300 hover:bg-purple-50 ${selected ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-100' : 'border-slate-200 bg-white'}`}
                    >
                      <Image src={member.portraitUrl} alt={member.name} width={54} height={54} unoptimized className="mx-auto h-[54px] w-[54px] object-cover" />
                      <span className="mt-1 block truncate text-[10px] font-black text-slate-800">{member.name}</span>
                    </button>
                  );
                }) : (
                  <p className="col-span-full rounded-xl bg-white p-4 text-center text-xs font-black text-slate-400">검색 결과 없음</p>
                )}
              </div>
            </div>
            <div data-testid="alliance-battle-uniform-scroll" className="min-h-0 overscroll-contain overflow-y-auto rounded-xl border border-slate-100 bg-white p-2">
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <p className="text-[11px] font-black text-slate-500">2. 유니폼 최종 선택</p>
                {selectedMember ? <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-black text-purple-700">{selectedUniformOptions.length}개</span> : null}
              </div>
              {selectedMember ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(116px,1fr))] gap-2">
                  {selectedUniformOptions.map((uniform, index) => {
                    const selectedUniformName = selectedMember.uniformName ?? getCatalogCharacterForMember(selectedMember)?.uniforms[0]?.name;
                    const active = selectedUniformName === uniform.name;
                    return (
                      <button
                        key={`${selectedMember.id}-${uniform.name}-${index}`}
                        type="button"
                        onClick={() => onSelectCharacter(applyUniformToMember(selectedMember, uniform))}
                        className={`min-w-0 rounded-xl border p-2 text-left transition hover:border-purple-300 hover:bg-purple-50 ${active ? 'border-purple-400 bg-purple-50' : 'border-slate-200 bg-slate-50'}`}
                      >
                        <Image
                          src={uniform.imageUrl ?? selectedMember.portraitUrl}
                          alt={`${selectedMember.name} ${uniform.name}`}
                          width={88}
                          height={88}
                          unoptimized
                          className="mx-auto h-[88px] w-[88px] rounded-xl object-cover"
                        />
                        <span className="mt-2 block truncate text-[11px] font-black text-slate-900">{selectedMember.name}</span>
                        <span className="line-clamp-2 block min-h-8 text-[10px] font-bold leading-tight text-purple-600">{uniform.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-center text-xs font-black text-slate-400">캐릭터를 먼저 선택하세요</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div data-testid="alliance-battle-ctp-grid" className="grid min-h-0 grid-cols-2 gap-2 overflow-y-auto overscroll-contain p-3">
          {ctpOptions.map((ctp) => (
            <button
              key={ctp}
              type="button"
              onClick={() => onSelectCtp(ctp)}
              className="flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-center transition hover:border-purple-300 hover:bg-purple-50"
            >
              <Image src={ctpIconSrc(ctp)} alt={ctp} width={28} height={28} unoptimized className="h-7 w-7 object-contain" />
              <span className="max-w-full truncate text-xs font-black text-slate-800">{ctp}</span>
            </button>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

const usageTypeLabels: Record<UsageCombatType, string> = {
  Combat: '컴뱃',
  Blast: '블래스트',
  Speed: '스피드',
  Universal: '유니버셜',
  Unknown: '기타',
};
const usageTypeColors: Record<UsageCombatType, string> = {
  Combat: 'border-red-200 bg-red-50 text-red-700',
  Blast: 'border-sky-200 bg-sky-50 text-sky-700',
  Speed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Universal: 'border-purple-200 bg-purple-50 text-purple-700',
  Unknown: 'border-slate-200 bg-slate-50 text-slate-700',
};

function flattenUsageGroups(groups: UsageTypeGroup[], teamKind: TeamKind) {
  return groups
    .flatMap((group) => group.rows)
    .sort((left, right) => {
      const rightCount = getUsageCount(right, teamKind);
      const leftCount = getUsageCount(left, teamKind);
      if (rightCount !== leftCount) return rightCount - leftCount;
      return left.member.name.localeCompare(right.member.name, 'ko');
    });
}

function UsageRankingList({ title, rows, teamKind }: { title: string; rows: UsageCountRow[]; teamKind: TeamKind }) {
  return (
    <section className="min-w-0 border border-black bg-white">
      <div className="flex items-center justify-between border-b border-black bg-slate-950 px-2 py-2 text-white">
        <h3 className="text-sm font-black text-yellow-300">{title}</h3>
        <span className="text-[10px] font-black text-slate-300">많은순</span>
      </div>
      <div className="divide-y divide-slate-200">
        {rows.map((row, index) => {
          const count = getUsageCount(row, teamKind);
          return (
            <div key={`${title}-${row.member.id}`} className="grid grid-cols-[24px_minmax(0,1fr)_64px] items-center gap-1.5 px-1.5 py-1">
              <span className="text-center text-[11px] font-black text-slate-500">{index + 1}</span>
              <div className="flex min-w-0 items-center gap-1.5">
                <Image src={row.member.portraitUrl} alt={row.member.name} width={30} height={30} unoptimized className="h-[30px] w-[30px] shrink-0 object-cover ring-1 ring-slate-200" />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-black text-slate-950">{row.member.name}</p>
                  {row.member.uniformName ? <p className="truncate text-[9px] font-bold text-purple-600">{row.member.uniformName}</p> : null}
                </div>
              </div>
              <span className="flex items-center justify-end gap-1 text-right text-xs font-black text-purple-700">
                <Image src={ctpIconSrc(row.member.ctp)} alt={`${row.member.name} ${row.member.ctp}`} width={18} height={18} unoptimized className="h-[18px] w-[18px] shrink-0 object-contain drop-shadow-sm" />
                {count}회
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function UsageRankingPanel({ summary, teamKind }: { summary: UsageCountSummary; teamKind: TeamKind }) {
  const dealerRows = flattenUsageGroups(summary.dealers, teamKind);
  const bufferRows = flattenUsageGroups(summary.buffers, teamKind);

  return (
    <aside className="min-w-0 border-2 border-black bg-slate-100" data-testid="alliance-battle-usage-ranking">
      <div className="border-b-2 border-black bg-blue-700 px-2 py-2 text-center">
        <p className="text-[10px] font-black uppercase tracking-wide text-blue-100">ABX + ABL {usageTeamLabels[teamKind]}</p>
        <h2 className="text-lg font-black text-yellow-300">사용 순위</h2>
      </div>
      <div data-testid="alliance-battle-usage-ranking-lists" className="grid gap-1.5 p-1.5 lg:grid-cols-2">
        <UsageRankingList title="딜러 순위" rows={dealerRows} teamKind={teamKind} />
        <UsageRankingList title="버퍼 순위" rows={bufferRows} teamKind={teamKind} />
      </div>
    </aside>
  );
}

function UsageTypeHeader({ type }: { type: UsageCombatType }) {
  const icon = getAllianceAttributeIcon(type);

  return (
    <div className={`flex items-center justify-between border-b px-2 py-2 ${usageTypeColors[type]}`}>
      <div className="flex min-w-0 items-center gap-2">
        {icon ? (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white ring-1 ring-white/60">
            <Image src={icon.src} alt={icon.label} width={28} height={28} unoptimized className="h-7 w-7 object-contain" />
          </span>
        ) : null}
        <p className="truncate text-sm font-black">{usageTypeLabels[type]}</p>
      </div>
      <span className="w-[72px] text-center text-[11px] font-black">횟수</span>
    </div>
  );
}

function UsageMemberRow({ row, teamKind }: { row: UsageCountRow; teamKind: TeamKind }) {
  const count = getUsageCount(row, teamKind);

  return (
    <div className="grid min-h-[48px] grid-cols-[minmax(0,1fr)_72px] items-center border-b border-slate-200 bg-white last:border-b-0">
      <div className="flex min-w-0 items-center gap-1.5 px-2 py-1">
        <Image src={row.member.portraitUrl} alt={row.member.name} width={34} height={34} unoptimized className="h-[34px] w-[34px] shrink-0 object-cover ring-1 ring-slate-200" />
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-slate-950">{row.member.name}</p>
          {row.member.uniformName ? <p className="truncate text-[9px] font-bold text-purple-600">{row.member.uniformName}</p> : null}
        </div>
      </div>
      <span className="flex h-full items-center justify-center gap-1 border-l border-slate-200 bg-yellow-50 text-sm font-black text-slate-950">
        <Image src={ctpIconSrc(row.member.ctp)} alt={`${row.member.name} ${row.member.ctp}`} width={20} height={20} unoptimized className="h-5 w-5 shrink-0 object-contain drop-shadow-sm" />
        {count}
      </span>
    </div>
  );
}

function UsageTypeGroupPanel({ group, teamKind }: { group: UsageTypeGroup; teamKind: TeamKind }) {
  return (
    <div className="min-w-0 overflow-hidden border border-slate-300 bg-white">
      <UsageTypeHeader type={group.type} />
      <div>
        {group.rows.length ? group.rows.map((row) => (
          <UsageMemberRow key={`${group.type}-${row.member.id}`} row={row} teamKind={teamKind} />
        )) : (
          <p className="px-3 py-8 text-center text-xs font-black text-slate-400">사용 캐릭터 없음</p>
        )}
      </div>
    </div>
  );
}

function CtpNeedSummaryTable({ role, groups }: { role: UsageRoleGroup; groups: UsageTypeGroup[] }) {
  const keys = role === 'dealer' ? dealerNeedCtpKeys : bufferNeedCtpKeys;
  const rows = buildCtpNeedRows(groups, keys);

  return (
    <div className="border-t-2 border-black bg-white" data-testid={`alliance-battle-${role}-ctp-need-summary`}>
      <div className="grid grid-cols-[96px_64px_minmax(0,1fr)] border-b border-slate-300 bg-slate-950 px-2 py-1.5 text-[11px] font-black text-white">
        <span>CTP</span>
        <span className="text-center">필요</span>
        <span className="text-right">사용 영웅</span>
      </div>
      {rows.map((row) => (
        <div key={`${role}-${row.key}`} className="grid min-h-[42px] grid-cols-[96px_64px_minmax(0,1fr)] items-center border-b border-slate-200 px-2 py-1 last:border-b-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <Image src={ctpIconSrc(row.ctp)} alt={row.label} width={22} height={22} unoptimized className="h-[22px] w-[22px] shrink-0 object-contain drop-shadow-sm" />
            <span className="truncate text-xs font-black text-slate-950">{row.label}</span>
          </div>
          <span className="text-center text-sm font-black text-purple-700">{row.members.length}개</span>
          <div className="flex min-w-0 flex-wrap justify-end gap-1">
            {row.members.length ? row.members.map(({ member, count }) => (
              <Image
                key={`${row.key}-${member.id}`}
                src={member.portraitUrl}
                alt={member.name}
                width={28}
                height={28}
                unoptimized
                title={`${member.name} · ${row.label} · ${count}회`}
                className="h-7 w-7 shrink-0 object-cover ring-1 ring-slate-200"
              />
            )) : (
              <span className="text-[11px] font-black text-slate-400">없음</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function UsageRoleSection({ role, groups, teamKind }: { role: UsageRoleGroup; groups: UsageTypeGroup[]; teamKind: TeamKind }) {
  return (
    <section className="overflow-hidden border-2 border-black bg-slate-50">
      <div className="border-b-2 border-black bg-blue-700 px-3 py-2 text-center">
        <h3 className="text-base font-black text-yellow-300">{usageRoleLabels[role]} 상세 순위</h3>
      </div>
      <div className="grid gap-2 p-2 md:grid-cols-2">
        {groups.map((group) => <UsageTypeGroupPanel key={`${role}-${group.type}`} group={group} teamKind={teamKind} />)}
      </div>
      <CtpNeedSummaryTable role={role} groups={groups} />
    </section>
  );
}

function UsageCountSummaryPanel({ summary, teamKind }: { summary: UsageCountSummary; teamKind: TeamKind }) {
  const teamLabel = usageTeamLabels[teamKind];

  return (
    <div className="min-w-0 border-2 border-black bg-slate-100" data-testid="alliance-battle-usage-detail-panel">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-black bg-white px-3 py-2">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">ABX + ABL {teamLabel} usage count</p>
          <h2 className="text-lg font-black text-slate-950">상세 순위</h2>
        </div>
      </div>
      <div data-testid="alliance-battle-usage-detail-sections" className="grid gap-2 p-2 2xl:grid-cols-2">
        <UsageRoleSection role="dealer" groups={summary.dealers} teamKind={teamKind} />
        <UsageRoleSection role="buffer" groups={summary.buffers} teamKind={teamKind} />
      </div>
    </div>
  );
}

function UsageAnalysisPanel({ summary, teamKind }: { summary: UsageCountSummary; teamKind: TeamKind }) {
  return (
    <div data-testid="alliance-battle-usage-analysis-layout" className="grid items-start gap-2 p-2 xl:grid-cols-[minmax(360px,520px)_minmax(0,1fr)]">
      <UsageRankingPanel summary={summary} teamKind={teamKind} />
      <UsageCountSummaryPanel summary={summary} teamKind={teamKind} />
    </div>
  );
}

function AllianceBattleTableChunk({
  chunk,
  content,
  activeTeamLabel,
  toneClass,
  teamKind,
  roleOverrides,
  memberOverrides,
  ctpOverrides,
  onToggleRole,
  onOpenPicker,
}: {
  chunk: BattleRoundChunk;
  content: ScheduleContent;
  activeTeamLabel: string;
  toneClass: string;
  teamKind: TeamKind;
  roleOverrides: RoleOverrides;
  memberOverrides: Record<string, SheetMember>;
  ctpOverrides: Record<string, string>;
  onToggleRole: (slotKey: string) => void;
  onOpenPicker: (picker: PickerState) => void;
}) {
  return (
    <div data-testid={`alliance-battle-round-chunk-${chunk.label}`} className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-black bg-slate-950 px-2 py-1 text-center text-xs font-black text-yellow-300" colSpan={3}>
              {chunk.label}
            </th>
          </tr>
          <tr>
            <th className="border border-black bg-fuchsia-800 px-2 py-1 text-white" colSpan={2}>
              <span className="text-xs font-black">조건 / 해제</span>
            </th>
            <th className="border border-black bg-yellow-300 px-2 py-2 text-center text-base font-black">
              <span className={toneClass}>{content} 표 · {activeTeamLabel} 조합</span>
            </th>
          </tr>
          <tr className="bg-white text-[11px] font-black text-slate-700">
            <th className="border border-black px-1 py-1.5">조건</th>
            <th className="border border-black px-1 py-1.5">해제/회차</th>
            <th className="border border-black px-1 py-1.5">{activeTeamLabel} 조합</th>
          </tr>
        </thead>
        <tbody>
          {chunk.days.map((day) => (
            <ScheduleRow
              key={`${content}-${day.date}`}
              day={day}
              content={content}
              teamKind={teamKind}
              roleOverrides={roleOverrides}
              memberOverrides={memberOverrides}
              ctpOverrides={ctpOverrides}
              onToggleRole={onToggleRole}
              onOpenPicker={onOpenPicker}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AllianceBattleSheet({ calendar, content, today }: { calendar: AllianceBattleCalendarDay[]; content: ScheduleContent; today: string }) {
  const meta = contentMeta[content];
  const toneClass = meta.tone === 'abx' ? 'text-blue-700' : 'text-purple-700';
  const conditionDays = calendar.filter((day) => (content === 'ABX' ? day.abx || day.infinite : day.abl)).length;
  const [memberOverrides, setMemberOverrides] = useState<Record<string, SheetMember>>({});
  const [ctpOverrides, setCtpOverrides] = useState<Record<string, string>>({});
  const [roleOverrides, setRoleOverrides] = useState<RoleOverrides>({});
  const [savedMemberOverrides, setSavedMemberOverrides] = useState<Record<string, SheetMember>>({});
  const [savedCtpOverrides, setSavedCtpOverrides] = useState<Record<string, string>>({});
  const [savedRoleOverrides, setSavedRoleOverrides] = useState<RoleOverrides>({});
  const [picker, setPicker] = useState<PickerState>(null);
  const [activeTeamKind, setActiveTeamKind] = useState<TeamKind>('tagPlay');
  const activeTeamLabel = usageTeamLabels[activeTeamKind];
  const hasPendingCustomizations = !areCustomizationsEqual(
    { memberOverrides, ctpOverrides, roleOverrides },
    { memberOverrides: savedMemberOverrides, ctpOverrides: savedCtpOverrides, roleOverrides: savedRoleOverrides },
  );
  const usageLookup = useMemo(
    () => buildUsageLookup(calendar, savedMemberOverrides, savedCtpOverrides, { contents: usageContents, teamKinds: [activeTeamKind], roleOverrides: savedRoleOverrides }),
    [calendar, activeTeamKind, savedMemberOverrides, savedCtpOverrides, savedRoleOverrides],
  );
  const usageSummary = useMemo(
    () => summarizeUsageLookup(usageLookup),
    [usageLookup],
  );
  const calendarChunks = useMemo<BattleRoundChunk[]>(() => [
    { label: '1-14회', days: calendar.slice(0, 14) },
    { label: '15-28회', days: calendar.slice(14, 28) },
  ], [calendar]);

  useEffect(() => {
    const stored = readStoredCustomizations();
    setMemberOverrides(stored.memberOverrides);
    setCtpOverrides(stored.ctpOverrides);
    setRoleOverrides(stored.roleOverrides);
    setSavedMemberOverrides(stored.memberOverrides);
    setSavedCtpOverrides(stored.ctpOverrides);
    setSavedRoleOverrides(stored.roleOverrides);
  }, []);

  useEffect(() => {
    if (!picker) return;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [picker]);

  const selectCharacter = (member: SheetMember) => {
    if (!picker) return;
    setMemberOverrides((previous) => ({ ...previous, [picker.slotKey]: member }));
    setCtpOverrides((previous) => {
      const next = { ...previous };
      delete next[picker.slotKey];
      return next;
    });
    setPicker(null);
  };

  const selectCtp = (ctp: string) => {
    if (!picker) return;
    setCtpOverrides((previous) => ({ ...previous, [picker.slotKey]: ctp }));
    setPicker(null);
  };

  const resetCustomizations = () => {
    const emptyCustomizations = emptySheetCustomizations();
    setMemberOverrides(emptyCustomizations.memberOverrides);
    setCtpOverrides(emptyCustomizations.ctpOverrides);
    setRoleOverrides(emptyCustomizations.roleOverrides);
    setSavedMemberOverrides(emptyCustomizations.memberOverrides);
    setSavedCtpOverrides(emptyCustomizations.ctpOverrides);
    setSavedRoleOverrides(emptyCustomizations.roleOverrides);
    writeStoredCustomizations(emptyCustomizations);
    setPicker(null);
  };

  const toggleSlotRole = (slotKey: string) => {
    setRoleOverrides((previous) => ({
      ...previous,
      [slotKey]: previous[slotKey] === 'dealer' ? 'buffer' : 'dealer',
    }));
  };

  const saveAllCustomizations = () => {
    setSavedMemberOverrides(memberOverrides);
    setSavedCtpOverrides(ctpOverrides);
    setSavedRoleOverrides(roleOverrides);
    writeStoredCustomizations({ memberOverrides, ctpOverrides, roleOverrides });
  };

  return (
    <section className="overflow-hidden rounded-none border-2 border-black bg-white shadow-sm">
      <div className="border-b-2 border-black bg-emerald-700 px-4 py-4 text-center">
        <h2 className="text-2xl font-black text-yellow-300">{meta.title}</h2>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-black text-emerald-50">
          <span>28라운드 로테이션 · {today} 기준 오늘 회차 표시 · {meta.modeLabel} · {conditionDays} 조건일</span>
          <button
            type="button"
            onClick={saveAllCustomizations}
            disabled={!hasPendingCustomizations}
            data-testid="alliance-battle-save-all"
            className={`rounded-full border px-2 py-0.5 text-[10px] font-black transition ${hasPendingCustomizations ? 'border-yellow-200 bg-yellow-300 text-slate-950 hover:bg-yellow-200' : 'border-emerald-200/40 text-emerald-100 opacity-60'}`}
          >
            전체 저장
          </button>
          <button type="button" onClick={resetCustomizations} className="rounded-full border border-emerald-200/60 px-2 py-0.5 text-[10px] font-black text-white hover:bg-emerald-600">기본값</button>
          <span className="rounded-full bg-emerald-900/60 px-2 py-0.5 text-[10px] text-emerald-100">
            {hasPendingCustomizations ? '사용순위 갱신 대기' : '사용순위 반영됨'}
          </span>
        </div>
        <div className="mt-3 inline-grid grid-cols-2 overflow-hidden border-2 border-emerald-200 bg-emerald-900 text-xs font-black text-white">
          {usageTeamKinds.map((kind) => {
            const active = activeTeamKind === kind;
            return (
              <button
                key={kind}
                type="button"
                data-testid={`alliance-battle-team-toggle-${kind}`}
                aria-pressed={active}
                onClick={() => setActiveTeamKind(kind)}
                className={`px-8 py-2 transition ${active ? 'bg-yellow-300 text-slate-950' : 'bg-emerald-900 text-emerald-50 hover:bg-emerald-800'}`}
              >
                {usageTeamLabels[kind]}
              </button>
            );
          })}
        </div>
      </div>

      <div data-testid="alliance-battle-compact-table-layout" className="space-y-2 p-2">
        <div data-testid="alliance-battle-round-split" className="grid items-start gap-2 2xl:grid-cols-2">
          {calendarChunks.map((chunk) => (
            <AllianceBattleTableChunk
              key={chunk.label}
              chunk={chunk}
              content={content}
              activeTeamLabel={activeTeamLabel}
              toneClass={toneClass}
              teamKind={activeTeamKind}
              roleOverrides={roleOverrides}
              memberOverrides={memberOverrides}
              ctpOverrides={ctpOverrides}
              onToggleRole={toggleSlotRole}
              onOpenPicker={setPicker}
            />
          ))}
        </div>
      </div>
      <UsageAnalysisPanel summary={usageSummary} teamKind={activeTeamKind} />
      <PickerPanel picker={picker} onSelectCharacter={selectCharacter} onSelectCtp={selectCtp} onClose={() => setPicker(null)} />
    </section>
  );
}

export function AllianceBattleSchedule({ today = getKstDateKey(), content = 'ABX' }: { today?: string; content?: ScheduleContent }) {
  const calendar = useMemo(() => buildRotationSheetCalendar(today), [today]);

  return (
    <AllianceBattleSheet calendar={calendar} content={content} today={today} />
  );
}
