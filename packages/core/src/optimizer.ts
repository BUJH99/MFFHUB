import type { ChallengeRule, Character, ContentType, CustomOptimizerInput, DamageCalculatorInput, PveOptimizerContent, ScoreBreakdown, TeamRecommendation, UserAccount, UserCharacter } from '@mff-data-hub/types';

export type RosterLookup = ReadonlyMap<string, UserCharacter>;
type ModeScoreContent = keyof Character['scores'];

export const createRosterLookup = (roster: UserCharacter[]): RosterLookup => new Map(roster.map((item) => [item.characterId, item]));

function resolveRosterLookup(rosterOrLookup: UserCharacter[] | RosterLookup) {
  return Array.isArray(rosterOrLookup) ? createRosterLookup(rosterOrLookup) : rosterOrLookup;
}

export function getRosterItem(character: Character, rosterOrLookup: UserCharacter[] | RosterLookup) {
  return resolveRosterLookup(rosterOrLookup).get(character.id);
}

export function getCurrentUniform(character: Character, rosterOrLookup: UserCharacter[] | RosterLookup) {
  const item = getRosterItem(character, rosterOrLookup);
  return character.uniforms.find((uniform) => uniform.id === item?.uniformId) ?? character.uniforms[0];
}

export function getTierColor(score: number): TeamRecommendation['grade'] {
  if (score >= 120) return 'SS';
  if (score >= 108) return 'S+';
  if (score >= 98) return 'S';
  if (score >= 88) return 'A+';
  if (score >= 78) return 'A';
  return 'B';
}

function normalizeTag(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-');
}

function conditionScore(character: Character, input: CustomOptimizerInput | ChallengeRule) {
  let score = 0;
  const content = 'content' in input ? input.content : 'ABX';
  const wantedType = 'type' in input ? input.type : input.recommendedType;
  const wantedAlignment = 'alignment' in input ? input.alignment : input.requiredAlignment ?? 'Any';
  const wantedGender = 'gender' in input ? input.gender : input.requiredGender ?? 'Any';
  const requiredTags = 'requiredTags' in input ? input.requiredTags : [];
  const bonusTags = 'bonusTags' in input ? input.bonusTags : input.tags;
  const bannedTags = 'bannedTags' in input ? input.bannedTags : [];

  if (wantedType !== 'Any' && character.type === wantedType) score += 18;
  if (wantedType !== 'Any' && character.type !== wantedType) score -= 14;
  if (wantedAlignment !== 'Any' && character.alignment === wantedAlignment) score += 9;
  if (wantedAlignment !== 'Any' && character.alignment !== wantedAlignment) score -= 10;
  if (wantedGender !== 'Any' && character.gender === wantedGender) score += 9;
  if (wantedGender !== 'Any' && character.gender !== wantedGender) score -= 8;

  for (const tag of requiredTags.map(normalizeTag)) {
    if (character.tags.includes(tag)) score += 12;
    else score -= 6;
  }
  for (const tag of bonusTags.map(normalizeTag)) {
    if (character.tags.includes(tag)) score += 5;
  }
  for (const tag of bannedTags.map(normalizeTag)) {
    if (character.tags.includes(tag)) score -= 100;
  }
  if (character.tags.includes(normalizeTag(content))) score += 6;
  if (content === 'Infinity Challenge' && (character.tags.includes('pve') || character.tags.includes('abx'))) score += 5;
  if (content === 'World Boss' && (character.tags.includes('boss') || character.tags.includes('pve'))) score += 6;
  return score;
}

function accountScore(character: Character, rosterById: RosterLookup, account: UserAccount, input: CustomOptimizerInput) {
  const item = rosterById.get(character.id);
  if (input.accountOnly && !item?.owned) return -999;
  if (!item?.owned) return -35;
  let score = item.buildQuality * 0.32;
  const accountAttack = account.accountAttack ?? account.cardAttack;
  score += Math.min(accountAttack / 10, 18);
  score += Math.min(account.pierce * 0.55, 18);
  score += Math.min((account.teamUpAttackBonusByCharacter?.[character.id] ?? 0) * 0.45, 6);
  if (item.level >= 80) score += 6;
  if (String(item.tier).includes('T4')) score += 7;
  if (item.uniformOwned) score += 6;
  if (item.uniformRank === 'Mythic') score += 5;
  if (item.artifactStars >= 4) score += 3;
  if (item.artifactStars >= 6) score += 3;
  if (item.ctp) score += 5;
  if (input.requireUniform && !item.uniformOwned) score -= 35;
  if (input.preferSafeRotation && character.procFriendly === 'Rage') score += 5;
  if (input.preferSafeRotation && character.procFriendly === 'Proc') score -= 2;
  return score;
}

function gearScore(character: Character, rosterById: RosterLookup, content: PveOptimizerContent) {
  const item = rosterById.get(character.id);
  if (!item?.owned) return -20;
  let score = 0;
  const recommended = character.ctpRecommendations.map(normalizeTag);
  const equippedCtp = normalizeTag(item.ctp ?? '');
  if (item.ctp && recommended.includes(equippedCtp)) score += 8;
  if (content === 'ABL' && ['judgement', 'rage'].includes(equippedCtp)) score += 4;
  if (content === 'ABX' && ['rage', 'energy', 'mighty-destruction'].includes(equippedCtp)) score += 4;
  if (content === 'Infinity Challenge' && ['rage', 'energy', 'mighty-destruction', 'judgement'].includes(equippedCtp)) score += 4;
  if (content === 'World Boss' && ['rage', 'energy', 'mighty-destruction', 'judgement'].includes(equippedCtp)) score += 4;
  score += Math.min(item.artifactStars, 6) * 0.8;
  if (item.skillCooldown < 47) score -= 4;
  if (item.ignoreDefense < 49) score -= 4;
  return score;
}

function effectValue(effectMagnitude: number, stat: string, dealer: Character) {
  let value = effectMagnitude;
  if (stat.includes('Damage Dealt')) value *= 1.15;
  if (stat.includes('Chain Hit')) value *= 1.25;
  if (stat.includes('Ignore Dodge')) value *= 0.7;
  if (stat.includes('Elemental') && dealer.tags.some((tag) => ['fire', 'cold', 'lightning', 'mind'].includes(tag))) value *= 1.15;
  return value;
}

function canBuff(buffAppliesTo: string, dealer: Character) {
  if (buffAppliesTo === 'all') return true;
  if (buffAppliesTo === 'heroes') return dealer.alignment === 'Hero';
  if (buffAppliesTo === 'villains') return dealer.alignment === 'Villain';
  if (buffAppliesTo === 'leadership') return dealer.tags.includes('leadership');
  if (buffAppliesTo === 'elemental') return dealer.tags.some((tag) => ['fire', 'cold', 'lightning', 'mind', 'elemental'].includes(tag));
  if (buffAppliesTo === 'boss') return true;
  return false;
}

function helperScore(helper: Character, dealer: Character, rosterById: RosterLookup, role: 'leader' | 'support') {
  const item = rosterById.get(helper.id);
  if (!item?.owned) return -999;
  if (helper.id === dealer.id) return -999;
  let score = item.buildQuality * 0.12;
  if (role === 'leader' && helper.roles.includes('leader')) score += 18;
  if (role === 'support' && helper.roles.includes('support')) score += 20;
  for (const effect of helper.buffs) {
    if (role === 'leader' && effect.source !== 'Leadership') continue;
    if (role === 'support' && effect.source === 'Leadership') continue;
    if (canBuff(effect.appliesTo, dealer)) score += effectValue(effect.magnitude, effect.stat, dealer) * 0.8;
  }
  if (helper.ctpRecommendations.includes('Insight') && item.ctp === 'Insight') score += 8;
  if (helper.tags.includes('support')) score += 4;
  return score;
}

function buildHints(character: Character, rosterById: RosterLookup) {
  const item = rosterById.get(character.id);
  const hints: string[] = [];
  if (!item?.owned) hints.push('미보유: 계정 필터 OFF일 때만 후보로 표시됨');
  else {
    if (!item.uniformOwned) hints.push('최신/추천 유니폼 미보유');
    if (!item.ctp) hints.push(`C.T.P 추천: ${character.ctpRecommendations.slice(0, 2).join(' / ')}`);
    if (item.artifactStars < 4) hints.push('아티팩트 4★ 이상 권장');
    if (item.skillCooldown < 47) hints.push('스킬 쿨타임 상한 근처까지 보정 필요');
    if (item.ignoreDefense < 49) hints.push('방어 무시 상한 체크 필요');
  }
  return hints;
}

export function optimizeTeams(input: CustomOptimizerInput, characters: Character[], roster: UserCharacter[], account: UserAccount): TeamRecommendation[] {
  const content = input.content;
  const rosterById = createRosterLookup(roster);
  const dealerCandidates = characters.filter((character) => character.roles.includes('dealer') || character.roles.includes('hybrid'));
  const leaderCandidates = characters.filter((character) => character.roles.includes('leader'));
  const supportCandidates = characters.filter((character) => character.roles.includes('support'));
  const dealers = dealerCandidates
    .map((dealer) => {
      const base = dealer.scores[content];
      const condition = conditionScore(dealer, input);
      const accountPart = accountScore(dealer, rosterById, account, input);
      const gear = gearScore(dealer, rosterById, content);
      return { dealer, base, condition, accountPart, gear };
    })
    .filter((row) => row.accountPart > -900)
    .sort((a, b) => b.base + b.condition + b.accountPart + b.gear - (a.base + a.condition + a.accountPart + a.gear));

  return dealers.slice(0, 18).map((row) => {
    const leaders = leaderCandidates
      .map((character) => ({ character, score: helperScore(character, row.dealer, rosterById, 'leader') }))
      .filter((x) => x.score > -900)
      .sort((a, b) => b.score - a.score);
    const bestLeader = leaders[0];
    const leader = bestLeader?.character ?? null;

    const supports = supportCandidates
      .filter((character) => character.id !== leader?.id)
      .map((character) => ({ character, score: helperScore(character, row.dealer, rosterById, 'support') }))
      .filter((x) => x.score > -900)
      .sort((a, b) => b.score - a.score);

    const support1 = supports[0]?.character ?? null;
    const support2 = supports[1]?.character ?? null;
    const leadership = bestLeader ? Math.max(bestLeader.score, 0) * 0.15 : 0;
    const support = supports.slice(0, 2).reduce((sum, item) => sum + Math.max(item.score, 0), 0) * 0.14;
    const penalty = row.dealer.procFriendly === 'Proc' && input.preferSafeRotation ? -4 : 0;
    const total = Math.round((row.base + row.condition + row.accountPart + row.gear + leadership + support + penalty) * 10) / 10;
    const breakdown: ScoreBreakdown = { base: row.base, condition: row.condition, account: row.accountPart, gear: row.gear, leadership, support, penalty, total };
    const reasons = [
      `${input.content} 기본점 ${row.base.toFixed(1)}`,
      `조건 점수 ${row.condition >= 0 ? '+' : ''}${row.condition.toFixed(1)}`,
      leader ? `${leader.name} 리더 효과` : '리더 없음',
      support1 && support2 ? `${support1.name} + ${support2.name} 보조` : '서포터 슬롯 부족',
      row.dealer.procFriendly === 'Rage' ? '운용 안정성 높음' : `${row.dealer.procFriendly} 세팅 권장`
    ];
    const upgradeHints = [...buildHints(row.dealer, rosterById), ...(support1 ? buildHints(support1, rosterById).slice(0, 1) : [])];
    return { dealer: row.dealer, leader, support1, support2, score: total, grade: getTierColor(total), breakdown, reasons, upgradeHints };
  }).sort((a, b) => b.score - a.score);
}

export function getTopCharacters(content: ContentType, characters: Character[], count = 6) {
  if (content === 'PVE Overall') {
    return characters
      .map((character) => ({ character, score: pveOverallScore(character) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  const scoreKey = isModeScoreContent(content) ? content : undefined;
  return characters
    .map((character) => ({ character, score: scoreKey ? character.scores[scoreKey] : 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

function isModeScoreContent(content: ContentType): content is ModeScoreContent {
  return content !== 'PVP' && content !== 'PVE Overall';
}

export function pveOverallScore(character: Character) {
  const scores = character.scores;
  return Math.round(((scores['World Boss'] * 0.34) + (scores['Infinity Challenge'] * 0.26) + (scores.ABL * 0.22) + (scores.ABX * 0.18)) * 10) / 10;
}

export function getModeTop3(characters: Character[]) {
  return {
    pve: [
      { label: 'PVE 종합', rows: getTopCharacters('PVE Overall', characters, 3) },
      { label: '인피니티 챌린지', rows: getTopCharacters('Infinity Challenge', characters, 3) },
      { label: 'ABX', rows: getTopCharacters('ABX', characters, 3) },
      { label: 'ABL', rows: getTopCharacters('ABL', characters, 3) }
    ],
    pvp: [
      { label: '팀 배틀 아레나', rows: getTopCharacters('Team Battle Arena', characters, 3) },
      { label: '아더월드', rows: getTopCharacters('Otherworld', characters, 3) },
      { label: '타임라인', rows: getTopCharacters('Timeline Battle', characters, 3) }
    ]
  };
}

export function calcDamage(input: DamageCalculatorInput) {
  const attackMultiplier = 1 + (input.cardAttack + input.leadershipAttack) / 100;
  const damageMultiplier = 1 + (input.supportDamageVillain + input.supportDamageHero + input.bossDamage + input.chainHit + input.elementalDamage) / 100;
  const pierceMultiplier = 1 + input.pierce / 100;
  const critMultiplier = 1 + Math.max(input.critDamage - 100, 0) / 200;
  const procMultiplier = Math.max(input.procMultiplier, 100) / 100;
  const totalMultiplier = attackMultiplier * damageMultiplier * pierceMultiplier * critMultiplier * procMultiplier;
  const expected = Math.round(input.baseAttack * totalMultiplier);
  return { attackMultiplier, damageMultiplier, pierceMultiplier, critMultiplier, procMultiplier, totalMultiplier, expected };
}

export function rosterCoverage(characters: Character[], roster: UserCharacter[]) {
  let owned = 0;
  let t4 = 0;
  let insight = 0;
  let mythicUniform = 0;

  for (const item of roster) {
    if (item.ctp === 'Insight') insight += 1;
    if (!item.owned) continue;
    owned += 1;
    if (String(item.tier).includes('T4')) t4 += 1;
    if (item.uniformRank === 'Mythic') mythicUniform += 1;
  }

  return { owned, total: characters.length, t4, insight, mythicUniform, coverage: Math.round((owned / characters.length) * 100) };
}
