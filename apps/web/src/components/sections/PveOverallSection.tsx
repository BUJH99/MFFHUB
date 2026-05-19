'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { CharacterCard } from '@/components/CharacterCard';
import { characters } from '@/lib/data';
import { getRosterItem, getTopCharacters, pveOverallScore, type RosterLookup } from '@mff-data-hub/core';
import type { Character, ContentType } from '@mff-data-hub/types';

const pveModes: Array<{ content: ContentType; label: string; accent: string }> = [
  { content: 'World Boss', label: 'World Boss', accent: 'bg-slate-950 text-white' },
  { content: 'Infinity Challenge', label: 'Infinity Challenge', accent: 'bg-blue-600 text-white' },
  { content: 'ABL', label: 'ABL', accent: 'bg-purple-600 text-white' },
  { content: 'ABX', label: 'ABX', accent: 'bg-orange-500 text-white' },
];

function MiniRow({ character, score, rank }: { character: Character; score: number; rank: number }) {
  return (
    <div className="grid grid-cols-[24px_38px_1fr_44px] items-center gap-2 rounded-xl bg-white px-2 py-2 ring-1 ring-slate-100">
      <span className="text-xs font-black text-slate-400">{rank}</span>
      <Image src={character.portraitUrl} alt={character.name} width={38} height={38} unoptimized className="h-9 w-9 rounded-xl object-cover" />
      <span className="truncate text-xs font-black text-slate-800">{character.name}</span>
      <span className="text-right text-sm font-black text-slate-950">{score.toFixed(0)}</span>
    </div>
  );
}

export function PveOverallSection({
  selectedId,
  setSelectedId,
  rosterLookup,
}: {
  selectedId: string;
  setSelectedId: (id: string) => void;
  rosterLookup: RosterLookup;
}) {
  const overall = useMemo(() => getTopCharacters('PVE Overall', characters, 8), []);
  const modeTops = useMemo(() => pveModes.map((mode) => ({ ...mode, rows: getTopCharacters(mode.content, characters, 5) })), []);
  const average = Math.round((characters.reduce((sum, character) => sum + pveOverallScore(character), 0) / characters.length) * 10) / 10;
  const ownedTop = overall.filter(({ character }) => getRosterItem(character, rosterLookup)?.owned).length;

  return (
    <section className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-purple-700">PVE Overall</p>
            <h2 className="text-2xl font-black text-slate-950">PVE 종합 랭킹</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs font-black sm:grid-cols-4">
            <span className="rounded-2xl bg-slate-950 px-4 py-3 text-white">WB</span>
            <span className="rounded-2xl bg-blue-50 px-4 py-3 text-blue-700">IC</span>
            <span className="rounded-2xl bg-purple-50 px-4 py-3 text-purple-700">ABL</span>
            <span className="rounded-2xl bg-orange-50 px-4 py-3 text-orange-700">ABX</span>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-black text-slate-500">평균</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{average}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-black text-emerald-700">TOP8 보유</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{ownedTop}/8</p>
          </div>
          <div className="rounded-2xl bg-purple-50 p-4">
            <p className="text-xs font-black text-purple-700">계산 비중</p>
            <p className="mt-1 text-xl font-black text-slate-950">WB 34 · IC 26 · ABL 22 · ABX 18</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {overall.map(({ character, score }, index) => (
          <CharacterCard
            key={character.id}
            rank={index + 1}
            character={character}
            score={score}
            rosterItem={getRosterItem(character, rosterLookup)}
            selected={character.id === selectedId}
            onClick={() => setSelectedId(character.id)}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {modeTops.map((mode) => (
          <article key={mode.content} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-black text-slate-950">{mode.label}</h3>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${mode.accent}`}>TOP 5</span>
            </div>
            <div className="space-y-2">
              {mode.rows.map((row, index) => <MiniRow key={row.character.id} rank={index + 1} character={row.character} score={row.score} />)}
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
