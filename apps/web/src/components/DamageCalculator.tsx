'use client';

import { useMemo, useState } from 'react';
import { account } from '@/lib/data';
import { calcDamage } from '@mff-data-hub/core';
import type { DamageCalculatorInput } from '@mff-data-hub/types';

const initial: DamageCalculatorInput = {
  baseAttack: 42000,
  cardAttack: account.accountAttack ?? account.cardAttack,
  pierce: account.pierce,
  leadershipAttack: 35,
  supportDamageVillain: 65,
  supportDamageHero: 0,
  bossDamage: 50,
  chainHit: 10,
  elementalDamage: 45,
  procMultiplier: 200,
  critDamage: 200
};

function NumberInput({ label, value, onChange, suffix = '%' }: { label: string; value: number; suffix?: string; onChange: (v: number) => void }) {
  return (
    <label className="rounded-2xl border border-slate-200 bg-white p-3">
      <span className="mb-2 block text-xs font-black text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="min-w-0 flex-1 bg-transparent text-lg font-black text-slate-950 outline-none" />
        <span className="text-xs font-black text-slate-400">{suffix}</span>
      </div>
    </label>
  );
}

export function DamageCalculator() {
  const [input, setInput] = useState(initial);
  const result = useMemo(() => calcDamage(input), [input]);
  const set = (key: keyof DamageCalculatorInput, value: number) => setInput((prev) => ({ ...prev, [key]: value }));
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950">버퍼 / 디버퍼 데미지 효과 계산기</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">카드와 X-소드 마스터리 기반 계정 공격, 피어스, 리더/서포터 피해량을 비교함. 팀업은 대상 영웅일 때 별도 가산.</p>
        </div>
        <button onClick={() => setInput(initial)} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">초기화</button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NumberInput label="기본 공격력" value={input.baseAttack} suffix="" onChange={(v) => set('baseAttack', v)} />
          <NumberInput label="계정 공격 보정" value={input.cardAttack} onChange={(v) => set('cardAttack', v)} />
          <NumberInput label="피어스" value={input.pierce} onChange={(v) => set('pierce', v)} />
          <NumberInput label="리더 공격력" value={input.leadershipAttack} onChange={(v) => set('leadershipAttack', v)} />
          <NumberInput label="빌런 대상 피해" value={input.supportDamageVillain} onChange={(v) => set('supportDamageVillain', v)} />
          <NumberInput label="영웅 대상 피해" value={input.supportDamageHero} onChange={(v) => set('supportDamageHero', v)} />
          <NumberInput label="보스 타입 피해" value={input.bossDamage} onChange={(v) => set('bossDamage', v)} />
          <NumberInput label="체인 히트" value={input.chainHit} onChange={(v) => set('chainHit', v)} />
          <NumberInput label="속성 피해" value={input.elementalDamage} onChange={(v) => set('elementalDamage', v)} />
          <NumberInput label="Proc / Rage 배율" value={input.procMultiplier} onChange={(v) => set('procMultiplier', v)} />
          <NumberInput label="치명타 피해" value={input.critDamage} onChange={(v) => set('critDamage', v)} />
        </div>
        <aside className="rounded-3xl bg-gradient-to-br from-slate-950 to-purple-950 p-5 text-white shadow-soft">
          <p className="text-sm font-black text-purple-200">예상 결과</p>
          <p className="mt-2 text-5xl font-black">{result.expected.toLocaleString()}</p>
          <p className="mt-1 text-sm font-bold text-purple-200">총 배율 x{result.totalMultiplier.toFixed(2)}</p>
          <div className="mt-5 grid gap-2 text-sm font-bold">
            <p className="flex justify-between rounded-2xl bg-white/10 p-3"><span>공격력 배율</span><b>x{result.attackMultiplier.toFixed(2)}</b></p>
            <p className="flex justify-between rounded-2xl bg-white/10 p-3"><span>피해량 배율</span><b>x{result.damageMultiplier.toFixed(2)}</b></p>
            <p className="flex justify-between rounded-2xl bg-white/10 p-3"><span>피어스 배율</span><b>x{result.pierceMultiplier.toFixed(2)}</b></p>
            <p className="flex justify-between rounded-2xl bg-white/10 p-3"><span>치피 / Proc</span><b>x{(result.critMultiplier * result.procMultiplier).toFixed(2)}</b></p>
          </div>
          <p className="mt-4 text-xs font-bold leading-relaxed text-purple-200">※ 게임 내부 공식식이 아니라 조합 비교용 근사 계산기임. 같은 조건에서 버퍼 추가/제거 효과를 보는 용도로 쓰면 됨.</p>
        </aside>
      </div>
    </section>
  );
}
