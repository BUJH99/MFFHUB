const instinctLabels: Record<string, string> = {
  Justice: '정의',
  Cruelty: '잔혹',
  Order: '질서',
  Destruction: '파괴',
};

const plainReplacements: Array<[RegExp, string]> = [
  [/Activation Rate:/gi, '발동 조건:'],
  [/Applies to:/gi, '적용 대상:'],
  [/Cooldown Time\s*(\d+(?:\.\d+)?)\s*seconds?/gi, '재사용 대기시간 $1초'],
  [/Cooldown Time/gi, '재사용 대기시간'],
  [/when HP is below/gi, 'HP가 다음보다 낮을 때'],
  [/when debuffed/gi, '디버프 상태일 때'],
  [/when attacking/gi, '공격 시'],
  [/Allies with Symbiote Ability/gi, '심비오트 능력 아군'],
  [/Gamma Radiation Allies/gi, '감마선 능력 아군'],
  [/SUPER VILLAIN faction/gi, '슈퍼 빌런 진영'],
  [/SUPER HERO faction/gi, '슈퍼 영웅 진영'],
  [/Self/gi, '자신'],
  [/All Basic Attacks/gi, '모든 공격력'],
  [/All Basic Defenses/gi, '모든 방어력'],
  [/All Speeds/gi, '모든 속도'],
  [/Physical Attack/gi, '물리 공격력'],
  [/Energy Attack/gi, '에너지 공격력'],
  [/Skill Damage/gi, '스킬 피해량'],
  [/Bonus Damage/gi, '추가 피해량'],
  [/Chain Hit Damage Received/gi, '받는 체인 히트 피해량'],
  [/Chain Hit Damage/gi, '체인 히트 피해량'],
  [/Basic Damage Dealt to enemies with (\d+(?:\.\d+)?)%\s*HP or below/gi, '생명력이 $1% 이하인 적에게 주는 기본 피해량'],
  [/Basic Damage Dealt to enemies with (\d+(?:\.\d+)?)%\s*HP or higher/gi, '생명력이 $1% 이상인 적에게 주는 기본 피해량'],
  [/Basic Damage Dealt to Boss Types/gi, '보스 타입에게 주는 기본 피해량'],
  [/Basic Damage Dealt to Villains/gi, '빌런에게 주는 기본 피해량'],
  [/Basic Damage Dealt to Heroes/gi, '영웅에게 주는 기본 피해량'],
  [/Basic Damage Dealt to Enemies except Mutant Characters/gi, '뮤턴트 외 적에게 주는 기본 피해량'],
  [/Basic Damage Dealt/gi, '주는 기본 피해량'],
  [/Basic Damage Received from Villains/gi, '빌런에게 받는 기본 피해량'],
  [/Basic Damage Received from Heroes/gi, '영웅에게 받는 기본 피해량'],
  [/Basic Damage Received/gi, '받는 기본 피해량'],
  [/Damage Received/gi, '받는 피해량'],
  [/Reflect Damage/gi, '반사 피해'],
  [/Guaranteed Critical Rate/gi, '확정 치명타율'],
  [/Critical Damage/gi, '치명타 피해율'],
  [/Critical Rate/gi, '치명타율'],
  [/Ignore Dodge/gi, '회피 무시'],
  [/target's Dodge Rate/gi, '대상의 회피율'],
  [/target's 회피율/gi, '대상의 회피율'],
  [/Dodge ALL Attacks/gi, '모든 공격 회피'],
  [/Dodge Rate/gi, '회피율'],
  [/All Debuffs Effect/gi, '모든 디버프 효과'],
  [/Debuff Duration/gi, '디버프 지속시간'],
  [/Remove All Debuffs/gi, '모든 디버프 제거'],
  [/Fear Immunity/gi, '공포 면역'],
  [/Super Armor/gi, '슈퍼 아머'],
  [/All Reflect Damage Received/gi, '받는 모든 반사 피해량'],
  [/Mind Resist/gi, '정신 저항'],
  [/Max HP/gi, '최대 생명력'],
  [/\bHP\b/gi, '생명력'],
  [/bosses/gi, '보스'],
  [/Non-Boss enemy/gi, '일반 적'],
  [/enemies/gi, '적'],
  [/total Instinct/gi, '총 천성'],
  [/Total Instinct/gi, '총 천성'],
  [/Instinct/gi, '천성'],
  [/Up to/gi, '최대'],
  [/sec\./gi, '초'],
  [/\bsec\b/gi, '초'],
  [/seconds?/gi, '초'],
  [/N\/A/gi, '해당 없음'],
];

function stripStarPrefix(effect: string) {
  return effect.replace(/^\d★:\s*/, '').replace(/^•\s*/, '• ');
}

function translateSentencePatterns(effect: string) {
  return effect
    .replace(/Increases ([^,]+?) by ([^,]+?), and an additional ([^,]+?) of total Instinct/gi, '$1 $2 증가, 총 천성의 $3 추가')
    .replace(/Decreases ([^,]+?) by ([^,]+?), and an additional ([^,]+?) of total Instinct/gi, '$1 $2 감소, 총 천성의 $3 추가')
    .replace(/Ignores ([^,]+?) by ([^,]+?), and an additional ([^,]+?) of total Instinct/gi, '$1 $2 무시, 총 천성의 $3 추가')
    .replace(/Recovers HP by ([^,]+?), and an additional ([^,]+?) of total Instinct/gi, '생명력 $1 회복, 총 천성의 $2 추가')
    .replace(/HP does not drop to 1 or below\. Restores HP by ([^,.]+?) of Max HP when the buff ends/gi, '생명력이 1 이하로 떨어지지 않음. 효과 종료 시 최대 생명력의 $1 회복')
    .replace(/Increases ([^,.]+?) by ([^,.]+)/gi, '$1 $2 증가')
    .replace(/Decreases ([^,.]+?) by ([^,.]+)/gi, '$1 $2 감소')
    .replace(/Ignores ([^,.]+?) by ([^,.]+)/gi, '$1 $2 무시')
    .replace(/Recovers HP by ([^,.]+)/gi, '생명력 $1 회복')
    .replace(/Restores HP equal to ([^,.]+?) of Reflect Damage dealt to the target/gi, '대상에게 준 반사 피해의 $1만큼 생명력 회복')
    .replace(/Restores bonus HP equal to \(([^)]+)\)/gi, '추가 생명력 회복: $1')
    .replace(/Can restore up to ([^,.]+?) of Max HP/gi, '최대 생명력의 $1까지 회복 가능');
}

export function getCharacterInstinctLabel(tags: string[]) {
  const instinct = tags.find((tag) => tag.startsWith('Instinct:'))?.slice('Instinct:'.length);
  return instinct ? instinctLabels[instinct] ?? instinct : undefined;
}

export function translateMffEffectText(effect: string) {
  const withoutStar = stripStarPrefix(effect);
  const patterned = translateSentencePatterns(withoutStar);
  const translated = plainReplacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), patterned);

  return translated
    .replace(/주는 기본 피해량 to 슈퍼 빌런 진영/gi, '슈퍼 빌런 진영에게 주는 기본 피해량')
    .replace(/주는 기본 피해량 to 슈퍼 영웅 진영/gi, '슈퍼 영웅 진영에게 주는 기본 피해량')
    .replace(/받는 기본 피해량 from 슈퍼 빌런 진영/gi, '슈퍼 빌런 진영에게 받는 기본 피해량')
    .replace(/받는 기본 피해량 from 슈퍼 영웅 진영/gi, '슈퍼 영웅 진영에게 받는 기본 피해량')
    .replace(/to ALIEN Characters/gi, '외계인 캐릭터에게')
    .replace(/ALIEN Characters/gi, '외계인 캐릭터')
    .replace(/Allies with FLAME Ability/gi, '화염 능력 아군')
    .replace(/when skill \(regular attacks excluded\) is used/gi, '일반 공격 제외 스킬 사용 시')
    .replace(/Guard Break Immunity/gi, '가드 브레이크 면역')
    .replace(/HP does not drop to 1 or below\. Restores HP by ([^,.]+?) of Max HP when the buff ends/gi, '생명력이 1 이하로 떨어지지 않음. 효과 종료 시 최대 생명력의 $1 회복')
    .replace(/Recovers by an additional ([^,.]+?) of 총 천성/gi, '총 천성의 $1만큼 추가 회복')
    .replace(/Fire Damage/gi, '화염 피해량')
    .replace(/Fire Resist/gi, '화염 저항')
    .replace(/Fire Immunity Chance/gi, '화염 면역 확률')
    .replace(/Poison Damage/gi, '독 피해량')
    .replace(/Poison Resist/gi, '독 저항')
    .replace(/of 최대 생명력/gi, '최대 생명력의')
    .replace(/of 생명력 Recovery/gi, '생명력 회복량의')
    .replace(/생명력가/g, '생명력이')
    .replace(/\(최대\s+([^)]+)\)/g, '(최대 $1)')
    .replace(/\s+([,.])/g, '$1')
    .replace(/(\d+(?:\.\d+)?)\s*%(\d+(?:\.\d+)?%)/g, '$1% $2')
    .replace(/\s+/g, ' ')
    .trim();
}
