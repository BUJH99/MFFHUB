import { describe, expect, it } from 'vitest';
import { getCharacterInstinctLabel, translateMffEffectText } from './mffTextKorean';

describe('mff Korean display helpers', () => {
  it('maps character instinct tags to Korean labels', () => {
    expect(getCharacterInstinctLabel(['Gender:Female', 'Instinct:Justice'])).toBe('정의');
    expect(getCharacterInstinctLabel(['Instinct:Cruelty'])).toBe('잔혹');
    expect(getCharacterInstinctLabel(['Instinct:Order'])).toBe('질서');
    expect(getCharacterInstinctLabel(['Instinct:Destruction'])).toBe('파괴');
  });

  it('translates common artifact and support effect wording into Korean', () => {
    expect(translateMffEffectText('6★: Applies to: Gamma Radiation Allies')).toBe('적용 대상: 감마선 능력 아군');
    expect(translateMffEffectText('• Increases All Basic Attacks by 25%, and an additional 0.5% of total Instinct. (Up to 200%)')).toBe('• 모든 공격력 25% 증가, 총 천성의 0.5% 추가. (최대 200%)');
    expect(translateMffEffectText('Cooldown Time 1 second')).toBe('재사용 대기시간 1초');
    expect(translateMffEffectText('Basic Damage Dealt to Boss Types 45%')).toBe('보스 타입에게 주는 기본 피해량 45%');
    expect(translateMffEffectText('Basic Damage Received from Villains 35%')).toBe('빌런에게 받는 기본 피해량 35%');
    expect(translateMffEffectText("• Ignores target's Dodge Rate by 20%, and an additional 0.4% of total Instinct. (Up to 200%)")).toBe('• 대상의 회피율 20% 무시, 총 천성의 0.4% 추가. (최대 200%)');
    expect(translateMffEffectText('• Increases Basic Damage Dealt to enemies with 50% HP or below by 25%, and an additional 0.5% of total Instinct. (Up to 200%)')).toBe('• 생명력이 50% 이하인 적에게 주는 기본 피해량 25% 증가, 총 천성의 0.5% 추가. (최대 200%)');
    expect(translateMffEffectText('• Increases Basic Damage Dealt to SUPER VILLAIN faction by 20%, and an additional 0.5% of total Instinct. (Up to 200%)')).toBe('• 슈퍼 빌런 진영에게 주는 기본 피해량 20% 증가, 총 천성의 0.5% 추가. (최대 200%)');
    expect(translateMffEffectText('• HP does not drop to 1 or below. Restores HP by 50% of Max HP when the buff ends.')).toBe('• 생명력이 1 이하로 떨어지지 않음. 효과 종료 시 최대 생명력의 50% 회복.');
    expect(translateMffEffectText('Activation Rate: when skill (regular attacks excluded) is used')).toBe('발동 조건: 일반 공격 제외 스킬 사용 시');
    expect(translateMffEffectText('Applies to: Allies with FLAME Ability')).toBe('적용 대상: 화염 능력 아군');
  });
});
