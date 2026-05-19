import type { BuffEffect, Character, UserAccount, UserCharacter } from '@mff-data-hub/types';
import { accountSpecSummary, teamUpAttackBonusByCharacter } from '@mff-data-hub/account';
import type { PvpScoreContent } from './scoreDisplay';
export { monthlyAllianceBattleCalendar, todaysChallenges } from './allianceBattle';

const portraitSlugs: Record<string, string> = {
  blackcat: 'blackcat3',
  captainamerica: 'captainamerica15',
  cyclops: 'cyclops5',
  doctorstrange: 'doctorstrange6',
  dormammu: 'dormammu1',
  greengoblin: 'greengoblin4',
  ironman: 'ironman10',
  jeangrey: 'jeangrey3',
  kang: 'kang1',
  knull: 'knull1',
  loki: 'loki8',
  lunasnow: 'lunasnow5',
  mephisto: 'mephisto1',
  mystique: 'mystique1',
  nickfury: 'nickfury4',
  philcoulson: 'philcoulson2',
  redhulk: 'redhulk3',
  scarletwitch: 'scarletwitch7',
  sharonrogers: 'sharonrogers6',
  spiderman: 'spiderman11',
  storm: 'storm5',
  thanos: 'thanos6',
  thor: 'thor10',
  valkyrie: 'valkyrie2',
  whitefox: 'whitefox2',
  wolverine: 'wolverine7',
};

const p = (slug: string) => `/mff-assets/characters/${portraitSlugs[slug] ?? slug}.webp`;
const u = (id: string, name: string, note: string, tags: string[] = [], pveScoreDelta = 0, pvpScoreDelta = 0) => ({ id, name, note, tags, pveScoreDelta, pvpScoreDelta });
const artifact = (name: string, effect: string, pveScore = 3, pvpScore = 3) => ({ name, effect, pveScore, pvpScore });
const buff = (
  stat: BuffEffect['stat'],
  magnitude: number,
  appliesTo: BuffEffect['appliesTo'],
  source: BuffEffect['source'],
  note?: string,
): BuffEffect => ({ stat, magnitude, appliesTo, source, note });

export const sourceLinks = [
  { label: '티어표', href: 'https://thanosvibs.money/tierlist', note: '타입별 티어, C.T.P 추천, 티어 히스토리 참고용' },
  { label: '리더/서포터', href: 'https://thanosvibs.money/supports', note: '리더/서포터 효과, 필터 구조 참고용' },
  { label: '아티팩트', href: 'https://thanosvibs.money/artifacts', note: '전용 아티팩트 효과/별점 구조 참고용' },
  { label: '캐릭터 초상화', href: 'https://thanosvibs.money/assets/portraits', note: '캐릭터 초상화 URL 패턴 참고용' },
  { label: '코믹 카드', href: 'https://thanosvibs.money/cards', note: '카드 고정/랜덤 옵션과 이미지 경로 참고용' },
  { label: 'X-소드', href: 'https://thanosvibs.money/dailybuggle/script_guide_swords', note: '원소 레벨, 마스터리 공격력, 룬 전략 참고용' },
  { label: 'ABX/ABL 조건표', href: 'https://thanosvibs.money/abxl', note: '28라운드 월간 로테이션, 조건 아이콘, 해제 효과 참고용' },
  { label: '얼라이언스 배틀', href: 'https://future-fight.fandom.com/wiki/Alliance_Battle', note: '일일 요구 조건/입장 구조 검증용' },
  { label: '팀업 컬렉션', href: 'https://future-fight.fandom.com/wiki/Team-Up_Collection', note: '대상 영웅과 적용 범위 참고용' },
  { label: '네이버 카페 커뮤니티', href: 'https://section.cafe.naver.com/ca-fe/home/search/articles?q=%EB%A7%88%EB%B8%94%20%ED%93%A8%EC%B2%98%ED%8C%8C%EC%9D%B4%ED%8A%B8%20ABX%20ABL%20%EC%A1%B0%EA%B1%B4%ED%91%9C', note: '로그인/검색 기반 수동 검증 채널. ABX/ABL 조건표와 조합 논의 확인용' }
];

export const account: UserAccount = {
  agentName: 'Agent#5248',
  agentLevel: 300,
  vip: 15,
  cardAttack: accountSpecSummary.cardAttack,
  accountAttack: accountSpecSummary.accountAttack,
  swordAttack: accountSpecSummary.swordMasteryAllAttack,
  teamUpAttack: accountSpecSummary.teamUpAttackBudget,
  teamUpAttackBonusByCharacter,
  pierce: accountSpecSummary.totalPierce,
  cardPierce: accountSpecSummary.cardPierce,
  swordMasteryLevel: accountSpecSummary.swordMasteryLevel,
  teamUpCollections: accountSpecSummary.activeTeamUpCollections,
  maxCharacters: 287,
  updatedAt: '2026-05-19'
};

export const characters: Character[] = [
  {
    id: 'mephisto', name: 'Mephisto', slug: 'mephisto', portraitUrl: p('mephisto'), type: 'Combat', alignment: 'Villain', gender: 'Male', species: 'Demon', roles: ['dealer', 'hybrid'], tier: 'Native T3', nativeTier: 'Native T3', instinct: 'Cruelty', acquisition: 'Native',
    tags: ['combat', 'villain', 'male', 'demon', 'fire', 'boss', 'pve', 'abx', 'burn'],
    uniforms: [u('mephisto-modern', 'Modern', '화염 딜러 고점, ABX 컴뱃 빌런 후보', ['fire', 'villain'], 3, 1)],
    artifact: artifact('Lord of Hell', '화염/보스 타입 대상 딜 상승, 생존 보정', 5, 3),
    ctpRecommendations: ['Rage', 'Judgement', 'Mighty Judgement'], procFriendly: 'Rage',
    scores: { ABX: 98.5, ABL: 89, 'World Boss': 96, 'Infinity Challenge': 95, 'Team Battle Arena': 84, Otherworld: 90, 'Timeline Battle': 86 },
    buffs: [], rotations: { pve: '3c5dc4 6dc5c4', note: '스킬 cancel 타이밍 기반. Rage/Judgement 둘 다 테스트 필요' },
    buildNotes: ['ABX 컴뱃 빌런일 때 우선 후보', '카드 pierce 높을수록 고점 상승', '아티팩트 5★ 이상이면 안정성 증가'], sourceHint: 'tierlist + portraits'
  },
  {
    id: 'luna-snow', name: 'Luna Snow', slug: 'lunasnow', portraitUrl: p('lunasnow'), type: 'Blast', alignment: 'Hero', gender: 'Female', species: 'Human', roles: ['dealer'], tier: 'T4', instinct: 'Justice', acquisition: 'Premium',
    tags: ['blast', 'hero', 'female', 'human', 'cold', 'music', 'abl', 'abx', 'pve', 'leadership'],
    uniforms: [u('luna-snow-lifestyle', 'Lifestyle Series 2', 'ABL/ABX 고점용 최신 유니폼', ['cold', 'female'], 5, 1), u('luna-snow-andromeda', 'Andromeda Suit', '구형이지만 냉기 딜링 참고용', ['cold'], 1, 0)],
    artifact: artifact('Luna’s Stage', '냉기 피해량 및 생존 보정', 5, 2), ctpRecommendations: ['Judgement', 'Rage'], procFriendly: 'Rage',
    scores: { ABX: 91, ABL: 96.5, 'World Boss': 90, 'Infinity Challenge': 94, 'Team Battle Arena': 72, Otherworld: 82, 'Timeline Battle': 78 },
    buffs: [], rotations: { pve: '3c5dc4 6dc5c4', note: 'Rage/Judgement 세팅에 따라 딜 사이클 다름' }, buildNotes: ['ABL Blast/Female 조건 강함', '전용 아티팩트 우선도 높음', 'Judgement 있으면 원소 피해 시뮬레이션에 반영'], sourceHint: 'tierlist mentions ABX/WBL history'
  },
  {
    id: 'storm', name: 'Storm', slug: 'storm', portraitUrl: p('storm'), type: 'Blast', alignment: 'Hero', gender: 'Female', species: 'Mutant', roles: ['dealer', 'support'], tier: 'T4', instinct: 'Order', acquisition: 'Free',
    tags: ['blast', 'hero', 'female', 'mutant', 'elemental', 'lightning', 'cold', 'abl', 'pve'],
    uniforms: [u('storm-xmen-red', 'X-Men Red', '원소 서포트/딜러 겸용', ['elemental', 'mutant'], 4, 0)], artifact: artifact('Weather Goddess', '원소 피해량 증가', 4, 1), ctpRecommendations: ['Judgement', 'Rage', 'Energy'], procFriendly: 'Flexible',
    scores: { ABX: 92, ABL: 95, 'World Boss': 91, 'Infinity Challenge': 88, 'Team Battle Arena': 70, Otherworld: 72, 'Timeline Battle': 68 },
    buffs: [buff('Elemental Damage', 45, 'elemental', 'Tier-2 Passive', '원소 딜러 보조')], rotations: { pve: '5dc3c4 6dc5', note: '원소 딜러와 조합 시 팀 가치 상승' }, buildNotes: ['원소 딜러 보조로도 가치 있음', 'ABL Blast/Female 대체 후보'], sourceHint: 'tierlist/supports style'
  },
  {
    id: 'cyclops', name: 'Cyclops', slug: 'cyclops', portraitUrl: p('cyclops'), type: 'Blast', alignment: 'Hero', gender: 'Male', species: 'Mutant', roles: ['leader', 'support', 'dealer'], tier: 'T3', instinct: 'Order', acquisition: 'Free',
    tags: ['blast', 'hero', 'male', 'mutant', 'leadership', 'energy', 'support', 'pve'],
    uniforms: [u('cyclops-phoenix-five', 'Phoenix Five', '공격 리더/서포터 겸용', ['leadership', 'energy'], 2, 0)], artifact: artifact('Optic Commander', '에너지 공격/리더십 보정', 3, 1), ctpRecommendations: ['Insight', 'Energy', 'Rage'], procFriendly: 'Proc',
    scores: { ABX: 87, ABL: 93.5, 'World Boss': 86, 'Infinity Challenge': 91, 'Team Battle Arena': 66, Otherworld: 69, 'Timeline Battle': 63 },
    buffs: [buff('All Basic Attacks', 35, 'all', 'Leadership'), buff('Energy Attack', 45, 'all', 'Tier-2 Passive')], rotations: { pve: 'lead/support slot', note: '대부분 리더/서포터 슬롯 가치가 더 큼' }, buildNotes: ['Insight 우선', 'Blast 팀 리더로 안정적'], sourceHint: 'supports'
  },
  {
    id: 'white-fox', name: 'White Fox', slug: 'whitefox', portraitUrl: p('whitefox'), type: 'Speed', alignment: 'Hero', gender: 'Female', species: 'Human', roles: ['leader', 'support'], tier: 'T3', instinct: 'Justice', acquisition: 'Crystalwall',
    tags: ['speed', 'hero', 'female', 'human', 'leadership', 'support', 'pve', 'villain-damage'],
    uniforms: [u('white-fox-lifestyle-2', 'Lifestyle Series 2', '빌런 대상 피해/체인 히트/회피무시 보조 강화', ['leadership', 'support'], 5, 0)], artifact: artifact('White Fox Protocol', '리더십 대상 보조 강화', 5, 1), ctpRecommendations: ['Insight'], procFriendly: 'Manual',
    scores: { ABX: 80, ABL: 86, 'World Boss': 93, 'Infinity Challenge': 92, 'Team Battle Arena': 64, Otherworld: 75, 'Timeline Battle': 70 },
    buffs: [buff('All Debuffs Effect', 40, 'leadership', 'Leadership'), buff('Basic Damage Dealt to Villains', 65, 'leadership', 'Tier-2 Passive'), buff('All Basic Attacks', 15, 'leadership', 'Uniform Effect'), buff('Chain Hit Damage', 10, 'leadership', 'Uniform Effect'), buff('Ignore Dodge', 30, 'leadership', 'Uniform Effect')],
    rotations: { pve: 'support slot', note: '리더십 태그 딜러에게 최상위 보조' }, buildNotes: ['Lifestyle Series 2 보유 여부가 핵심', 'Insight 권장', '리더십 태그 딜러와만 매칭'], sourceHint: 'supports page White Fox lines'
  },
  {
    id: 'valkyrie', name: 'Valkyrie', slug: 'valkyrie', portraitUrl: p('valkyrie'), type: 'Combat', alignment: 'Hero', gender: 'Female', species: 'Asgardian', roles: ['support', 'dealer'], tier: 'T3', instinct: 'Justice', acquisition: 'Premium',
    tags: ['combat', 'hero', 'female', 'alien', 'support', 'boss-damage', 'pve'], uniforms: [u('valkyrie-love-thunder', 'Marvel Studios Thor: Love and Thunder', '보스 타입 피해량 서포트', ['support'], 4, 1)], artifact: artifact('Chooser of the Slain', '보스 피해량/생존 보정', 4, 2), ctpRecommendations: ['Insight', 'Rage'], procFriendly: 'Flexible',
    scores: { ABX: 82, ABL: 84, 'World Boss': 94, 'Infinity Challenge': 90, 'Team Battle Arena': 75, Otherworld: 78, 'Timeline Battle': 72 }, buffs: [buff('Basic Damage Dealt to Boss Types', 50, 'all', 'Tier-2 Passive')], rotations: { pve: 'support slot' }, buildNotes: ['대부분 PVE에서 범용 보조', 'Insight 장착 우선'], sourceHint: 'tierlist/supports'
  },
  {
    id: 'black-cat', name: 'Black Cat', slug: 'blackcat', portraitUrl: p('blackcat'), type: 'Speed', alignment: 'Villain', gender: 'Female', species: 'Human', roles: ['support'], tier: 'T3', instinct: 'Cruelty', acquisition: 'Seasonal',
    tags: ['speed', 'villain', 'female', 'human', 'support', 'villain-support', 'pve', 'seasonal'], uniforms: [u('black-cat-lifestyle', 'Lifestyle Series', '빌런 서포터 핵심', ['support', 'villain'], 5, 1)], artifact: artifact('Queen of Bad Luck', '빌런 딜러 지원/회피 보정', 4, 2), ctpRecommendations: ['Insight'], procFriendly: 'Manual',
    scores: { ABX: 87.5, ABL: 82, 'World Boss': 90, 'Infinity Challenge': 89, 'Team Battle Arena': 72, Otherworld: 82, 'Timeline Battle': 78 }, buffs: [buff('Basic Damage Dealt to Villains', 45, 'villains', 'Uniform Effect'), buff('Ignore Dodge', 30, 'villains', 'Uniform Effect')], rotations: { pve: 'support slot' }, buildNotes: ['빌런 딜러 조합에서 최우선', '시즌 유니폼 보유 여부 체크'], sourceHint: 'supports'
  },
  {
    id: 'phil-coulson', name: 'Phil Coulson', slug: 'philcoulson', portraitUrl: p('philcoulson'), type: 'Combat', alignment: 'Hero', gender: 'Male', species: 'Human', roles: ['support'], tier: 'T3', instinct: 'Order', acquisition: 'Free',
    tags: ['combat', 'hero', 'male', 'human', 'support', 'hero-support', 'villain-damage', 'pve'], uniforms: [u('coulson-modern', 'Modern', '초중반 가성비 빌런 대상 보조', ['support'], 2, 0)], artifact: artifact('Agent of S.H.I.E.L.D.', '영웅 팀 피해량 보조', 3, 1), ctpRecommendations: ['Insight'], procFriendly: 'Manual',
    scores: { ABX: 79, ABL: 83, 'World Boss': 88, 'Infinity Challenge': 86, 'Team Battle Arena': 55, Otherworld: 60, 'Timeline Battle': 52 }, buffs: [buff('Basic Damage Dealt to Villains', 45, 'heroes', 'Tier-2 Passive')], rotations: { pve: 'support slot' }, buildNotes: ['초중반 가성비 보조', '딜러보다 지원 슬롯 추천'], sourceHint: 'supports'
  },
  {
    id: 'shuri', name: 'Shuri', slug: 'shuri', portraitUrl: p('shuri'), type: 'Speed', alignment: 'Hero', gender: 'Female', species: 'Human', roles: ['support', 'dealer'], tier: 'T3', instinct: 'Justice', acquisition: 'Free',
    tags: ['speed', 'hero', 'female', 'human', 'support', 'pve', 'damage-reduction'], uniforms: [u('shuri-wakanda-forever', 'Marvel Studios Black Panther: Wakanda Forever', '범용 PVE 서포트', ['support'], 4, 1)], artifact: artifact('Wakandan Genius', '기본 피해량/생존 보정', 4, 2), ctpRecommendations: ['Insight', 'Rage'], procFriendly: 'Flexible',
    scores: { ABX: 82, ABL: 84, 'World Boss': 92, 'Infinity Challenge': 91, 'Team Battle Arena': 70, Otherworld: 73, 'Timeline Battle': 69 }, buffs: [buff('Basic Damage Dealt to Villains', 45, 'all', 'Tier-2 Passive'), buff('Basic Damage Dealt to Heroes', 45, 'all', 'Tier-2 Passive')], rotations: { pve: 'support slot' }, buildNotes: ['PVE 범용 서포터', 'Insight 권장'], sourceHint: 'supports'
  },
  {
    id: 'nick-fury', name: 'Nick Fury', slug: 'nickfury', portraitUrl: p('nickfury'), type: 'Speed', alignment: 'Hero', gender: 'Male', species: 'Human', roles: ['leader', 'support'], tier: 'T3', instinct: 'Order', acquisition: 'Premium',
    tags: ['speed', 'hero', 'male', 'human', 'leadership', 'support', 'hero-support', 'pve'], uniforms: [u('nick-fury-secret-invasion', 'Secret Invasion', '영웅 리더/서포트 강화', ['leadership'], 4, 1)], artifact: artifact('Director’s Order', '영웅 팀 공격/피해량 보정', 4, 1), ctpRecommendations: ['Insight'], procFriendly: 'Manual',
    scores: { ABX: 81, ABL: 84, 'World Boss': 91, 'Infinity Challenge': 89, 'Team Battle Arena': 70, Otherworld: 76, 'Timeline Battle': 66 }, buffs: [buff('All Basic Attacks', 50, 'heroes', 'Leadership'), buff('Basic Damage Dealt to Villains', 55, 'heroes', 'Tier-2 Passive')], rotations: { pve: 'leader/support slot' }, buildNotes: ['영웅 딜러 조합에서 고효율', 'White Fox 조건 안 맞을 때 대체'], sourceHint: 'supports'
  },
  {
    id: 'ghost-panther', name: 'Ghost Panther', slug: 'ghostpanther', portraitUrl: p('ghostpanther'), type: 'Universal', alignment: 'Hero', gender: 'Male', species: 'Demon', roles: ['support'], tier: 'T3', instinct: 'Justice', acquisition: 'Premium',
    tags: ['universal', 'hero', 'male', 'fire', 'support', 'pve', 'elemental'], uniforms: [u('ghost-panther-modern', 'Modern', '화염 피해/빌런 피해 보조', ['fire', 'support'], 3, 0)], artifact: artifact('Hellfire Spirit', '화염 피해량 보조', 4, 2), ctpRecommendations: ['Insight'], procFriendly: 'Manual',
    scores: { ABX: 80, ABL: 82, 'World Boss': 89, 'Infinity Challenge': 87, 'Team Battle Arena': 64, Otherworld: 69, 'Timeline Battle': 58 }, buffs: [buff('Elemental Damage', 50, 'elemental', 'Tier-2 Passive'), buff('Basic Damage Dealt to Villains', 45, 'all', 'Tier-2 Passive')], rotations: { pve: 'support slot' }, buildNotes: ['Mephisto 등 화염 딜러와 매칭'], sourceHint: 'supports'
  },
  {
    id: 'hulk-red', name: 'Hulk (Red)', slug: 'redhulk', portraitUrl: p('redhulk'), type: 'Combat', alignment: 'Villain', gender: 'Male', species: 'Human', roles: ['dealer', 'leader'], tier: 'T4', instinct: 'Destruction', acquisition: 'Free',
    tags: ['combat', 'villain', 'male', 'gamma', 'abx', 'pve', 'leadership'], uniforms: [u('red-hulk-thunderbolts', 'Thunderbolts', '컴뱃 ABX 고점 후보', ['combat', 'villain'], 5, 2)], artifact: artifact('Gamma Authority', 'HP 기반 딜/생존 보정', 4, 3), ctpRecommendations: ['Rage', 'Mighty Destruction', 'Energy'], procFriendly: 'Flexible',
    scores: { ABX: 94, ABL: 83, 'World Boss': 90, 'Infinity Challenge': 84, 'Team Battle Arena': 78, Otherworld: 83, 'Timeline Battle': 80 }, buffs: [buff('All Basic Attacks', 25, 'all', 'Leadership')], rotations: { pve: '3c5c4 6c5c4' }, buildNotes: ['ABX 컴뱃 대체/상위 후보', 'Rage와 Proc 둘 다 비교'], sourceHint: 'tierlist'
  },
  {
    id: 'loki', name: 'Loki', slug: 'loki', portraitUrl: p('loki'), type: 'Universal', alignment: 'Villain', gender: 'Male', species: 'Alien', roles: ['dealer'], tier: 'T4', instinct: 'Cruelty', acquisition: 'Free',
    tags: ['universal', 'villain', 'male', 'alien', 'abx', 'pve', 'mind'], uniforms: [u('loki-season2', 'Marvel Studios Loki Season 2', '유니버셜 빌런 PVE 딜러', ['villain'], 4, 1)], artifact: artifact('God of Mischief', '분신/스킬 피해량 보정', 4, 2), ctpRecommendations: ['Rage', 'Energy', 'Mighty Destruction'], procFriendly: 'Rage',
    scores: { ABX: 90, ABL: 84, 'World Boss': 89, 'Infinity Challenge': 87, 'Team Battle Arena': 72, Otherworld: 84, 'Timeline Battle': 79 }, buffs: [], rotations: { pve: '5dc3c4 6dc5c4' }, buildNotes: ['범용 PVE 딜러', 'Rage 안정'], sourceHint: 'tierlist'
  },
  {
    id: 'jean-grey', name: 'Jean Grey', slug: 'jeangrey', portraitUrl: p('jeangrey'), type: 'Universal', alignment: 'Hero', gender: 'Female', species: 'Mutant', roles: ['dealer', 'pvp-anchor'], tier: 'Native T3', nativeTier: 'Native T3', instinct: 'Justice', acquisition: 'Native',
    tags: ['universal', 'hero', 'female', 'mutant', 'phoenix', 'pvp', 'revive'], uniforms: [u('jean-grey-dark-phoenix', 'Dark Phoenix', 'PVP 앵커/부활/화상', ['pvp'], 2, 5)], artifact: artifact('Phoenix Force', '부활/피해량/PVP 생존 보정', 3, 5), ctpRecommendations: ['Mighty Greed', 'Authority', 'Brilliant Refinement'], procFriendly: 'PVP',
    scores: { ABX: 88, ABL: 86, 'World Boss': 92, 'Infinity Challenge': 90, 'Team Battle Arena': 96, Otherworld: 96, 'Timeline Battle': 97 }, buffs: [], rotations: { pvp: 'auto/manual hybrid', note: 'PVP 세팅은 HP/슈퍼아머/감면 우선' }, buildNotes: ['PVP 우선 빌드', 'PVE용 CTP와 충돌 주의'], sourceHint: 'tierlist'
  },
  {
    id: 'wolverine', name: 'Wolverine', slug: 'wolverine', portraitUrl: p('wolverine'), type: 'Combat', alignment: 'Hero', gender: 'Male', species: 'Mutant', roles: ['dealer', 'pvp-anchor'], tier: 'T4', instinct: 'Destruction', acquisition: 'Free',
    tags: ['combat', 'hero', 'male', 'mutant', 'pvp', 'heal', 'bleed'], uniforms: [u('wolverine-weapon-x', 'Weapon X', 'PVP/생존 특화', ['pvp'], 1, 5)], artifact: artifact('Best There Is', '회복/피해 감소/PVP 생존', 2, 5), ctpRecommendations: ['Mighty Greed', 'Authority', 'Regeneration'], procFriendly: 'PVP',
    scores: { ABX: 82, ABL: 78, 'World Boss': 84, 'Infinity Challenge': 84, 'Team Battle Arena': 94, Otherworld: 93, 'Timeline Battle': 95 }, buffs: [], rotations: { pvp: 'auto-friendly' }, buildNotes: ['PVP 세팅 우선', '아티팩트 별이 중요'], sourceHint: 'tierlist'
  },
  {
    id: 'spider-man', name: 'Spider-Man', slug: 'spiderman', portraitUrl: p('spiderman'), type: 'Speed', alignment: 'Hero', gender: 'Male', species: 'Human', roles: ['dealer', 'pvp-anchor'], tier: 'T4', instinct: 'Justice', acquisition: 'Free',
    tags: ['speed', 'hero', 'male', 'human', 'pvp', 'web', 'leadership'], uniforms: [u('spider-man-no-way-home', 'No Way Home', 'PVP 회피/웹 컨트롤', ['pvp'], 1, 4)], artifact: artifact('Friendly Neighborhood', '회피/생존 보정', 2, 4), ctpRecommendations: ['Mighty Destruction', 'Authority', 'Greed'], procFriendly: 'Flexible',
    scores: { ABX: 80, ABL: 78, 'World Boss': 84, 'Infinity Challenge': 83, 'Team Battle Arena': 90, Otherworld: 88, 'Timeline Battle': 91 }, buffs: [], rotations: { pvp: 'manual burst' }, buildNotes: ['PVP 하이브리드', '초보 계정 접근성 좋음'], sourceHint: 'tierlist'
  },
  {
    id: 'thanos', name: 'Thanos', slug: 'thanos', portraitUrl: p('thanos'), type: 'Universal', alignment: 'Villain', gender: 'Male', species: 'Alien', roles: ['dealer', 'pvp-anchor'], tier: 'Native T3', nativeTier: 'Native T3', instinct: 'Destruction', acquisition: 'Native',
    tags: ['universal', 'villain', 'male', 'alien', 'pvp', 'boss', 'tank'], uniforms: [u('thanos-farmer', 'Wise Harvester', 'PVP 탱커/딜러', ['pvp'], 1, 5)], artifact: artifact('Mad Titan', 'HP/피해 감소/PVP 보정', 3, 5), ctpRecommendations: ['Authority', 'Regeneration', 'Greed'], procFriendly: 'PVP',
    scores: { ABX: 82, ABL: 80, 'World Boss': 88, 'Infinity Challenge': 85, 'Team Battle Arena': 95, Otherworld: 94, 'Timeline Battle': 96 }, buffs: [], rotations: { pvp: 'auto-friendly' }, buildNotes: ['PVP 리소스 많이 먹음', '권능/재생 계열 추천'], sourceHint: 'tierlist'
  },
  {
    id: 'scarlet-witch', name: 'Scarlet Witch', slug: 'scarletwitch', portraitUrl: p('scarletwitch'), type: 'Universal', alignment: 'Hero', gender: 'Female', species: 'Mutant', roles: ['dealer'], tier: 'Native T2', nativeTier: 'Native T2', instinct: 'Destruction', acquisition: 'Native',
    tags: ['universal', 'hero', 'female', 'mutant', 'mind', 'pve', 'abx'], uniforms: [u('scarlet-witch-mom', 'Multiverse of Madness', '마인드 딜러', ['mind'], 3, 1)], artifact: artifact('Chaos Magic', '마인드 피해량/스킬 피해량 보정', 4, 2), ctpRecommendations: ['Judgement', 'Rage'], procFriendly: 'Rage',
    scores: { ABX: 88, ABL: 89, 'World Boss': 91, 'Infinity Challenge': 90, 'Team Battle Arena': 76, Otherworld: 80, 'Timeline Battle': 74 }, buffs: [], rotations: { pve: '5dc4dc3 6dc5dc4' }, buildNotes: ['Judgement 있으면 마인드 딜 고점', '최신 유니폼 여부 확인'], sourceHint: 'tierlist'
  },
  {
    id: 'doctor-strange', name: 'Doctor Strange', slug: 'doctorstrange', portraitUrl: p('doctorstrange'), type: 'Blast', alignment: 'Hero', gender: 'Male', species: 'Human', roles: ['dealer', 'leader'], tier: 'T4', instinct: 'Order', acquisition: 'Epic Quest',
    tags: ['blast', 'hero', 'male', 'human', 'magic', 'pve', 'leadership'], uniforms: [u('strange-mom', 'Multiverse of Madness', '마법 딜러/리더', ['magic'], 4, 1)], artifact: artifact('Sorcerer Supreme', '마법 딜/스킬 피해량 보정', 4, 2), ctpRecommendations: ['Rage', 'Mighty Energy'], procFriendly: 'Rage',
    scores: { ABX: 87, ABL: 90, 'World Boss': 95, 'Infinity Challenge': 93, 'Team Battle Arena': 78, Otherworld: 80, 'Timeline Battle': 76 }, buffs: [buff('All Basic Attacks', 30, 'all', 'Leadership')], rotations: { pve: '5dc4dc3 6dc5dc4' }, buildNotes: ['월드보스/챌린지 안정', 'Rage 추천'], sourceHint: 'tierlist'
  },
  {
    id: 'iron-man', name: 'Iron Man', slug: 'ironman', portraitUrl: p('ironman'), type: 'Blast', alignment: 'Hero', gender: 'Male', species: 'Human', roles: ['dealer'], tier: 'T4', instinct: 'Order', acquisition: 'Free',
    tags: ['blast', 'hero', 'male', 'human', 'machine', 'pve', 'leadership'], uniforms: [u('iron-man-back-to-basics', 'Back to Basics', 'Proc 친화 PVE 딜러', ['machine'], 4, 1)], artifact: artifact('Arc Reactor', '에너지 공격/기계 딜 보정', 3, 1), ctpRecommendations: ['Energy', 'Mighty Destruction', 'Rage'], procFriendly: 'Proc',
    scores: { ABX: 87, ABL: 90, 'World Boss': 92, 'Infinity Challenge': 90, 'Team Battle Arena': 70, Otherworld: 72, 'Timeline Battle': 68 }, buffs: [], rotations: { pve: '3c5c4 6c3c5c4' }, buildNotes: ['Energy/Destruction 효율 좋음', 'Proc 타이밍 연습 필요'], sourceHint: 'tierlist'
  },
  {
    id: 'sharon-rogers', name: 'Sharon Rogers', slug: 'sharonrogers', portraitUrl: p('sharonrogers'), type: 'Blast', alignment: 'Hero', gender: 'Female', species: 'Human', roles: ['dealer'], tier: 'T4', instinct: 'Justice', acquisition: 'Free',
    tags: ['blast', 'hero', 'female', 'human', 'pve', 'energy', 'proc'], uniforms: [u('sharon-rogers-poseidon', 'Poseidon Armor', 'Proc 기반 폭딜', ['proc'], 5, 0)], artifact: artifact('Star Light Sword', '스킬 피해량/누적 피해 보정', 4, 1), ctpRecommendations: ['Energy', 'Mighty Destruction'], procFriendly: 'Proc',
    scores: { ABX: 89, ABL: 92, 'World Boss': 94, 'Infinity Challenge': 94, 'Team Battle Arena': 65, Otherworld: 68, 'Timeline Battle': 64 }, buffs: [], rotations: { pve: '3c5c4 6c5c4', note: '누적 피해 타이밍 중요' }, buildNotes: ['초중반 PVE 효율 매우 높음', 'Proc 세팅 추천'], sourceHint: 'tierlist'
  },
  {
    id: 'captain-america', name: 'Captain America', slug: 'captainamerica', portraitUrl: p('captainamerica'), type: 'Combat', alignment: 'Hero', gender: 'Male', species: 'Human', roles: ['dealer', 'leader'], tier: 'T4', instinct: 'Justice', acquisition: 'Free',
    tags: ['combat', 'hero', 'male', 'human', 'leadership', 'pve', 'pvp'], uniforms: [u('captain-america-back-to-basics', 'Back to Basics', '컴뱃 영웅 딜러', ['leadership'], 3, 2)], artifact: artifact('Sentinel of Liberty', '리더십/생존 보정', 3, 2), ctpRecommendations: ['Rage', 'Energy', 'Mighty Destruction'], procFriendly: 'Flexible',
    scores: { ABX: 88, ABL: 82, 'World Boss': 88, 'Infinity Challenge': 87, 'Team Battle Arena': 78, Otherworld: 80, 'Timeline Battle': 76 }, buffs: [buff('All Basic Attacks', 30, 'heroes', 'Leadership')], rotations: { pve: '3c5c4 6c5c4' }, buildNotes: ['리더십 태그라 White Fox와 궁합', 'PVE/PVP 혼합 빌드 가능'], sourceHint: 'tierlist'
  },
  {
    id: 'thor', name: 'Thor', slug: 'thor', portraitUrl: p('thor'), type: 'Universal', alignment: 'Hero', gender: 'Male', species: 'Asgardian', roles: ['dealer'], tier: 'T4', instinct: 'Justice', acquisition: 'Free',
    tags: ['universal', 'hero', 'male', 'alien', 'lightning', 'elemental', 'pve'], uniforms: [u('thor-love-thunder', 'Love and Thunder', '번개 광역 딜러', ['lightning'], 4, 1)], artifact: artifact('God of Thunder', '번개 피해량/광역 피해 보정', 4, 1), ctpRecommendations: ['Rage', 'Judgement'], procFriendly: 'Rage',
    scores: { ABX: 86, ABL: 88, 'World Boss': 91, 'Infinity Challenge': 91, 'Team Battle Arena': 73, Otherworld: 78, 'Timeline Battle': 70 }, buffs: [], rotations: { pve: '5dc3c4 6dc5c4' }, buildNotes: ['파밍/광역 콘텐츠 좋음', 'Judgement/Rage 선택'], sourceHint: 'tierlist'
  },
  {
    id: 'green-goblin', name: 'Green Goblin', slug: 'greengoblin', portraitUrl: p('greengoblin'), type: 'Speed', alignment: 'Villain', gender: 'Male', species: 'Human', roles: ['leader', 'support', 'dealer'], tier: 'T3', instinct: 'Cruelty', acquisition: 'Free',
    tags: ['speed', 'villain', 'male', 'human', 'leadership', 'support', 'pve', 'poison'], uniforms: [u('green-goblin-nwh', 'No Way Home', '빌런 리더/서포터', ['villain', 'support'], 3, 1)], artifact: artifact('Goblin Formula', '빌런 팀 공격/피해 보정', 3, 2), ctpRecommendations: ['Insight', 'Rage'], procFriendly: 'Flexible',
    scores: { ABX: 86, ABL: 80, 'World Boss': 89, 'Infinity Challenge': 88, 'Team Battle Arena': 72, Otherworld: 82, 'Timeline Battle': 74 }, buffs: [buff('All Basic Attacks', 40, 'villains', 'Leadership'), buff('Basic Damage Dealt to Heroes', 35, 'villains', 'Tier-2 Passive')], rotations: { pve: 'leader/support slot' }, buildNotes: ['빌런 팀 리더로 편함', 'Black Cat과 조합 가능'], sourceHint: 'supports'
  },
  {
    id: 'mystique', name: 'Mystique', slug: 'mystique', portraitUrl: p('mystique'), type: 'Speed', alignment: 'Villain', gender: 'Female', species: 'Mutant', roles: ['support', 'dealer'], tier: 'Awakened', instinct: 'Cruelty', acquisition: 'Crystalwall',
    tags: ['speed', 'villain', 'female', 'mutant', 'support', 'pve'], uniforms: [u('mystique-modern', 'Modern', '범용 피해량 보조', ['support'], 3, 1)], artifact: artifact('Shapeshifter', '피해량/회피 보정', 3, 2), ctpRecommendations: ['Insight'], procFriendly: 'Manual',
    scores: { ABX: 79, ABL: 81, 'World Boss': 87, 'Infinity Challenge': 84, 'Team Battle Arena': 66, Otherworld: 72, 'Timeline Battle': 65 }, buffs: [buff('Basic Damage Dealt to Villains', 45, 'all', 'Tier-2 Passive'), buff('Basic Damage Dealt to Heroes', 45, 'all', 'Tier-2 Passive')], rotations: { pve: 'support slot' }, buildNotes: ['오래된 범용 서포터', '보유 시 대체 슬롯'], sourceHint: 'supports'
  },
  {
    id: 'dormammu', name: 'Dormammu', slug: 'dormammu', portraitUrl: p('dormammu'), type: 'Universal', alignment: 'Villain', gender: 'Male', species: 'Demon', roles: ['dealer', 'pvp-anchor'], tier: 'Native T3', nativeTier: 'Native T3', instinct: 'Cruelty', acquisition: 'Native',
    tags: ['universal', 'villain', 'male', 'demon', 'fire', 'pvp', 'boss'], uniforms: [u('dormammu-modern', 'Modern', '아더월드/PVP 위협', ['pvp', 'fire'], 1, 4)], artifact: artifact('Dark Dimension', 'PVP 생존/화염 피해 보정', 3, 4), ctpRecommendations: ['Authority', 'Greed', 'Rage'], procFriendly: 'PVP',
    scores: { ABX: 83, ABL: 82, 'World Boss': 88, 'Infinity Challenge': 84, 'Team Battle Arena': 90, Otherworld: 95, 'Timeline Battle': 90 }, buffs: [], rotations: { pvp: 'auto-friendly' }, buildNotes: ['아더월드 상위권 후보', 'PVP 세팅 우선'], sourceHint: 'tierlist'
  },
  {
    id: 'knull', name: 'Knull', slug: 'knull', portraitUrl: p('knull'), type: 'Universal', alignment: 'Villain', gender: 'Male', species: 'Symbiote', roles: ['dealer'], tier: 'Native T3', nativeTier: 'Native T3', instinct: 'Destruction', acquisition: 'Native',
    tags: ['universal', 'villain', 'male', 'symbiote', 'pve', 'boss'], uniforms: [u('knull-modern', 'Modern', '보스 딜러/유니버셜 빌런', ['symbiote'], 3, 2)], artifact: artifact('King in Black', '심비오트 피해량/생존 보정', 4, 3), ctpRecommendations: ['Energy', 'Rage', 'Mighty Destruction'], procFriendly: 'Proc',
    scores: { ABX: 86, ABL: 84, 'World Boss': 92, 'Infinity Challenge': 89, 'Team Battle Arena': 82, Otherworld: 87, 'Timeline Battle': 80 }, buffs: [], rotations: { pve: '4dc5c2 6dc5c4' }, buildNotes: ['World Boss 테마 딜러', 'Proc 세팅 실험'], sourceHint: 'tierlist'
  },
  {
    id: 'kang', name: 'Kang', slug: 'kang', portraitUrl: p('kang'), type: 'Universal', alignment: 'Villain', gender: 'Male', species: 'Human', roles: ['dealer', 'pvp-anchor'], tier: 'Native T3', nativeTier: 'Native T3', instinct: 'Order', acquisition: 'Native',
    tags: ['universal', 'villain', 'male', 'human', 'pvp', 'time'], uniforms: [u('kang-quantumania', 'Quantumania', 'PVP/아더월드 컨트롤', ['pvp'], 1, 4)], artifact: artifact('Conqueror’s Timeline', '시간 정지/피해량 보정', 2, 4), ctpRecommendations: ['Authority', 'Greed'], procFriendly: 'PVP',
    scores: { ABX: 78, ABL: 76, 'World Boss': 85, 'Infinity Challenge': 83, 'Team Battle Arena': 88, Otherworld: 90, 'Timeline Battle': 88 }, buffs: [], rotations: { pvp: 'manual/auto hybrid' }, buildNotes: ['PVP 특화', '최신 메타 변동 체크'], sourceHint: 'tierlist'
  }
];

export const userRoster: UserCharacter[] = [
  { characterId: 'mephisto', owned: true, favorite: true, level: 80, tier: 'T4', uniformOwned: true, uniformId: 'mephisto-modern', uniformRank: 'Mythic', artifactStars: 6, ctp: 'Rage', buildQuality: 98, skillCooldown: 50, ignoreDefense: 50, criticalDamage: 198 },
  { characterId: 'luna-snow', owned: true, favorite: true, level: 80, tier: 'T4', uniformOwned: true, uniformId: 'luna-snow-lifestyle', uniformRank: 'Mythic', artifactStars: 6, ctp: 'Judgement', buildQuality: 96, skillCooldown: 50, ignoreDefense: 50, criticalDamage: 195 },
  { characterId: 'storm', owned: true, level: 80, tier: 'T4', uniformOwned: true, uniformId: 'storm-xmen-red', uniformRank: 'Mythic', artifactStars: 5, ctp: 'Judgement', buildQuality: 95, skillCooldown: 49, ignoreDefense: 50, criticalDamage: 190 },
  { characterId: 'cyclops', owned: true, level: 80, tier: 'T3', uniformOwned: true, uniformId: 'cyclops-phoenix-five', uniformRank: 'Legendary', artifactStars: 4, ctp: 'Insight', buildQuality: 91, skillCooldown: 50, ignoreDefense: 50, criticalDamage: 170 },
  { characterId: 'white-fox', owned: true, level: 70, tier: 'T3', uniformOwned: true, uniformId: 'white-fox-lifestyle-2', uniformRank: 'Mythic', artifactStars: 4, ctp: 'Insight', buildQuality: 92, skillCooldown: 50, ignoreDefense: 50, criticalDamage: 160 },
  { characterId: 'valkyrie', owned: true, level: 80, tier: 'T3', uniformOwned: true, uniformId: 'valkyrie-love-thunder', uniformRank: 'Mythic', artifactStars: 5, ctp: 'Insight', buildQuality: 91, skillCooldown: 48, ignoreDefense: 50, criticalDamage: 175 },
  { characterId: 'black-cat', owned: true, level: 70, tier: 'T3', uniformOwned: true, uniformId: 'black-cat-lifestyle', uniformRank: 'Mythic', artifactStars: 4, ctp: 'Insight', buildQuality: 88, skillCooldown: 50, ignoreDefense: 50, criticalDamage: 155 },
  { characterId: 'phil-coulson', owned: true, level: 70, tier: 'T3', uniformOwned: true, uniformId: 'coulson-modern', uniformRank: 'Heroic', artifactStars: 3, ctp: 'Insight', buildQuality: 86, skillCooldown: 45, ignoreDefense: 50, criticalDamage: 145 },
  { characterId: 'shuri', owned: true, level: 80, tier: 'T3', uniformOwned: true, uniformId: 'shuri-wakanda-forever', uniformRank: 'Legendary', artifactStars: 4, ctp: 'Insight', buildQuality: 89, skillCooldown: 50, ignoreDefense: 49, criticalDamage: 165 },
  { characterId: 'nick-fury', owned: true, level: 70, tier: 'T3', uniformOwned: true, uniformId: 'nick-fury-secret-invasion', uniformRank: 'Legendary', artifactStars: 4, ctp: 'Insight', buildQuality: 90, skillCooldown: 50, ignoreDefense: 50, criticalDamage: 160 },
  { characterId: 'ghost-panther', owned: true, level: 70, tier: 'T3', uniformOwned: false, uniformRank: 'None', artifactStars: 3, ctp: 'Insight', buildQuality: 82, skillCooldown: 45, ignoreDefense: 48, criticalDamage: 150 },
  { characterId: 'hulk-red', owned: true, level: 80, tier: 'T4', uniformOwned: true, uniformId: 'red-hulk-thunderbolts', uniformRank: 'Legendary', artifactStars: 4, ctp: 'Rage', buildQuality: 93, skillCooldown: 50, ignoreDefense: 50, criticalDamage: 185 },
  { characterId: 'loki', owned: true, level: 80, tier: 'T4', uniformOwned: true, uniformId: 'loki-season2', uniformRank: 'Mythic', artifactStars: 4, ctp: 'Rage', buildQuality: 90, skillCooldown: 50, ignoreDefense: 50, criticalDamage: 180 },
  { characterId: 'jean-grey', owned: true, level: 80, tier: 'T4', uniformOwned: true, uniformId: 'jean-grey-dark-phoenix', uniformRank: 'Mythic', artifactStars: 6, ctp: 'Mighty Greed', buildQuality: 97, skillCooldown: 50, ignoreDefense: 50, criticalDamage: 190 },
  { characterId: 'wolverine', owned: true, level: 80, tier: 'T4', uniformOwned: true, uniformId: 'wolverine-weapon-x', uniformRank: 'Mythic', artifactStars: 6, ctp: 'Authority', buildQuality: 96, skillCooldown: 49, ignoreDefense: 50, criticalDamage: 180 },
  { characterId: 'spider-man', owned: true, level: 80, tier: 'T4', uniformOwned: true, uniformId: 'spider-man-no-way-home', uniformRank: 'Legendary', artifactStars: 5, ctp: 'Mighty Destruction', buildQuality: 88, skillCooldown: 50, ignoreDefense: 50, criticalDamage: 180 },
  { characterId: 'thanos', owned: true, level: 80, tier: 'T4', uniformOwned: true, uniformId: 'thanos-farmer', uniformRank: 'Mythic', artifactStars: 6, ctp: 'Authority', buildQuality: 96, skillCooldown: 50, ignoreDefense: 50, criticalDamage: 190 },
  { characterId: 'scarlet-witch', owned: true, level: 80, tier: 'T4', uniformOwned: true, uniformId: 'scarlet-witch-mom', uniformRank: 'Legendary', artifactStars: 5, ctp: 'Judgement', buildQuality: 89, skillCooldown: 49, ignoreDefense: 50, criticalDamage: 185 },
  { characterId: 'doctor-strange', owned: true, level: 80, tier: 'T4', uniformOwned: true, uniformId: 'strange-mom', uniformRank: 'Mythic', artifactStars: 5, ctp: 'Rage', buildQuality: 94, skillCooldown: 50, ignoreDefense: 50, criticalDamage: 190 },
  { characterId: 'iron-man', owned: true, level: 80, tier: 'T4', uniformOwned: true, uniformId: 'iron-man-back-to-basics', uniformRank: 'Mythic', artifactStars: 4, ctp: 'Energy', buildQuality: 92, skillCooldown: 50, ignoreDefense: 50, criticalDamage: 185 },
  { characterId: 'sharon-rogers', owned: true, level: 80, tier: 'T4', uniformOwned: true, uniformId: 'sharon-rogers-poseidon', uniformRank: 'Mythic', artifactStars: 5, ctp: 'Energy', buildQuality: 95, skillCooldown: 50, ignoreDefense: 50, criticalDamage: 195 },
  { characterId: 'captain-america', owned: true, level: 80, tier: 'T4', uniformOwned: true, uniformId: 'captain-america-back-to-basics', uniformRank: 'Legendary', artifactStars: 4, ctp: 'Rage', buildQuality: 87, skillCooldown: 49, ignoreDefense: 50, criticalDamage: 175 },
  { characterId: 'thor', owned: true, level: 80, tier: 'T4', uniformOwned: true, uniformId: 'thor-love-thunder', uniformRank: 'Legendary', artifactStars: 4, ctp: 'Judgement', buildQuality: 88, skillCooldown: 50, ignoreDefense: 50, criticalDamage: 180 },
  { characterId: 'green-goblin', owned: true, level: 70, tier: 'T3', uniformOwned: true, uniformId: 'green-goblin-nwh', uniformRank: 'Legendary', artifactStars: 3, ctp: 'Insight', buildQuality: 84, skillCooldown: 47, ignoreDefense: 50, criticalDamage: 160 },
  { characterId: 'mystique', owned: false, level: 70, tier: 'Awakened', uniformOwned: false, uniformRank: 'None', artifactStars: 0, buildQuality: 68, skillCooldown: 40, ignoreDefense: 45, criticalDamage: 140 },
  { characterId: 'dormammu', owned: false, level: 70, tier: 'T3', uniformOwned: false, uniformRank: 'None', artifactStars: 0, buildQuality: 70, skillCooldown: 40, ignoreDefense: 45, criticalDamage: 140 },
  { characterId: 'knull', owned: true, level: 80, tier: 'T4', uniformOwned: true, uniformId: 'knull-modern', uniformRank: 'Legendary', artifactStars: 4, ctp: 'Energy', buildQuality: 87, skillCooldown: 49, ignoreDefense: 50, criticalDamage: 180 },
  { characterId: 'kang', owned: false, level: 70, tier: 'T3', uniformOwned: false, uniformRank: 'None', artifactStars: 0, buildQuality: 65, skillCooldown: 40, ignoreDefense: 45, criticalDamage: 130 }
];

export const optimizerPresets = [
  { name: 'ABX 컴뱃 빌런', content: 'ABX', type: 'Combat', alignment: 'Villain', gender: 'Any', tags: ['combat', 'villain'] },
  { name: 'ABL 블래스트 여성', content: 'ABL', type: 'Blast', alignment: 'Any', gender: 'Female', tags: ['blast', 'female'] },
  { name: 'IC 일요일 범용', content: 'Infinity Challenge', type: 'Any', alignment: 'Any', gender: 'Any', tags: ['pve', 'boss'] },
  { name: 'IC 유니버셜 영웅', content: 'Infinity Challenge', type: 'Universal', alignment: 'Hero', gender: 'Any', tags: ['universal', 'hero', 'pve'] },
  { name: 'WBL 범용 보스', content: 'World Boss', type: 'Any', alignment: 'Any', gender: 'Any', tags: ['pve', 'boss'] },
  { name: '리더십 딜러 + White Fox', content: 'ABL', type: 'Any', alignment: 'Hero', gender: 'Any', tags: ['leadership'] },
  { name: 'PVE 범용 보스 딜', content: 'World Boss', type: 'Any', alignment: 'Any', gender: 'Any', tags: ['pve'] }
] as const;

export const modeColumns = [
  { key: 'PVE Overall', label: 'PVE 종합' },
  { key: 'Infinity Challenge', label: '인피니티 챌린지' },
  { key: 'ABX', label: 'ABX' },
  { key: 'ABL', label: 'ABL' },
  { key: 'Team Battle Arena', label: '팀 배틀 아레나' },
  { key: 'Otherworld', label: '아더월드' },
  { key: 'Timeline Battle', label: '타임라인' }
] as const;

export const pvpModeRules = [
  {
    content: 'Timeline Battle',
    formation: '3인 1덱',
    teamCount: 1,
    membersPerTeam: 3,
    leaguePolicy: '주간 추천 캐릭터는 추가 점수, 주간 제한 캐릭터는 해당 주 사용 불가',
    restrictionSummary: '매주 제한 목록이 바뀌므로 직접 입력한 제한 캐릭터만 덱 충돌 검사에 반영',
    sourceUrl: 'https://www.marvel.com/articles/games/marvel-future-fight-new-blood',
    restrictionCharacters: [],
  },
  {
    content: 'Otherworld',
    formation: '5인 1덱',
    teamCount: 1,
    membersPerTeam: 5,
    leaguePolicy: '플래티넘까지 제한 없음 · 비브라늄 이상부터 주간 디버프 캐릭터 적용',
    restrictionSummary: '비브라늄+ 디버프 캐릭터는 직접 입력한 제한 목록을 기준으로 덱 충돌 검사',
    sourceUrl: 'https://thanosvibs.money/patchnotes/9.1',
    restrictionCharacters: [],
  },
  {
    content: 'Team Battle Arena',
    formation: '3인 x 5팀',
    teamCount: 5,
    membersPerTeam: 3,
    leaguePolicy: '15명 편성 · 중복 사용 금지 · 강력한 Native Tier 캐릭터 몰빵 금지 · 상위 리그 시즌 제한 적용',
    restrictionSummary: '시즌 조건 제한은 직접 입력한 제한 목록을 기준으로 덱 충돌 검사',
    sourceUrl: 'https://thanosvibs.money/dailybuggle/script_dev_anniversary10',
    restrictionCharacters: [],
  },
] as const satisfies ReadonlyArray<{
  content: PvpScoreContent;
  formation: string;
  teamCount: number;
  membersPerTeam: number;
  leaguePolicy: string;
  restrictionSummary: string;
  sourceUrl: string;
  restrictionCharacters: readonly { id: string; name: string; kind: string; note: string }[];
}>;

export const pvpDecks = [
  {
    content: 'Otherworld',
    label: '아더월드 덱',
    teams: [{ label: '5인 자동전투', memberIds: ['jean-grey', 'dormammu', 'thanos', 'wolverine', 'spider-man'] }],
    note: '플래티넘 이하는 그대로 사용, 비브라늄+에서는 5% 디버프 대상만 교체',
    tags: ['revive', 'auto', 'control'],
  },
  {
    content: 'Timeline Battle',
    label: '타임라인 덱',
    teams: [{ label: '3인 공격/방어', memberIds: ['jean-grey', 'thanos', 'wolverine'] }],
    note: '3인 고정. 주간 제한에 걸리면 Spider-Man, Dormammu, Kang 순으로 대체',
    tags: ['defense', 'revive', 'sustain'],
  },
  {
    content: 'Team Battle Arena',
    label: '팀 배틀 아레나 5덱',
    teams: [
      { label: '1팀 앵커', memberIds: ['jean-grey', 'wolverine', 'spider-man'] },
      { label: '2팀 탱커', memberIds: ['thanos', 'captain-america', 'shuri'] },
      { label: '3팀 빌런', memberIds: ['knull', 'green-goblin', 'black-cat'] },
      { label: '4팀 컨트롤', memberIds: ['dormammu', 'hulk-red', 'nick-fury'] },
      { label: '5팀 백업', memberIds: ['kang', 'loki', 'valkyrie'] },
    ],
    note: '3인 덱 5개, 총 15명. 중복 없이 Native Tier 캐릭터를 팀마다 분산',
    tags: ['anchor', 'survive', 'burst'],
  },
] as const satisfies ReadonlyArray<{
  content: PvpScoreContent;
  label: string;
  teams: readonly { label: string; memberIds: readonly string[] }[];
  note: string;
  tags: readonly string[];
}>;

export const usageStats = [
  ['Mephisto', 42], ['Luna Snow', 38], ['Cyclops', 35], ['Storm', 31], ['Black Cat', 28], ['Loki', 27], ['Doctor Strange', 24], ['Scarlet Witch', 22], ['Hulk (Red)', 20], ['Wolverine', 18]
] as const;

export const gearRows = [
  { name: 'C.T.P', value: '분노 / 심판 / 통찰 자동 추천', icon: '⚔️', rating: '★★★★★' },
  { name: '아티팩트', value: '전용 아티팩트 별점 반영', icon: '🏵️', rating: '★★★★★' },
  { name: 'ISO-8', value: '공격형 ISO-8 우선', icon: '🔴', rating: '★★★★★' },
  { name: '우루', value: '공격력 / 쿨감 / 무방 상한 체크', icon: '💎', rating: '★★★★★' },
  { name: '카드', value: `공격 ${accountSpecSummary.cardAttack}% · 피어스 ${accountSpecSummary.cardPierce}%`, icon: '🃏', rating: '★★★★★' },
  { name: 'X-소드', value: `마스터리 ${accountSpecSummary.swordMasteryLevel}/36 · 올공 ${accountSpecSummary.swordMasteryAllAttack}%`, icon: '⚔️', rating: '★★★★☆' },
  { name: '팀업', value: `${accountSpecSummary.activeTeamUpCollections}개 테마 활성 · 대상 영웅별 보너스`, icon: '🤝', rating: '★★★★☆' }
];
