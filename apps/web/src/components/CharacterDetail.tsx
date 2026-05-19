'use client';

import Image from 'next/image';
import type { SyntheticEvent } from 'react';
import { AttributeBadge, CharacterTagBadges, SourceStatusBadge } from '@/components/AttributeBadges';
import { characters, gearRows, pvpDecks, pvpModeRules } from '@/lib/data';
import { formatRestrictionLabel, getWeekAllianceBattleCalendar } from '@/lib/allianceBattle';
import { usePvpRestrictionOverrides } from '@/lib/pvpRestrictions';
import { averageDeckScore, gradeForScore, pveWeeklyModes, pvpScoreModes, type PvpScoreContent } from '@/lib/scoreDisplay';
import type { CatalogCharacter } from '@mff-data-hub/data';
import { getCurrentUniform, getRosterItem, type RosterLookup } from '@mff-data-hub/core';
import type { Character } from '@mff-data-hub/types';

function fallback(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  img.onerror = null;
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(img.alt.slice(0, 10))}&background=f1f5f9&color=334155&bold=true`;
}

export function CharacterDetail({ character, catalogCharacter, rosterLookup }: { character: Character; catalogCharacter?: CatalogCharacter; rosterLookup: RosterLookup }) {
  const roster = getRosterItem(character, rosterLookup);
  const uniform = getCurrentUniform(character, rosterLookup);
  const topBuffs = character.buffs.slice(0, 5);
  const displayName = catalogCharacter?.name ?? character.name;
  const displayImage = catalogCharacter?.imageUrl ?? character.portraitUrl;
  const displayUniform = catalogCharacter?.uniforms[0]?.name ?? uniform.name;
  const displayType = catalogCharacter?.type ?? character.type;
  const displaySide = catalogCharacter?.side ?? character.alignment;
  const displayTags = catalogCharacter?.tags ?? character.tags;
  const displayGender = displayTags.find((tag) => tag.startsWith('Gender:'))?.replace('Gender:', '') ?? character.gender;
  const artifact = catalogCharacter?.artifact;
  const hasCoreCharacter = !catalogCharacter || catalogCharacter.id === character.id;
  const weekCalendar = getWeekAllianceBattleCalendar();
  const weeklyPveScores = pveWeeklyModes.map((mode) => {
    const matches = weekCalendar
      .map((day) => ({
        day,
        condition: mode.content === 'ABX' ? day.abx : mode.content === 'ABL' ? day.abl : day.infinite,
      }))
      .filter((row) => row.condition);
    const featured = matches.find((row) => row.day.isToday) ?? matches[0];
    return {
      ...mode,
      score: character.scores[mode.content],
      grade: gradeForScore(character.scores[mode.content]),
      condition: featured?.condition ? `${featured.day.dayName}요일 · ${formatRestrictionLabel(featured.condition)}` : '이번 주 조건 없음',
    };
  });
  const pvpScores = pvpScoreModes.map((mode) => ({
    ...mode,
    score: character.scores[mode.content],
    grade: gradeForScore(character.scores[mode.content]),
  }));
  const timelineRule = pvpModeRules.find((item) => item.content === 'Timeline Battle')!;
  const otherworldRule = pvpModeRules.find((item) => item.content === 'Otherworld')!;
  const teamBattleRule = pvpModeRules.find((item) => item.content === 'Team Battle Arena')!;
  const timelineRestrictions = usePvpRestrictionOverrides('Timeline Battle', timelineRule.restrictionCharacters);
  const otherworldRestrictions = usePvpRestrictionOverrides('Otherworld', otherworldRule.restrictionCharacters);
  const teamBattleRestrictions = usePvpRestrictionOverrides('Team Battle Arena', teamBattleRule.restrictionCharacters);
  const restrictedIdsByContent: Record<PvpScoreContent, Set<string>> = {
    'Timeline Battle': timelineRestrictions.restrictedIds,
    Otherworld: otherworldRestrictions.restrictedIds,
    'Team Battle Arena': teamBattleRestrictions.restrictedIds,
  };
  const pvpDeckRows = pvpDecks.map((deck) => {
    const members = deck.teams
      .flatMap((team) => team.memberIds)
      .map((id) => characters.find((item) => item.id === id))
      .filter((item): item is Character => Boolean(item));
    const rule = pvpModeRules.find((item) => item.content === deck.content);
    const restrictedIds = restrictedIdsByContent[deck.content];
    return {
      ...deck,
      members,
      score: averageDeckScore(members, deck.content),
      active: members.some((member) => member.id === character.id),
      restrictedCount: members.filter((member) => restrictedIds.has(member.id)).length,
      formation: rule?.formation ?? '',
    };
  });

  return (
    <aside className="sticky top-5 h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-950">캐릭터 상세 정보</h2>
        <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">내 메모</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-[150px_1fr] xl:grid-cols-1 2xl:grid-cols-[150px_1fr]">
        <Image src={displayImage} alt={displayName} width={320} height={400} unoptimized onError={fallback} style={{ height: 'auto' }} className="aspect-[4/5] w-full rounded-2xl object-cover" />
        <div>
          <h3 className="text-2xl font-black text-slate-950">{displayName}</h3>
          <p className="font-bold text-slate-500">{displayUniform}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
            <AttributeBadge value={displayType} tone="purple" fallback={false} />
            <AttributeBadge value={displaySide} tone={displaySide === 'Villain' ? 'red' : displaySide === 'Hero' ? 'blue' : 'slate'} fallback={false} />
            <AttributeBadge value={displayGender} tone="blue" fallback={false} />
            {hasCoreCharacter ? <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{character.procFriendly}</span> : <SourceStatusBadge status={catalogCharacter?.sourceStatus} />}
          </div>
          <div className="mt-3 flex max-h-24 flex-wrap gap-1.5 overflow-auto pr-1">
            <CharacterTagBadges tags={displayTags} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <p className="rounded-2xl bg-slate-50 p-3"><span className="block text-xs font-black text-slate-400">티어</span><b>{hasCoreCharacter ? roster?.tier ?? character.tier : displayTags.find((tag) => tag === 'Tier-4' || tag === 'Tier-3' || tag === 'Transcended') ?? '-'}</b></p>
            <p className="rounded-2xl bg-slate-50 p-3"><span className="block text-xs font-black text-slate-400">레벨</span><b>{hasCoreCharacter ? `${roster?.level ?? '-'} / 80` : 'DB'}</b></p>
            <p className="rounded-2xl bg-slate-50 p-3"><span className="block text-xs font-black text-slate-400">아티팩트</span><b>{hasCoreCharacter ? `${roster?.artifactStars ?? 0}★` : artifact ? '있음' : '없음'}</b></p>
            <p className="rounded-2xl bg-slate-50 p-3"><span className="block text-xs font-black text-slate-400">C.T.P</span><b>{hasCoreCharacter ? roster?.ctp ?? character.ctpRecommendations[0] : '미설정'}</b></p>
          </div>
        </div>
      </div>

      {hasCoreCharacter ? (
        <section className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <h4 className="mb-3 font-black text-slate-950">이번 주 PVE 점수</h4>
          <div className="grid gap-2">
            {weeklyPveScores.map((row) => (
              <div key={row.content} className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <span className={`rounded-xl px-2.5 py-1 text-[10px] font-black ring-1 ${row.accent}`}>{row.shortLabel}</span>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-950">{row.score.toFixed(1)}</p>
                    <p className="text-xs font-black text-purple-700">{row.grade}</p>
                  </div>
                </div>
                <p className="mt-2 truncate text-xs font-bold text-slate-500">{row.condition}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {hasCoreCharacter ? (
        <section className="mt-5 rounded-3xl border border-slate-100 bg-white p-4">
          <h4 className="mb-3 font-black text-slate-950">PVP 점수 / 등급</h4>
          <div className="grid gap-2">
            {pvpScores.map((row) => (
              <div key={row.content} className="grid grid-cols-[46px_1fr_54px_42px] items-center gap-2 rounded-2xl bg-slate-50 p-3">
                <span className={`rounded-xl px-2 py-1 text-center text-[10px] font-black ring-1 ${row.accent}`}>{row.shortLabel}</span>
                <span className="truncate text-xs font-black text-slate-700">{row.label}</span>
                <span className="text-right text-lg font-black text-slate-950">{row.score.toFixed(0)}</span>
                <span className="text-right text-xs font-black text-red-600">{row.grade}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {hasCoreCharacter ? (
        <section className="mt-5 rounded-3xl border border-slate-100 bg-slate-950 p-4 text-white">
          <h4 className="mb-3 font-black">PVP 추천 덱</h4>
          <div className="space-y-3">
            {pvpDeckRows.map((deck) => (
              <article key={deck.content} className={`rounded-2xl p-3 ring-1 ${deck.active ? 'bg-white text-slate-950 ring-purple-300' : 'bg-white/10 ring-white/10'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">{deck.label}</p>
                    <p className={`text-xs font-bold ${deck.active ? 'text-purple-700' : 'text-slate-300'}`}>{deck.formation} · {deck.note}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black">{deck.score.toFixed(1)}</p>
                    <p className="text-xs font-black text-orange-400">{gradeForScore(deck.score)}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {deck.members.map((member) => (
                    <span key={member.id} className={`relative h-12 w-12 overflow-hidden rounded-2xl ring-2 ${member.id === character.id ? 'ring-purple-500' : deck.active ? 'ring-slate-200' : 'ring-white/10'}`} title={member.name}>
                      <Image src={member.portraitUrl} alt={member.name} fill sizes="48px" unoptimized className="object-cover" />
                    </span>
                  ))}
                </div>
                <p className={`mt-3 rounded-xl px-2.5 py-2 text-[11px] font-black ${deck.restrictedCount ? 'bg-red-100 text-red-700' : deck.active ? 'bg-emerald-50 text-emerald-700' : 'bg-white/10 text-slate-200'}`}>
                  {deck.restrictedCount ? `현재 제한 감시 ${deck.restrictedCount}명 포함` : '현재 로컬 제한 충돌 없음'}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {hasCoreCharacter ? <section className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
        <h4 className="mb-3 font-black text-slate-950">추천 장비 / 빌드 체크</h4>
        <div className="space-y-2">
          {gearRows.map((row) => (
            <div key={row.name} className="grid grid-cols-[34px_92px_1fr] items-center gap-3 rounded-2xl bg-white p-3 text-sm">
              <span className="text-2xl">{row.icon}</span>
              <div><p className="font-black text-blue-600">{row.name}</p><p className="text-xs text-amber-500">{row.rating}</p></div>
              <p className="font-bold text-slate-700">{row.name === 'C.T.P' ? character.ctpRecommendations.join(' / ') : row.value}</p>
            </div>
          ))}
        </div>
      </section> : <section className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
        <h4 className="mb-3 font-black text-slate-950">DB 캐시 상태</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p className="rounded-2xl bg-white p-3"><span className="block text-xs font-black text-slate-400">유니폼</span><b>{catalogCharacter?.uniforms.length ?? 0}</b></p>
          <div className="rounded-2xl bg-white p-3"><span className="block text-xs font-black text-slate-400">상태</span><div className="mt-2"><SourceStatusBadge status={catalogCharacter?.sourceStatus} /></div></div>
        </div>
      </section>}

      {artifact ? (
        <section className="mt-5 rounded-3xl border border-amber-100 bg-amber-50/50 p-4">
          <div className="flex gap-3">
            {artifact.imageUrl ? <Image src={artifact.imageUrl} alt={artifact.name} width={64} height={64} unoptimized onError={fallback} className="h-16 w-16 rounded-2xl bg-white object-contain p-2" /> : null}
            <div>
              <h4 className="font-black text-slate-950">{artifact.name}</h4>
              <p className="text-xs font-bold text-amber-700">{artifact.skill}</p>
            </div>
          </div>
          <div className="mt-3 max-h-44 space-y-1 overflow-auto rounded-2xl bg-white/80 p-3">
            {artifact.effects.length ? artifact.effects.map((effect, index) => (
              <p key={`${artifact.name}-${index}`} className="text-[11px] font-bold leading-relaxed text-slate-700">{effect}</p>
            )) : <p className="text-xs font-bold text-slate-400">효과 텍스트 없음</p>}
          </div>
        </section>
      ) : null}

      <section className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 p-4">
          <h4 className="mb-3 font-black text-slate-950">버프/리더 효과</h4>
          <div className="space-y-2">
            {topBuffs.length ? topBuffs.map((effect, i) => (
              <p key={`${effect.stat}-${i}`} className="rounded-2xl bg-purple-50 p-3 text-xs font-bold text-purple-800">{effect.source}: {effect.stat} {effect.magnitude}%</p>
            )) : <p className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-500">주요 팀 버프 없음. 딜러 슬롯 기준 계산.</p>}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-100 p-4">
          <h4 className="mb-3 font-black text-slate-950">운용 메모</h4>
          <ul className="space-y-2 text-xs font-bold leading-relaxed text-slate-600">
            {hasCoreCharacter ? character.buildNotes.map((note) => <li key={note}>• {note}</li>) : [
              `${displayName} 선택 상태가 현재 DB 화면에 유지됩니다.`,
              '캐릭터/유니폼/아티팩트 이미지는 로컬 PNG 캐시에서 불러옵니다.',
              '세팅/CTP/로테이션은 계정 데이터 연결 후 별도 보강 대상입니다.',
            ].map((note) => <li key={note}>• {note}</li>)}
          </ul>
        </div>
      </section>
    </aside>
  );
}
