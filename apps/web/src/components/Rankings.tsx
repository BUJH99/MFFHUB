import Image from 'next/image';
import { getModeTop3 } from '@mff-data-hub/core';
import type { Character } from '@mff-data-hub/types';

function Row({ character, score, rank }: { character: Character; score: number; rank: number }) {
  return (
    <div className="grid grid-cols-[22px_34px_1fr_44px] items-center gap-2 rounded-xl px-2 py-1.5 text-xs hover:bg-slate-50">
      <b className="text-slate-500">{rank}</b>
      <Image src={character.portraitUrl} alt="" width={32} height={32} unoptimized className="h-8 w-8 rounded-lg object-cover" />
      <span className="truncate font-bold text-slate-800">{character.name}</span>
      <b className="text-right text-purple-700">{score.toFixed(0)}</b>
    </div>
  );
}

export function Rankings({ characters }: { characters: Character[] }) {
  const tops = getModeTop3(characters);
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-950">추천 요약 TOP 3</h2>
        <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">더보기 ›</button>
      </div>
      <h3 className="mb-2 text-xl font-black text-purple-700">PVE</h3>
      <div className="grid gap-3 lg:grid-cols-3">
        {tops.pve.map((group) => (
          <div key={group.label} className="rounded-2xl border border-slate-200 p-3">
            <p className="mb-2 text-center text-xs font-black text-slate-500">{group.label} TOP 3</p>
            {group.rows.map((row, index) => <Row key={row.character.id} rank={index + 1} character={row.character} score={row.score} />)}
          </div>
        ))}
      </div>
      <h3 className="mb-2 mt-5 text-xl font-black text-red-500">PVP</h3>
      <div className="grid gap-3 lg:grid-cols-3">
        {tops.pvp.map((group) => (
          <div key={group.label} className="rounded-2xl border border-slate-200 p-3">
            <p className="mb-2 text-center text-xs font-black text-slate-500">{group.label} TOP 3</p>
            {group.rows.map((row, index) => <Row key={row.character.id} rank={index + 1} character={row.character} score={row.score} />)}
          </div>
        ))}
      </div>
    </section>
  );
}
