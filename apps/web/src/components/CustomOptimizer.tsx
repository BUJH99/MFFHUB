'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { account, characters, optimizerPresets, userRoster } from '@/lib/data';
import { optimizeTeams } from '@mff-data-hub/core';
import type { Alignment, Character, CombatType, CustomOptimizerInput, Gender, PveOptimizerContent, TeamRecommendation } from '@mff-data-hub/types';

const types: Array<CombatType | 'Any'> = ['Any', 'Combat', 'Blast', 'Speed', 'Universal'];
const alignments: Array<Alignment | 'Any'> = ['Any', 'Hero', 'Villain'];
const genders: Array<Gender | 'Any'> = ['Any', 'Male', 'Female'];
const contentOptions: PveOptimizerContent[] = ['ABX', 'ABL', 'Infinity Challenge', 'World Boss'];
const defaultInput: CustomOptimizerInput = { content: 'ABX', type: 'Combat', alignment: 'Any', gender: 'Any', tags: ['combat'], accountOnly: true, requireUniform: true, preferSafeRotation: true };
const tagOptions = ['leadership', 'villain', 'hero', 'female', 'male', 'combat', 'blast', 'speed', 'universal', 'elemental', 'fire', 'cold', 'pve', 'boss', 'support'];

function SelectPill<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((item) => (
        <button key={item} onClick={() => onChange(item)} className={`rounded-xl px-3 py-2 text-xs font-black ${value === item ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item}</button>
      ))}
    </div>
  );
}

function TeamCard({ team, rank }: { team: TeamRecommendation; rank: number }) {
  const members = [team.dealer, team.leader, team.support1, team.support2].filter((member): member is Character => Boolean(member));
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-purple-600">추천 조합 #{rank}</p>
          <h3 className="text-xl font-black text-slate-950">{team.dealer.name} 중심</h3>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-slate-950">{team.score.toFixed(1)}</p>
          <p className="font-black text-orange-500">{team.grade}</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {members.map((member, index) => (
          <div key={`${member.id}-${index}`} className="rounded-2xl bg-slate-50 p-2 text-center">
            <Image src={member.portraitUrl} alt="" width={56} height={56} unoptimized style={{ width: 56, height: 56 }} className="mx-auto rounded-xl object-cover" />
            <p className="mt-1 truncate text-[11px] font-black">{member.name}</p>
            <p className="text-[10px] font-bold text-slate-500">{index === 0 ? '딜러' : index === 1 ? '리더' : '서포터'}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 text-xs font-bold text-slate-600 md:grid-cols-2">
        {team.reasons.map((reason) => <p key={reason} className="rounded-xl bg-purple-50 p-2 text-purple-800">• {reason}</p>)}
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px] font-black">
        <div className="rounded-xl bg-slate-50 p-2"><span className="block text-slate-400">기본</span>{team.breakdown.base.toFixed(0)}</div>
        <div className="rounded-xl bg-slate-50 p-2"><span className="block text-slate-400">계정</span>{team.breakdown.account.toFixed(0)}</div>
        <div className="rounded-xl bg-slate-50 p-2"><span className="block text-slate-400">장비</span>{team.breakdown.gear.toFixed(0)}</div>
        <div className="rounded-xl bg-slate-50 p-2"><span className="block text-slate-400">팀버프</span>{(team.breakdown.leadership + team.breakdown.support).toFixed(0)}</div>
      </div>
      {team.upgradeHints.length ? <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-relaxed text-amber-800">업그레이드 힌트: {team.upgradeHints.slice(0, 3).join(' · ')}</div> : null}
    </article>
  );
}

export function CustomOptimizer({
  compact = false,
  initialInput,
  allowedContents = contentOptions,
  title = 'PVE 조합 계산기',
  eyebrow = '조건 기반',
}: {
  compact?: boolean;
  initialInput?: Partial<CustomOptimizerInput>;
  allowedContents?: PveOptimizerContent[];
  title?: string;
  eyebrow?: string;
}) {
  const [input, setInput] = useState<CustomOptimizerInput>(() => ({
    ...defaultInput,
    ...initialInput,
    tags: [...(initialInput?.tags ?? defaultInput.tags)],
  }));
  const teams = useMemo(() => optimizeTeams(input, characters, userRoster, account).slice(0, compact ? 2 : 6), [input, compact]);
  const set = <K extends keyof CustomOptimizerInput>(key: K, value: CustomOptimizerInput[K]) => setInput((prev) => ({ ...prev, [key]: value }));
  const toggleTag = (tag: string) => setInput((prev) => ({ ...prev, tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag] }));
  const visiblePresets = optimizerPresets.filter((preset) => allowedContents.includes(preset.content));

  return (
    <section className="rounded-3xl border border-purple-200 bg-gradient-to-br from-white to-purple-50/50 p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-purple-700">{eyebrow}</p>
          <h2 className="text-2xl font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">조건과 태그를 조합해 딜러, 리더, 서포터 후보를 계산합니다.</p>
        </div>
        <div className="rounded-2xl bg-white p-3 text-right shadow-sm ring-1 ring-purple-100">
          <p className="text-xs font-black text-slate-400">계정 보정</p>
          <p className="text-lg font-black text-purple-700">공격 {account.accountAttack ?? account.cardAttack}% · 피어스 {account.pierce}%</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div>
            <p className="mb-2 text-xs font-black text-slate-500">빠른 프리셋</p>
            <div className="grid grid-cols-2 gap-2">
              {visiblePresets.map((preset) => (
                <button key={preset.name} onClick={() => setInput((prev) => ({ ...prev, content: preset.content, type: preset.type, alignment: preset.alignment, gender: preset.gender, tags: [...preset.tags] }))} className="rounded-2xl bg-slate-50 p-3 text-left text-xs font-black text-slate-700 hover:bg-purple-50 hover:text-purple-700">{preset.name}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-black text-slate-500">콘텐츠</p>
            <SelectPill value={input.content} options={allowedContents} onChange={(v) => set('content', v)} />
          </div>
          <div>
            <p className="mb-2 text-xs font-black text-slate-500">타입</p>
            <SelectPill value={input.type} options={types} onChange={(v) => set('type', v)} />
          </div>
          <div>
            <p className="mb-2 text-xs font-black text-slate-500">진영 / 성별</p>
            <SelectPill value={input.alignment} options={alignments} onChange={(v) => set('alignment', v)} />
            <div className="mt-2"><SelectPill value={input.gender} options={genders} onChange={(v) => set('gender', v)} /></div>
          </div>
          <div>
            <p className="mb-2 text-xs font-black text-slate-500">태그 조건</p>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((tag) => <button key={tag} onClick={() => toggleTag(tag)} className={`rounded-xl px-3 py-2 text-xs font-black ${input.tags.includes(tag) ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>#{tag}</button>)}
            </div>
          </div>
          <div className="grid gap-2 text-xs font-black text-slate-600">
            <label className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"><span>보유 캐릭만</span><input type="checkbox" checked={input.accountOnly} onChange={(e) => set('accountOnly', e.target.checked)} /></label>
            <label className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"><span>유니폼 보유 필수</span><input type="checkbox" checked={input.requireUniform} onChange={(e) => set('requireUniform', e.target.checked)} /></label>
            <label className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"><span>안정 사이클 선호</span><input type="checkbox" checked={input.preferSafeRotation} onChange={(e) => set('preferSafeRotation', e.target.checked)} /></label>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {teams.map((team, index) => <TeamCard key={`${team.dealer.id}-${index}`} team={team} rank={index + 1} />)}
        </div>
      </div>
    </section>
  );
}
