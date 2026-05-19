'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { AttributeBadge } from '@/components/AttributeBadges';
import { CustomOptimizer } from '@/components/CustomOptimizer';
import { characters } from '@/lib/data';
import { getTopCharacters } from '@mff-data-hub/core';

const sundayProfile = [
  { label: 'Sunday', icon: 'https://thanosvibs.money/static/attributes/nores.png' },
  { label: 'Blast', value: 'Blast' },
  { label: 'Universal', value: 'Universal' },
  { label: 'Hero', value: 'Hero' },
] as const;

export function InfinityChallengeSection() {
  const topCharacters = useMemo(() => getTopCharacters('Infinity Challenge', characters, 6), []);

  return (
    <section className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-blue-700">Infinity Challenge</p>
            <h2 className="text-2xl font-black text-slate-950">일요일 PVE 점수전</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {sundayProfile.map((item) => (
              <span key={item.label} className="inline-flex h-11 min-w-11 items-center justify-center rounded-2xl bg-slate-50 px-3 ring-1 ring-slate-200" title={item.label}>
                {'value' in item ? <AttributeBadge value={item.value} tone={item.value === 'Hero' ? 'blue' : 'purple'} size="md" fallback={false} /> : <Image src={item.icon} alt={item.label} width={28} height={28} unoptimized className="h-7 w-7 object-contain" />}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-6">
          {topCharacters.map(({ character, score }, index) => (
            <div key={character.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
              <div className="relative mx-auto h-16 w-16">
                <Image src={character.portraitUrl} alt={character.name} fill unoptimized className="rounded-2xl object-cover" />
                <span className="absolute -left-2 -top-2 rounded-lg bg-blue-600 px-2 py-0.5 text-xs font-black text-white">{index + 1}</span>
              </div>
              <p className="mt-2 truncate text-xs font-black text-slate-950">{character.name}</p>
              <p className="text-sm font-black text-blue-700">{score.toFixed(1)}</p>
            </div>
          ))}
        </div>
      </section>

      <CustomOptimizer
        title="인피니티 챌린지 캐릭터 커스텀"
        eyebrow="일요일 · ABX 유사 점수전"
        allowedContents={['Infinity Challenge']}
        initialInput={{
          content: 'Infinity Challenge',
          type: 'Any',
          alignment: 'Any',
          gender: 'Any',
          tags: ['pve', 'boss'],
          accountOnly: true,
          requireUniform: true,
          preferSafeRotation: true,
        }}
      />
    </section>
  );
}
