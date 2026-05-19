'use client';

import Image from 'next/image';
import type { SyntheticEvent } from 'react';
import { AttributeBadge } from '@/components/AttributeBadges';
import type { Character, UserCharacter } from '@mff-data-hub/types';

function fallback(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  img.onerror = null;
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(img.alt.slice(0, 10))}&background=f1f5f9&color=334155&bold=true`;
}

export function CharacterCard({ rank, character, score, selected, rosterItem, onClick }: { rank?: number; character: Character; score: number; selected?: boolean; rosterItem?: UserCharacter; onClick?: () => void }) {
  const owned = rosterItem?.owned;
  return (
    <button onClick={onClick} className={`group overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-soft ${selected ? 'border-purple-400 ring-2 ring-purple-100' : 'border-slate-200'}`}>
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <Image src={character.portraitUrl} alt={character.name} fill sizes="(min-width: 1024px) 160px, 50vw" unoptimized onError={fallback} className="object-cover transition group-hover:scale-105" />
        {rank ? <span className="absolute left-2 top-2 rounded-lg bg-white/90 px-2 py-0.5 text-sm font-black text-slate-900 shadow-sm">{rank}</span> : null}
        <span className={`absolute right-2 top-2 rounded-lg px-2 py-0.5 text-[10px] font-black ${owned === false ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{owned === false ? '미보유' : character.tier}</span>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">{character.name}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <AttributeBadge value={character.type} tone="purple" size="sm" fallback={false} />
              <AttributeBadge value={character.alignment} tone={character.alignment === 'Villain' ? 'red' : 'blue'} size="sm" fallback={false} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-slate-950">{score.toFixed(1)}</p>
            <p className="text-xs font-black text-orange-500">{score >= 95 ? 'S+' : score >= 88 ? 'S' : score >= 80 ? 'A+' : 'A'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {character.roles.slice(0, 2).map((role) => <span key={role} className="rounded-full bg-purple-50 px-2 py-1 text-[10px] font-bold text-purple-700">{role}</span>)}
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{character.procFriendly}</span>
        </div>
        <p className="line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-500">{character.buildNotes[0]}</p>
      </div>
    </button>
  );
}
