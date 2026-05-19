'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { worldBosses, type WorldBoss, type WorldBossStageRule } from '@mff-data-hub/data';

const noRestrictionIcon = 'https://thanosvibs.money/static/attributes/nores.png';

function BossButton({ boss, active, onClick }: { boss: WorldBoss; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group flex min-h-[96px] items-center gap-3 rounded-2xl border p-3 text-left transition ${
        active ? 'border-purple-300 bg-purple-50 shadow-sm' : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50'
      }`}
    >
      <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-950 ring-1 ring-slate-200">
        <Image src={boss.portraitUrl} alt={boss.name} width={64} height={64} unoptimized className="h-full w-full object-cover" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-slate-950">{boss.name}</span>
        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black ${boss.mode === 'Legend+' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-blue-100 text-blue-700'}`}>
          {boss.mode}
        </span>
      </span>
    </button>
  );
}

function UnlockStrip({ boss }: { boss: WorldBoss }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-950">층 해금</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">10-90</span>
      </div>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-5 xl:grid-cols-9">
        {boss.unlocks.map((unlock) => (
          <div key={`${boss.id}-${unlock.stage}`} className="grid place-items-center rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <span className="mb-2 rounded-full bg-slate-950 px-2.5 py-1 text-xs font-black text-white">{unlock.stage}</span>
            <Image src={unlock.portraitUrl} alt={unlock.character} title={unlock.character} width={58} height={58} unoptimized className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white" />
          </div>
        ))}
      </div>
    </section>
  );
}

function RestrictionIcons({ stage }: { stage: WorldBossStageRule }) {
  const restrictions = stage.restrictions.length
    ? stage.restrictions
    : [{ label: 'No Restrictions', iconUrl: noRestrictionIcon }];

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {restrictions.map((restriction) => (
        <span key={`${stage.range}-${restriction.label}`} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 p-1.5 ring-1 ring-slate-200" title={restriction.label}>
          <Image src={restriction.iconUrl} alt={restriction.label} width={32} height={32} unoptimized className="h-full w-full object-contain" />
        </span>
      ))}
    </div>
  );
}

function CandidateIcons({ stage }: { stage: WorldBossStageRule }) {
  return (
    <div className="flex min-w-0 flex-wrap justify-center gap-1.5">
      {stage.candidates.map((candidate) => (
        <Image
          key={`${stage.range}-${candidate.name}-${candidate.portraitUrl}`}
          src={candidate.portraitUrl}
          alt={candidate.name}
          title={candidate.name}
          width={38}
          height={38}
          unoptimized
          className="h-9 w-9 rounded-xl object-cover ring-1 ring-slate-200"
        />
      ))}
    </div>
  );
}

function StageRuleGrid({ boss }: { boss: WorldBoss }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-950">층 조건</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{boss.stages.length}구간</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {boss.stages.map((stage) => (
          <article key={`${boss.id}-${stage.range}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[72px_150px_minmax(0,1fr)] md:items-center">
            <div className="grid place-items-center rounded-2xl bg-slate-950 px-3 py-3 text-sm font-black text-white">{stage.range}</div>
            <RestrictionIcons stage={stage} />
            <div className="min-w-0">
              <div className="mb-2 flex justify-center">
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-500 ring-1 ring-slate-200">{stage.candidateCount}</span>
              </div>
              <CandidateIcons stage={stage} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function BossHero({ boss }: { boss: WorldBoss }) {
  return (
    <section className="relative min-h-[280px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-sm">
      <Image src={boss.bannerUrl} alt={boss.name} fill priority unoptimized className="object-cover opacity-75" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/35 to-transparent" />
      <div className="relative flex min-h-[280px] items-end gap-5 p-6">
        <Image src={boss.portraitUrl} alt={boss.name} width={108} height={108} unoptimized className="h-24 w-24 rounded-3xl object-cover ring-4 ring-white/20" />
        <div className="pb-2">
          <span className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${boss.mode === 'Legend+' ? 'bg-fuchsia-500 text-white' : 'bg-blue-500 text-white'}`}>{boss.mode}</span>
          <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">{boss.name}</h1>
        </div>
      </div>
    </section>
  );
}

export function WorldBossSection() {
  const [selectedId, setSelectedId] = useState(worldBosses[0]?.id ?? '');
  const selectedBoss = useMemo(
    () => worldBosses.find((boss) => boss.id === selectedId) ?? worldBosses[0],
    [selectedId],
  );

  if (!selectedBoss) return null;

  return (
    <section className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {worldBosses.map((boss) => (
          <BossButton key={boss.id} boss={boss} active={boss.id === selectedBoss.id} onClick={() => setSelectedId(boss.id)} />
        ))}
      </section>

      <BossHero boss={selectedBoss} />
      <UnlockStrip boss={selectedBoss} />
      <StageRuleGrid boss={selectedBoss} />
    </section>
  );
}
