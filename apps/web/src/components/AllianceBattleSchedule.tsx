'use client';

import Image from 'next/image';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { characters, userRoster } from '@/lib/data';
import {
  ALLIANCE_BATTLE_ROTATION_START_DATE,
  allianceBattleRotation,
  cancelEffectLabels,
  formatRestrictionLabel,
  getAllianceBattleRoundForDate,
  getCancelEffectIcons,
  getKoreanDayName,
  getKstDateKey,
  getAllianceAttributeIcon,
  getRestrictionIcons,
  type AllianceBattleCalendarDay,
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
} | null;
type UsageCountRow = {
  member: SheetMember;
  tagPlay: number;
  soloDeal: number;
  total: number;
};
type UsageRoleGroup = 'buffer' | 'dealer';
type UsageCombatType = CombatType | 'Unknown';
type UsageTypeGroup = {
  type: UsageCombatType;
  rows: UsageCountRow[];
};
type UsageCountSummary = {
  buffers: UsageTypeGroup[];
  dealers: UsageTypeGroup[];
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
  odin: { id: 'odin', name: '오딘', portraitUrl: portrait('odin2') },
  ronan: { id: 'ronan', name: '로난', portraitUrl: portrait('ronan3') },
  zeus: { id: 'zeus', name: '제우스', portraitUrl: portrait('zeus') },
  madelynePryor: { id: 'madelyne-pryor', name: '매들린 프라이어', portraitUrl: portrait('madelynepryor1') },
  polaris: { id: 'polaris', name: '폴라리스', portraitUrl: portrait('polaris1') },
  jeanGrey: { id: 'jean-grey', name: '진 그레이', portraitUrl: portrait('jeangrey3') },
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

const combo = (tagPlay: AbxCharacterKey[], soloDeal: AbxCharacterKey[]): AbxBestCombo => ({ tagPlay, soloDeal });
const abxFreeCombo = combo(['valkyrie', 'doctorStrange', 'philCoulson'], ['dazzler', 'cyclops', 'storm']);
const infinityChallengeCombo = combo(['dazzler', 'cyclops', 'storm'], ['ghostPanther', 'satana', 'mephisto']);
const universalVillainCombo = combo(['dormammu', 'hades', 'mephisto'], ['morganLeFay', 'hades', 'mephisto']);

const abxBestCombos: Partial<Record<number, AbxBestCombo>> = {
  1: combo(['whiteFox', 'mistyKnight', 'lunaSnow'], ['whiteFox', 'mistyKnight', 'lunaSnow']),
  2: abxFreeCombo,
  3: infinityChallengeCombo,
  4: combo(['valkyrie', 'crescent', 'athena'], ['valkyrie', 'crescent', 'athena']),
  5: combo(['sin', 'bullseye', 'blackCat'], ['sin', 'blackCat', 'bullseye']),
  6: universalVillainCombo,
  7: combo(['wolverine', 'gambit', 'cyclops'], ['silverSamurai', 'cyclops', 'gambit']),
  8: combo(['valkyrie', 'gladiator', 'athena'], ['valkyrie', 'sleeper', 'venom']),
  9: abxFreeCombo,
  10: infinityChallengeCombo,
  11: combo(['mbaku', 'crescent', 'venom'], ['agentVenom', 'mbaku', 'venom']),
  12: combo(['novaRichardRider', 'loki', 'odin'], ['novaRichardRider', 'ronan', 'loki']),
  13: combo(['cyclops', 'doctorStrange', 'philCoulson'], ['philCoulson', 'cyclops', 'gambit']),
  14: combo(['madelynePryor', 'polaris', 'jeanGrey'], ['mystique', 'polaris', 'jeanGrey']),
  15: universalVillainCombo,
  16: abxFreeCombo,
  17: infinityChallengeCombo,
  18: combo(['mysterio', 'doctorStrange', 'ironMan'], ['mysterio', 'doctorStrange', 'enchantress']),
  19: combo(['novaRichardRider', 'loki', 'sylvie'], ['novaRichardRider', 'ronan', 'loki']),
  20: combo(['valkyrie', 'gamora', 'athena'], ['valkyrie', 'gamora', 'athena']),
  21: combo(['ironheart', 'invisibleWoman', 'valeriaRichards'], ['ironheart', 'invisibleWoman', 'valeriaRichards']),
  22: combo(['scarletSpider', 'bullseye', 'moonKnight'], ['scarletSpider', 'greenGoblin', 'bullseye']),
  23: abxFreeCombo,
  24: infinityChallengeCombo,
  25: combo(['yondu', 'loki', 'odin'], ['yondu', 'ronan', 'loki']),
  26: combo(['hulk', 'ares', 'winterSoldier'], ['taskmaster', 'ares', 'redHulk']),
  27: combo(['satana', 'scarletWitch', 'doctorVoodoo'], ['satana', 'scarletWitch', 'doctorVoodoo']),
  28: combo(['sin', 'scarletWitch', 'enchantress'], ['sin', 'scarletWitch', 'enchantress']),
};

const ablFireCombo = combo(['ghostPanther', 'satana', 'mephisto'], ['ghostPanther', 'satana', 'mephisto']);
const ablMindFemaleCombo = combo(['sin', 'scarletWitch', 'morganLeFay'], ['sin', 'scarletWitch', 'morganLeFay']);
const ablLunaCombo = combo(['whiteFox', 'mistyKnight', 'lunaSnow'], ['whiteFox', 'mistyKnight', 'lunaSnow']);

const ablBestCombos: Partial<Record<number, AbxBestCombo>> = {
  1: combo(['doctorVoodoo', 'mephisto', 'ghostPanther'], ['doctorVoodoo', 'mephisto', 'ghostPanther']),
  2: ablFireCombo,
  4: ablMindFemaleCombo,
  5: combo(['dazzler', 'cyclops', 'storm'], ['dazzler', 'cyclops', 'storm']),
  6: combo(['taskmaster', 'winterSoldier', 'ares'], ['taskmaster', 'ares', 'redHulk']),
  7: combo(['enchantress', 'hades', 'ares'], ['proximaMidnight', 'hades', 'enchantress']),
  8: ablMindFemaleCombo,
  9: ablFireCombo,
  11: combo(['mysterio', 'redHulk', 'mephisto'], ['mysterio', 'redHulk', 'mephisto']),
  12: ablLunaCombo,
  13: combo(['x23', 'storm', 'dazzler'], ['dazzler', 'polaris', 'storm']),
  14: combo(['scarletSpider', 'nickFury', 'moonKnight'], ['scarletSpider', 'nickFury', 'moonKnight']),
  15: combo(['sin', 'milesMorales', 'bullseye'], ['sin', 'milesMorales', 'blackCat']),
  16: ablFireCombo,
  18: ablLunaCombo,
  19: combo(['athena', 'gladiator', 'ares'], ['valkyrie', 'ares', 'athena']),
  20: combo(['cyclops', 'doctorStrange', 'philCoulson'], ['philCoulson', 'cyclops', 'gambit']),
  21: combo(['medusa', 'crystal', 'msMarvel'], ['medusa', 'blackBolt', 'crystal']),
  22: combo(['novaRichardRider', 'zeus', 'odin'], ['novaRichardRider', 'ronan', 'loki']),
  23: ablFireCombo,
  25: combo(['satana', 'scarletWitch', 'phylaVell'], ['satana', 'scarletWitch', 'phylaVell']),
  26: combo(['yondu', 'loki', 'sylvie'], ['yondu', 'ronan', 'loki']),
  27: combo(['kidOmega', 'cyclops', 'gambit'], ['silverSamurai', 'cyclops', 'gambit']),
  28: combo(['agentVenom', 'mbaku', 'venom'], ['agentVenom', 'mbaku', 'venom']),
};

const ctpOptions = [
  'Rage',
  'Judgement',
  'Energy',
  'Insight',
  'Authority',
  'Greed',
  'Destruction',
  'Refinement',
  'Regeneration',
  'Transcendence',
  'Patience',
  'Conquest',
  'Liberation',
  'Veteran',
  'Competition',
] as const;

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

function readStoredCustomizations() {
  if (typeof window === 'undefined') return { memberOverrides: {}, ctpOverrides: {} };

  try {
    const parsed = JSON.parse(window.localStorage.getItem(sheetCustomizationStorageKey) ?? '{}') as {
      memberOverrides?: Record<string, SheetMember>;
      ctpOverrides?: Record<string, string>;
    };
    return {
      memberOverrides: parsed.memberOverrides ?? {},
      ctpOverrides: parsed.ctpOverrides ?? {},
    };
  } catch {
    return { memberOverrides: {}, ctpOverrides: {} };
  }
}

function IconStrip({ icons, size = 'md' }: { icons: AllianceBattleIcon[]; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-7 w-7 p-0.5' : 'h-10 w-10 p-1';

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {icons.map((icon) => (
        <span key={`${icon.kind}-${icon.key}`} className={`${sizeClass} grid place-items-center bg-white`} title={icon.label}>
          <Image src={icon.src} alt={icon.label} width={36} height={36} unoptimized className="h-full w-full object-contain" />
        </span>
      ))}
    </div>
  );
}

function PlayerCell({
  member,
  label,
  onCharacterClick,
  onCtpClick,
}: {
  member?: SheetMember | null;
  label: string;
  onCharacterClick?: () => void;
  onCtpClick?: () => void;
}) {
  if (!member) {
    return (
      <div className="flex min-h-[82px] flex-col items-center justify-center text-[10px] font-bold text-slate-400">
        <span className="grid h-10 w-10 place-items-center border border-slate-300 bg-slate-50">-</span>
        <span className="mt-1">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-[82px] flex-col items-center justify-start text-center" title={`${label} · ${member.name}${member.uniformName ? ` · ${member.uniformName}` : ''} · ${member.ctp}`}>
      <button type="button" onClick={onCharacterClick} className="group grid h-[48px] w-[48px] place-items-center border border-slate-300 bg-white transition hover:border-purple-500 hover:ring-2 hover:ring-purple-100" aria-label={`${member.name} 캐릭터 교체`}>
        <Image src={member.portraitUrl} alt={member.name} width={46} height={46} unoptimized className="h-[46px] w-[46px] object-cover" />
      </button>
      <p className="mt-1 max-w-[66px] truncate text-[10px] font-black leading-tight text-slate-950">{member.name}</p>
      {member.uniformName ? <p className="max-w-[66px] truncate text-[9px] font-bold leading-tight text-purple-600">{member.uniformName}</p> : null}
      <button type="button" onClick={onCtpClick} className="mt-0.5 grid h-[24px] w-[24px] place-items-center rounded-full transition hover:bg-purple-50 hover:ring-2 hover:ring-purple-100" aria-label={`${member.name} CTP 교체`}>
        <Image src={ctpIconSrc(member.ctp)} alt={`${member.name} ${member.ctp}`} width={22} height={22} unoptimized className="h-[22px] w-[22px] object-contain drop-shadow-sm" />
      </button>
    </div>
  );
}

function TeamBlock({
  content,
  round,
  teamKind,
  members,
  label,
  memberOverrides,
  ctpOverrides,
  onOpenPicker,
}: {
  content: ScheduleContent;
  round: number;
  teamKind: TeamKind;
  members: SheetMember[];
  label: string;
  memberOverrides: Record<string, SheetMember>;
  ctpOverrides: Record<string, string>;
  onOpenPicker: (picker: PickerState) => void;
}) {
  return (
    <div className="grid min-w-[222px] grid-cols-3 gap-1 px-1 py-1">
      {(members.length ? members : [null, null, null]).slice(0, 3).map((baseMember, index) => {
        const key = makeSlotKey(content, round, teamKind, index);
        const member = baseMember ? resolveMember(baseMember, key, memberOverrides, ctpOverrides) : null;
        const roleLabel = index === 0 ? '리더' : index === 1 ? '딜러' : '지원';
        return (
          <PlayerCell
            key={key}
            member={member}
            label={roleLabel}
            onCharacterClick={member ? () => onOpenPicker({ kind: 'character', slotKey: key, member, label: `${round}회차 ${label} ${roleLabel}` }) : undefined}
            onCtpClick={member ? () => onOpenPicker({ kind: 'ctp', slotKey: key, member, label: `${round}회차 ${label} ${roleLabel}` }) : undefined}
          />
        );
      })}
    </div>
  );
}

function abxComboMembers(keys?: AbxCharacterKey[]) {
  return keys?.map(toAbxMember) ?? [];
}

function makeSlotKey(content: ScheduleContent, round: number, teamKind: TeamKind, index: number) {
  return `${content}:${round}:${teamKind}:${index}`;
}

function resolveMember(baseMember: SheetMember, slotKey: string, memberOverrides: Record<string, SheetMember>, ctpOverrides: Record<string, string>) {
  const member = memberOverrides[slotKey] ?? baseMember;
  return { ...member, ctp: ctpOverrides[slotKey] ?? member.ctp };
}

function getBestComboForDay(day: AllianceBattleCalendarDay, content: ScheduleContent) {
  const condition = content === 'ABX' ? day.abx : day.abl;
  if (!condition && day.infinite) return infinityChallengeCombo;

  return content === 'ABX' ? abxBestCombos[day.round] : ablBestCombos[day.round];
}

const usageCombatTypes: UsageCombatType[] = ['Combat', 'Blast', 'Speed', 'Universal'];
const usageContents: ScheduleContent[] = ['ABX', 'ABL'];
const usageTeamLabels: Record<TeamKind, string> = {
  tagPlay: '굇수',
  soloDeal: '일반',
};
const usageRoleLabels: Record<UsageRoleGroup, string> = {
  buffer: '버퍼',
  dealer: '딜러',
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

function addUsageCount(counts: Map<string, UsageCountRow>, member: SheetMember, teamKind: TeamKind) {
  const key = normalizeCharacterKey(member.id || member.name);
  const current = counts.get(key);

  if (current) {
    current[teamKind] += 1;
    current.total += 1;
    return;
  }

  counts.set(key, {
    member,
    tagPlay: teamKind === 'tagPlay' ? 1 : 0,
    soloDeal: teamKind === 'soloDeal' ? 1 : 0,
    total: 1,
  });
}

function createUsageBuckets() {
  return {
    buffer: new Map<string, UsageCountRow>(),
    dealer: new Map<string, UsageCountRow>(),
  } satisfies Record<UsageRoleGroup, Map<string, UsageCountRow>>;
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

function getUsageCountSummary(
  calendar: AllianceBattleCalendarDay[],
  memberOverrides: Record<string, SheetMember>,
  ctpOverrides: Record<string, string>,
): UsageCountSummary {
  const buckets = createUsageBuckets();

  for (const day of calendar) {
    for (const content of usageContents) {
      const comboForDay = getBestComboForDay(day, content);
      const teams: Array<{ teamKind: TeamKind; members: SheetMember[] }> = [
        { teamKind: 'tagPlay', members: abxComboMembers(comboForDay?.tagPlay) },
        { teamKind: 'soloDeal', members: abxComboMembers(comboForDay?.soloDeal) },
      ];

      for (const team of teams) {
        team.members.slice(0, 3).forEach((baseMember, index) => {
          const slotKey = makeSlotKey(content, day.round, team.teamKind, index);
          const member = resolveMember(baseMember, slotKey, memberOverrides, ctpOverrides);
          const role: UsageRoleGroup = index === 1 ? 'dealer' : 'buffer';
          addUsageCount(buckets[role], member, team.teamKind);
        });
      }
    }
  }

  return {
    buffers: groupUsageRowsByType(buildUsageRows(buckets.buffer)),
    dealers: groupUsageRowsByType(buildUsageRows(buckets.dealer)),
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

function ScheduleRow({
  day,
  content,
  memberOverrides,
  ctpOverrides,
  onOpenPicker,
}: {
  day: AllianceBattleCalendarDay;
  content: ScheduleContent;
  memberOverrides: Record<string, SheetMember>;
  ctpOverrides: Record<string, string>;
  onOpenPicker: (picker: PickerState) => void;
}) {
  const condition = content === 'ABX' ? day.abx : day.abl;
  const isInfinityChallenge = !condition && Boolean(day.infinite);
  const manualCombo = getBestComboForDay(day, content);
  const cancelIcons = getCancelEffectIcons(condition);
  const tagPlayMembers = abxComboMembers(manualCombo?.tagPlay);
  const soloDealMembers = abxComboMembers(manualCombo?.soloDeal);

  if (!condition && !manualCombo) {
    return (
      <tr className={day.isToday ? 'bg-lime-50' : 'bg-white'}>
        <td className="border border-black bg-white px-4 py-12 text-center text-xl font-black text-slate-950" colSpan={8}>ㅇㅅㅇ</td>
      </tr>
    );
  }

  return (
    <tr className={day.isToday ? 'bg-lime-50' : day.isResetDay ? 'bg-amber-50' : 'bg-white'}>
      <td className="w-[118px] border border-black bg-white px-1 py-1">
        {isInfinityChallenge ? (
          <div className="grid min-h-[82px] place-items-center px-1 text-center text-base font-black leading-snug text-slate-950">
            인피니티<br />챌린지
          </div>
        ) : (
          <IconStrip icons={getRestrictionIcons(condition)} />
        )}
      </td>
      <td className="w-[92px] border border-black bg-white px-1 py-1">
        <IconStrip icons={cancelIcons} size="sm" />
        <div className="mt-1 grid grid-cols-2 border-t border-black text-center text-[10px] font-black text-slate-700">
          <span className="border-r border-black py-1">{day.round}회차</span>
          <span className="py-1">{day.dayName}</span>
        </div>
      </td>
      <td className="border border-black px-2 py-1 text-center text-[11px] font-black text-slate-800">굇수</td>
      <td className="border border-black px-1 py-1">
        <TeamBlock
          content={content}
          round={day.round}
          teamKind="tagPlay"
          members={tagPlayMembers}
          label="굇수"
          memberOverrides={memberOverrides}
          ctpOverrides={ctpOverrides}
          onOpenPicker={onOpenPicker}
        />
      </td>
      <td className="border border-black px-2 py-1 text-center text-[11px] font-black text-slate-800">일반</td>
      <td className="border border-black px-1 py-1">
        <TeamBlock
          content={content}
          round={day.round}
          teamKind="soloDeal"
          members={soloDealMembers}
          label="일반"
          memberOverrides={memberOverrides}
          ctpOverrides={ctpOverrides}
          onOpenPicker={onOpenPicker}
        />
      </td>
      <td className="border border-black px-2 py-1 text-center text-[11px] font-bold leading-relaxed text-slate-600">
        {isInfinityChallenge ? '인피니티 챌린지' : formatRestrictionLabel(condition)}
      </td>
      <td className="border border-black px-2 py-1 text-center text-[11px] font-bold leading-relaxed text-slate-600">
        {condition?.cancelEffects.map((effect) => cancelEffectLabels[effect] ?? effect).join(' / ') || '자유'}
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
  const visibleCharacterPickerMembers = useMemo(() => {
    const query = deferredCharacterQuery.trim().toLowerCase();
    if (!query) return characterPickerMembers;

    return characterPickerMembers.filter((member) => `${member.name} ${member.id}`.toLowerCase().includes(query));
  }, [deferredCharacterQuery]);
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
              <span className="rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-600">{visibleCharacterPickerMembers.length}/{characterPickerMembers.length}</span>
            </div>
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
        <div className="grid min-h-0 grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2 overflow-y-auto overscroll-contain p-3">
          {ctpOptions.map((ctp) => (
            <button
              key={ctp}
              type="button"
              onClick={() => onSelectCtp(ctp)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-left transition hover:border-purple-300 hover:bg-purple-50"
            >
              <Image src={ctpIconSrc(ctp)} alt={ctp} width={28} height={28} unoptimized className="h-7 w-7 object-contain" />
              <span className="truncate text-xs font-black text-slate-800">{ctp}</span>
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
      <div className="grid w-[132px] grid-cols-3 text-center text-[11px] font-black">
        <span>{usageTeamLabels.tagPlay}</span>
        <span>{usageTeamLabels.soloDeal}</span>
        <span>합계</span>
      </div>
    </div>
  );
}

function UsageMemberRow({ row }: { row: UsageCountRow }) {
  return (
    <div className="grid min-h-[58px] grid-cols-[minmax(0,1fr)_132px] items-center border-b border-slate-200 bg-white last:border-b-0">
      <div className="flex min-w-0 items-center gap-2 px-2 py-1.5">
        <Image src={row.member.portraitUrl} alt={row.member.name} width={42} height={42} unoptimized className="h-[42px] w-[42px] shrink-0 object-cover ring-1 ring-slate-200" />
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-slate-950">{row.member.name}</p>
          {row.member.uniformName ? <p className="truncate text-[10px] font-bold text-purple-600">{row.member.uniformName}</p> : null}
        </div>
      </div>
      <div className="grid h-full grid-cols-3 text-center text-sm font-black text-slate-950">
        <span className="grid place-items-center border-l border-slate-200">{row.tagPlay || ''}</span>
        <span className="grid place-items-center border-l border-slate-200">{row.soloDeal || ''}</span>
        <span className="grid place-items-center border-l border-slate-200 bg-yellow-50 text-base">{row.total}</span>
      </div>
    </div>
  );
}

function UsageTypeGroupPanel({ group }: { group: UsageTypeGroup }) {
  return (
    <div className="min-w-0 overflow-hidden border border-slate-300 bg-white">
      <UsageTypeHeader type={group.type} />
      <div className="max-h-[390px] overflow-y-auto">
        {group.rows.length ? group.rows.map((row) => (
          <UsageMemberRow key={`${group.type}-${row.member.id}`} row={row} />
        )) : (
          <p className="px-3 py-8 text-center text-xs font-black text-slate-400">사용 캐릭터 없음</p>
        )}
      </div>
    </div>
  );
}

function UsageRoleSection({ role, groups }: { role: UsageRoleGroup; groups: UsageTypeGroup[] }) {
  return (
    <section className="overflow-hidden border-2 border-black bg-slate-50">
      <div className="border-b-2 border-black bg-blue-700 px-4 py-3 text-center">
        <h3 className="text-xl font-black text-yellow-300">{usageRoleLabels[role]} 사용 횟수</h3>
      </div>
      <div className="grid gap-3 p-3 xl:grid-cols-4">
        {groups.map((group) => <UsageTypeGroupPanel key={`${role}-${group.type}`} group={group} />)}
      </div>
    </section>
  );
}

function UsageCountSummaryPanel({ summary }: { summary: UsageCountSummary }) {
  return (
    <div className="border-t-2 border-black bg-slate-100 p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">ABX + ABL combined usage count</p>
          <h2 className="text-xl font-black text-slate-950">ABX/ABL 합산 사용횟수</h2>
        </div>
        <p className="text-xs font-bold text-slate-500">타입별 분리 · 굇수/일반 조합 별도 집계 · 합계 많이 쓰는 순</p>
      </div>
      <div className="grid gap-4">
        <UsageRoleSection role="buffer" groups={summary.buffers} />
        <UsageRoleSection role="dealer" groups={summary.dealers} />
      </div>
    </div>
  );
}

function AllianceBattleSheet({ calendar, content, today }: { calendar: AllianceBattleCalendarDay[]; content: ScheduleContent; today: string }) {
  const meta = contentMeta[content];
  const toneClass = meta.tone === 'abx' ? 'text-blue-700' : 'text-purple-700';
  const conditionDays = calendar.filter((day) => (content === 'ABX' ? day.abx || day.infinite : day.abl || day.infinite)).length;
  const [memberOverrides, setMemberOverrides] = useState<Record<string, SheetMember>>({});
  const [ctpOverrides, setCtpOverrides] = useState<Record<string, string>>({});
  const [customizationsReady, setCustomizationsReady] = useState(false);
  const [picker, setPicker] = useState<PickerState>(null);
  const usageSummary = useMemo(
    () => getUsageCountSummary(calendar, memberOverrides, ctpOverrides),
    [calendar, memberOverrides, ctpOverrides],
  );

  useEffect(() => {
    const stored = readStoredCustomizations();
    setMemberOverrides(stored.memberOverrides);
    setCtpOverrides(stored.ctpOverrides);
    setCustomizationsReady(true);
  }, []);

  useEffect(() => {
    if (!customizationsReady) return;
    try {
      window.localStorage.setItem(sheetCustomizationStorageKey, JSON.stringify({ memberOverrides, ctpOverrides }));
    } catch {
      // Local customizations are optional; the table still works if storage is blocked.
    }
  }, [customizationsReady, memberOverrides, ctpOverrides]);

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
    setMemberOverrides({});
    setCtpOverrides({});
    setPicker(null);
  };

  return (
    <section className="overflow-hidden rounded-none border-2 border-black bg-white shadow-sm">
      <div className="border-b-2 border-black bg-emerald-700 px-4 py-4 text-center">
        <h2 className="text-2xl font-black text-yellow-300">ABX & ABL 표</h2>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-black text-emerald-50">
          <span>28라운드 로테이션 · {today} 기준 오늘 회차 표시 · {meta.modeLabel} · {conditionDays} 조건일</span>
          <button type="button" onClick={resetCustomizations} className="rounded-full border border-emerald-200/60 px-2 py-0.5 text-[10px] font-black text-white hover:bg-emerald-600">기본값</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1060px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-black bg-fuchsia-800 px-2 py-1 text-white" colSpan={2}>
                <span className="text-xs font-black">조건 / 해제</span>
              </th>
              <th className="border border-black bg-yellow-300 px-3 py-3 text-center text-lg font-black" colSpan={6}>
                <span className={toneClass}>{meta.title}</span>
              </th>
            </tr>
            <tr className="bg-white text-[11px] font-black text-slate-700">
              <th className="border border-black px-2 py-2">조건</th>
              <th className="border border-black px-2 py-2">해제/회차</th>
              <th className="border border-black px-2 py-2">태그플</th>
              <th className="border border-black px-2 py-2">굇수 조합</th>
              <th className="border border-black px-2 py-2">솔딜</th>
              <th className="border border-black px-2 py-2">일반 조합</th>
              <th className="border border-black px-2 py-2">조건명</th>
              <th className="border border-black px-2 py-2">캔슬</th>
            </tr>
          </thead>
          <tbody>
            {calendar.map((day) => (
              <ScheduleRow
                key={`${content}-${day.date}`}
                day={day}
                content={content}
                memberOverrides={memberOverrides}
                ctpOverrides={ctpOverrides}
                onOpenPicker={setPicker}
              />
            ))}
          </tbody>
        </table>
      </div>
      <UsageCountSummaryPanel summary={usageSummary} />
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
