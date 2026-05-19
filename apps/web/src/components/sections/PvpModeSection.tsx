'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { CharacterCard } from '@/components/CharacterCard';
import { characters, pvpDecks, pvpModeRules } from '@/lib/data';
import { usePvpRestrictionOverrides, type PvpRestrictionCharacter } from '@/lib/pvpRestrictions';
import { averageDeckScore, gradeForScore, pvpScoreModes, type PvpScoreContent } from '@/lib/scoreDisplay';
import { getRosterItem, getTopCharacters, type RosterLookup } from '@mff-data-hub/core';
import type { Character } from '@mff-data-hub/types';

const modeCopy: Record<PvpScoreContent, { eyebrow: string; title: string; note: string }> = {
  Otherworld: {
    eyebrow: 'Otherworld Battle',
    title: '아더월드 점수 / 덱',
    note: '자동전투 안정성, 부활, 회복, 광역 제어를 같이 보는 PVP 모드',
  },
  'Timeline Battle': {
    eyebrow: 'Timeline Battle',
    title: '타임라인 점수 / 덱',
    note: '방어덱과 공격덱 양쪽에서 생존 앵커와 디버프 대응을 우선 확인',
  },
  'Team Battle Arena': {
    eyebrow: 'Team Battle Arena',
    title: '팀 배틀 아레나 점수 / 덱',
    note: '여러 팀에 전력을 분산해야 하므로 단일 고점보다 덱 평균과 안정성이 중요',
  },
};

function findCharacter(id: string) {
  return characters.find((character) => character.id === id);
}

function RestrictionEditor({
  content,
  restrictions,
  addRestriction,
  removeRestriction,
  clearRestrictions,
}: {
  content: PvpScoreContent;
  restrictions: PvpRestrictionCharacter[];
  addRestriction: (value: string) => boolean;
  removeRestriction: (id: string) => void;
  clearRestrictions: () => void;
}) {
  const [value, setValue] = useState('');
  const inputId = `restriction-input-${content.replace(/\s+/g, '-').toLowerCase()}`;
  const listId = `${inputId}-list`;

  const submit = () => {
    if (addRestriction(value)) setValue('');
  };

  return (
    <section className="rounded-3xl border border-red-100 bg-red-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-red-700">제한 캐릭터 커스텀</p>
          <h3 className="text-xl font-black text-slate-950">직접 입력 목록</h3>
        </div>
        <button type="button" onClick={clearRestrictions} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-red-100 hover:text-red-600">초기화</button>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          id={inputId}
          list={listId}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="캐릭터 이름 입력"
          className="min-w-0 flex-1 rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-red-300"
        />
        <datalist id={listId}>
          {characters.map((character) => <option key={character.id} value={character.name} />)}
        </datalist>
        <button type="button" onClick={submit} className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-sm">추가</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {restrictions.length ? restrictions.map((restriction) => {
          const character = findCharacter(restriction.id);
          return (
            <span key={restriction.id} className="inline-flex items-center gap-2 rounded-2xl bg-white px-2 py-2 text-xs font-black text-slate-700 ring-1 ring-red-100">
              {character ? (
                <span className="relative h-7 w-7 overflow-hidden rounded-xl">
                  <Image src={character.portraitUrl} alt={character.name} fill sizes="28px" unoptimized className="object-cover" />
                </span>
              ) : (
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-slate-100 text-[10px] text-slate-500">?</span>
              )}
              {restriction.name}
              <button type="button" onClick={() => removeRestriction(restriction.id)} className="rounded-lg px-1.5 py-0.5 text-red-600 hover:bg-red-50" aria-label={`${restriction.name} 제한 삭제`}>×</button>
            </span>
          );
        }) : <p className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-500 ring-1 ring-red-100">등록된 제한 캐릭터 없음</p>}
      </div>
    </section>
  );
}

function DeckCard({ deck, selectedId, restrictedIds }: { deck: (typeof pvpDecks)[number]; selectedId: string; restrictedIds: Set<string> }) {
  const teams = deck.teams.map((team) => ({
    ...team,
    members: team.memberIds
      .map(findCharacter)
      .filter((character): character is Character => Boolean(character)),
  }));
  const members = teams.flatMap((team) => team.members);
  const score = averageDeckScore(members, deck.content);
  const restrictedCount = members.filter((member) => restrictedIds.has(member.id)).length;

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-red-600">{deck.label}</p>
          <h3 className="text-xl font-black text-slate-950">{gradeForScore(score)} · {score.toFixed(1)}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] font-black ${restrictedCount ? 'bg-red-600 text-white' : 'bg-slate-950 text-white'}`}>
          {restrictedCount ? `제한 ${restrictedCount}` : `${members.length}명`}
        </span>
      </div>
      <div className="grid gap-3">
        {teams.map((team) => (
          <div key={team.label} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-black text-slate-500">{team.label}</p>
              <p className="text-xs font-black text-slate-950">{averageDeckScore(team.members, deck.content).toFixed(1)}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {team.members.map((member) => {
                const restricted = restrictedIds.has(member.id);
                return (
                  <div key={member.id} className={`rounded-2xl p-2 text-center ring-1 ${member.id === selectedId ? 'bg-purple-50 ring-purple-200' : restricted ? 'bg-red-50 ring-red-200' : 'bg-white ring-slate-100'}`}>
                    <div className="relative mx-auto h-14 w-14 overflow-hidden rounded-2xl">
                      <Image src={member.portraitUrl} alt={member.name} fill sizes="56px" unoptimized className="object-cover" />
                    </div>
                    <p className="mt-2 truncate text-xs font-black text-slate-950">{member.name}</p>
                    <p className={`text-xs font-black ${restricted ? 'text-red-600' : 'text-slate-600'}`}>{restricted ? '제한' : member.scores[deck.content].toFixed(0)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs font-bold leading-relaxed text-slate-500">{deck.note}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {deck.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">#{tag}</span>)}
      </div>
    </article>
  );
}

export function PvpModeSection({
  content,
  selectedId,
  setSelectedId,
  rosterLookup,
}: {
  content: PvpScoreContent;
  selectedId: string;
  setSelectedId: (id: string) => void;
  rosterLookup: RosterLookup;
}) {
  const topCharacters = useMemo(() => getTopCharacters(content, characters, 8), [content]);
  const mode = pvpScoreModes.find((item) => item.content === content)!;
  const rule = pvpModeRules.find((item) => item.content === content)!;
  const decks = pvpDecks.filter((deck) => deck.content === content);
  const average = Math.round((characters.reduce((sum, character) => sum + character.scores[content], 0) / characters.length) * 10) / 10;
  const { restrictions, restrictedIds, addRestriction, removeRestriction, clearRestrictions } = usePvpRestrictionOverrides(content, rule.restrictionCharacters);

  return (
    <section className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-red-600">{modeCopy[content].eyebrow}</p>
            <h2 className="text-2xl font-black text-slate-950">{modeCopy[content].title}</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">{modeCopy[content].note}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className={`rounded-2xl px-4 py-3 ring-1 ${mode.accent}`}>
              <p className="text-xs font-black">{mode.shortLabel}</p>
              <p className="text-xl font-black">{average}</p>
            </div>
            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
              <p className="text-xs font-black">TOP1</p>
              <p className="text-xl font-black">{topCharacters[0]?.score.toFixed(0) ?? '-'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
          <div>
            <p className="text-sm font-black text-red-600">룰 / 제한 인식</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">{rule.formation}</h3>
            <p className="mt-2 text-sm font-bold leading-relaxed text-slate-500">{rule.leaguePolicy}</p>
            <p className="mt-2 text-xs font-bold leading-relaxed text-slate-400">{rule.restrictionSummary}</p>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {restrictions.map((restricted) => {
              const character = findCharacter(restricted.id);
              return (
                <article key={restricted.id} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <div className="flex items-center gap-3">
                    {character ? (
                      <span className="relative h-11 w-11 overflow-hidden rounded-2xl ring-1 ring-red-100">
                        <Image src={character.portraitUrl} alt={character.name} fill sizes="44px" unoptimized className="object-cover" />
                      </span>
                    ) : (
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-200 text-xs font-black text-slate-500">?</span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{restricted.name}</p>
                      <p className="truncate text-[10px] font-black text-red-600">{restricted.kind}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-bold leading-relaxed text-slate-500">{restricted.note}</p>
                </article>
              );
            })}
            {restrictions.length === 0 ? (
              <article className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <p className="text-sm font-black text-slate-950">제한 목록 없음</p>
                <p className="mt-2 text-xs font-bold leading-relaxed text-slate-500">아래 입력창에서 이번 주/이번 시즌 제한 캐릭터를 추가하세요.</p>
              </article>
            ) : null}
          </div>
        </div>
      </section>

      <RestrictionEditor
        content={content}
        restrictions={restrictions}
        addRestriction={addRestriction}
        removeRestriction={removeRestriction}
        clearRestrictions={clearRestrictions}
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {topCharacters.map(({ character, score }, index) => (
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

      <section className="grid gap-4 xl:grid-cols-3">
        {decks.map((deck) => <DeckCard key={deck.content} deck={deck} selectedId={selectedId} restrictedIds={restrictedIds} />)}
      </section>
    </section>
  );
}
