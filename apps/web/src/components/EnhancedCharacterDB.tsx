'use client';

import Image from 'next/image';
import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode, type SyntheticEvent } from 'react';
import { AttributeBadge, CharacterTagBadges, SourceStatusBadge } from '@/components/AttributeBadges';
import { catalogCharacters, catalogStats, type CatalogCharacter, type CatalogUniform } from '@mff-data-hub/data';

type Props = {
  selectedId?: string;
  onSelect?: (id: string) => void;
  onSelectCatalog?: (character: CatalogCharacter) => void;
};

const MATRIX_ROW_HEIGHT = 360;
const MATRIX_OVERSCAN = 6;
const sourceOptions: Array<'ALL' | CatalogCharacter['sourceStatus']> = ['ALL', 'synced', 'manual'];
const totalUniforms = catalogCharacters.reduce((count, character) => count + character.uniforms.length, 0);
const artifactCount = catalogCharacters.filter((character) => character.artifact).length;
const catalogSearchIndex = catalogCharacters.map((character) => ({
  character,
  searchText: [
    character.name,
    character.type,
    character.side,
    character.tags.join(' '),
    character.uniforms.map((uniform) => uniform.name).join(' '),
    character.artifact?.name,
    character.artifact?.skill,
    character.artifact?.effects.join(' '),
  ].join(' ').toLowerCase(),
}));

function imageFallback(e: SyntheticEvent<HTMLImageElement>, label: string) {
  const img = e.currentTarget;
  img.onerror = null;
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=ede9fe&color=6d28d9&bold=true`;
}

function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'purple' | 'blue' | 'green' | 'red' | 'amber' }) {
  const tones = {
    slate: 'border-slate-200 bg-slate-100 text-slate-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-rose-200 bg-rose-50 text-rose-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${tones[tone]}`}>{children}</span>;
}

function CharacterCell({ character, active, onSelect }: { character: CatalogCharacter; active?: boolean; onSelect?: (id: string) => void }) {
  return (
    <div className={`min-w-[360px] rounded-2xl border p-3 ${active ? 'border-purple-300 bg-purple-50' : 'border-slate-200 bg-white'}`}>
      <button type="button" data-testid={`character-select-${character.id}`} onClick={() => onSelect?.(character.id)} className="flex w-full gap-4 text-left">
        <Image
          src={character.imageUrl}
          alt={character.name}
          width={96}
          height={96}
          unoptimized
          onError={(e) => imageFallback(e, character.name)}
          className="h-24 w-24 shrink-0 rounded-2xl border border-slate-200 bg-slate-100 object-cover"
        />
        <div className="min-w-0">
          <p className="text-base font-black text-slate-950">{character.name}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <AttributeBadge value={character.type} tone="purple" fallback={false} />
            <AttributeBadge value={character.side} tone={character.side === 'Villain' ? 'red' : character.side === 'Hero' ? 'blue' : 'slate'} fallback={false} />
            <SourceStatusBadge status={character.sourceStatus} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] font-black text-slate-500">
            <span>유니폼 {character.uniforms.length}</span>
            <span>아티팩트 {character.artifact ? '있음' : '없음'}</span>
          </div>
        </div>
      </button>
      <div className="mt-3 flex max-h-28 flex-wrap gap-1.5 overflow-auto pr-1">
        <CharacterTagBadges tags={character.tags} />
      </div>
    </div>
  );
}

function ArtifactCell({ character }: { character: CatalogCharacter }) {
  const artifact = character.artifact;
  return (
    <div className="min-w-[440px] rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50">
          {artifact?.imageUrl ? (
            <Image src={artifact.imageUrl} alt={artifact.name} width={80} height={80} unoptimized onError={(e) => imageFallback(e, artifact.name)} className="h-full w-full object-contain p-2" />
          ) : (
            <div className="grid h-full w-full place-items-center text-xl font-black text-amber-600">A</div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-950">{artifact?.name ?? 'Artifact 미등록'}</p>
          <p className="mt-1 text-xs font-bold text-amber-700">{artifact?.skill ?? '전용 스킬 없음'}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="green">PvE {artifact?.pve ?? '-'}</Badge>
            <Badge tone="red">PvP {artifact?.pvp ?? '-'}</Badge>
          </div>
        </div>
      </div>
      <div className="mt-3 max-h-56 overflow-auto rounded-xl bg-slate-50 p-3">
        {artifact?.effects?.length ? (
          <div className="space-y-1.5">
            {artifact.effects.map((effect, index) => (
              <p key={`${artifact.name}-${index}`} className="text-[11px] font-bold leading-relaxed text-slate-700">{effect}</p>
            ))}
          </div>
        ) : (
          <p className="text-xs font-bold text-slate-400">아티팩트 효과 텍스트 없음</p>
        )}
      </div>
    </div>
  );
}

function SkillGroup({ title, rows, tone }: { title: string; rows?: string[]; tone: 'blue' | 'purple' | 'green' }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Badge tone={tone}>{title}</Badge>
        <span className="text-[11px] font-black text-slate-400">{rows?.length ?? 0}</span>
      </div>
      <div className="space-y-1.5">
        {rows?.length ? rows.map((row, index) => (
          <p key={`${title}-${index}`} className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-bold leading-relaxed text-slate-700">{row}</p>
        )) : <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-400">없음</p>}
      </div>
    </div>
  );
}

function SkillCell({ uniform }: { uniform?: CatalogUniform }) {
  return (
    <div className="min-w-[380px] rounded-2xl border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center gap-3">
        {uniform?.imageUrl ? (
          <Image src={uniform.imageUrl} alt={uniform.name} width={56} height={56} unoptimized onError={(e) => imageFallback(e, uniform.name)} className="h-14 w-14 rounded-xl border border-slate-200 object-cover" />
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">{uniform?.name ?? '유니폼 선택 필요'}</p>
          <p className="truncate text-[11px] font-bold text-slate-400">{uniform?.release ?? uniform?.acquisition ?? '선택한 유니폼 기준으로 효과 표시'}</p>
        </div>
      </div>
      <div className="max-h-72 space-y-4 overflow-auto pr-1">
        <SkillGroup title="Leader" rows={uniform?.leader} tone="blue" />
        <SkillGroup title="Passive" rows={uniform?.passive} tone="purple" />
        <SkillGroup title="Uniform" rows={uniform?.uniformEffect} tone="green" />
      </div>
    </div>
  );
}

function UniformColumnCell({
  uniform,
  active,
  testId,
  onClick,
}: {
  uniform?: CatalogUniform;
  active?: boolean;
  testId?: string;
  onClick?: () => void;
}) {
  if (!uniform) return <td className="border-b border-slate-100 px-2 py-3" />;

  return (
    <td className="border-b border-slate-100 px-2 py-3 align-top">
      <button
        type="button"
        data-testid={testId}
        onClick={onClick}
        className={`flex h-full w-[150px] flex-col rounded-2xl border p-2 text-left transition hover:border-purple-300 hover:bg-purple-50 ${active ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-100' : 'border-slate-200 bg-white'}`}
      >
        {uniform.imageUrl ? (
          <Image
            src={uniform.imageUrl}
            alt={uniform.name}
            width={150}
            height={150}
            unoptimized
            onError={(e) => imageFallback(e, uniform.name)}
            className="aspect-square w-full rounded-xl border border-slate-200 bg-slate-100 object-cover"
          />
        ) : (
          <div className="grid aspect-square w-full place-items-center rounded-xl border border-slate-200 bg-slate-100 text-lg font-black text-slate-400">UNI</div>
        )}
        <p className="mt-2 line-clamp-2 min-h-9 text-xs font-black leading-tight text-slate-900">{uniform.name}</p>
        <p className="mt-1 line-clamp-2 text-[10px] font-bold leading-tight text-slate-400">{uniform.release ?? uniform.acquisition ?? 'release 미상'}</p>
      </button>
    </td>
  );
}

export function EnhancedCharacterDB({ selectedId, onSelect, onSelectCatalog }: Props) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('ALL');
  const [side, setSide] = useState('ALL');
  const [sourceStatus, setSourceStatus] = useState<'ALL' | CatalogCharacter['sourceStatus']>('ALL');
  const [view, setView] = useState<'matrix' | 'cards'>('matrix');
  const [selectedUniformByCharacter, setSelectedUniformByCharacter] = useState<Record<string, number>>({});
  const deferredQuery = useDeferredValue(query);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(680);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return catalogSearchIndex
      .filter(({ character, searchText }) =>
        (!q || searchText.includes(q)) &&
        (type === 'ALL' || character.type === type) &&
        (side === 'ALL' || character.side === side) &&
        (sourceStatus === 'ALL' || character.sourceStatus === sourceStatus))
      .map(({ character }) => character);
  }, [deferredQuery, type, side, sourceStatus]);

  const dedupedFiltered = useMemo(() => Array.from(new Map(filtered.map((character) => [character.id, character])).values()), [filtered]);
  const maxUniformColumns = useMemo(() => Math.max(1, ...dedupedFiltered.map((character) => character.uniforms.length)), [dedupedFiltered]);
  const visibleColumnCount = 3 + maxUniformColumns;

  const selectUniform = (characterId: string, index: number) => {
    setSelectedUniformByCharacter((current) => ({ ...current, [characterId]: index }));
  };

  const selectCharacter = (character: CatalogCharacter) => {
    onSelect?.(character.id);
    onSelectCatalog?.(character);
  };

  const tableMinWidth = 360 + 440 + 380 + maxUniformColumns * 166;
  const startIndex = view === 'matrix' ? Math.max(0, Math.floor(scrollTop / MATRIX_ROW_HEIGHT) - MATRIX_OVERSCAN) : 0;
  const visibleCount = view === 'matrix' ? Math.ceil(viewportHeight / MATRIX_ROW_HEIGHT) + MATRIX_OVERSCAN * 2 : dedupedFiltered.length;
  const visibleRows = dedupedFiltered.slice(startIndex, startIndex + visibleCount);
  const topSpacer = startIndex * MATRIX_ROW_HEIGHT;
  const bottomSpacer = Math.max(0, dedupedFiltered.length - startIndex - visibleRows.length) * MATRIX_ROW_HEIGHT;

  useEffect(() => {
    setScrollTop(0);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [deferredQuery, type, side, sourceStatus, view]);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-600">Character DB Matrix</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">전체 캐릭터 DB</h2>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-slate-500">
              로컬 PNG 캐시 기반으로 캐릭터, 아티팩트, 유니폼 이미지를 표시합니다. 유니폼 이미지를 누르면 3열의 리더/패시브/유니폼 효과가 해당 유니폼 기준으로 바뀝니다.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-purple-50 px-4 py-3"><p className="text-2xl font-black text-purple-700">{catalogStats.count}</p><p className="text-[11px] font-black text-purple-500">표시 캐릭</p></div>
            <div className="rounded-2xl bg-blue-50 px-4 py-3"><p className="text-2xl font-black text-blue-700">{totalUniforms}</p><p className="text-[11px] font-black text-blue-500">유니폼</p></div>
            <div className="rounded-2xl bg-amber-50 px-4 py-3"><p className="text-2xl font-black text-amber-700">{artifactCount}</p><p className="text-[11px] font-black text-amber-500">아티팩트</p></div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_150px_150px_160px_160px]">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="캐릭터명 / 유니폼 / 아티팩트 / 효과 검색" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black"><option>ALL</option><option>Combat</option><option>Blast</option><option>Speed</option><option>Universal</option><option>Unknown</option></select>
          <select value={side} onChange={(e) => setSide(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black"><option>ALL</option><option>Hero</option><option>Villain</option><option>Neutral</option><option>Unknown</option></select>
          <select value={sourceStatus} onChange={(e) => setSourceStatus(e.target.value as 'ALL' | CatalogCharacter['sourceStatus'])} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black">
            {sourceOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
          <button onClick={() => setView(view === 'matrix' ? 'cards' : 'matrix')} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">{view === 'matrix' ? '카드 보기' : '표 보기'}</button>
        </div>
      </div>

      {view === 'matrix' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div
            ref={scrollRef}
            className="max-h-[760px] overflow-auto"
            onScroll={(event) => {
              setScrollTop(event.currentTarget.scrollTop);
              setViewportHeight(event.currentTarget.clientHeight);
            }}
          >
            <table className="border-separate border-spacing-0 text-left" style={{ minWidth: tableMinWidth }}>
              <thead className="sticky top-0 z-10 bg-slate-950 text-white">
                <tr>
                  <th className="w-[360px] px-4 py-4 text-xs font-black">1열 캐릭터 / 속성 전체</th>
                  <th className="w-[440px] px-4 py-4 text-xs font-black">2열 아티팩트 / 효과 전문</th>
                  <th className="w-[380px] px-4 py-4 text-xs font-black">3열 선택 유니폼 효과</th>
                  {Array.from({ length: maxUniformColumns }, (_, index) => (
                    <th key={index} className="w-[166px] px-2 py-4 text-center text-xs font-black">{index + 4}열 유니폼</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topSpacer ? (
                  <tr aria-hidden="true">
                    <td colSpan={visibleColumnCount} style={{ height: topSpacer }} />
                  </tr>
                ) : null}
                {visibleRows.map((character) => {
                  const selectedUniformIndex = Math.min(selectedUniformByCharacter[character.id] ?? 0, character.uniforms.length - 1);
                  const selectedUniform = character.uniforms[selectedUniformIndex];
                  return (
                    <tr key={character.id} data-character-id={character.id} className="align-top hover:bg-purple-50/30" style={{ contentVisibility: 'auto', containIntrinsicSize: '360px' }}>
                      <td className="border-b border-slate-100 px-4 py-3">
                        <CharacterCell character={character} active={character.id === selectedId} onSelect={() => selectCharacter(character)} />
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3"><ArtifactCell character={character} /></td>
                      <td className="border-b border-slate-100 px-4 py-3"><SkillCell uniform={selectedUniform} /></td>
                      {Array.from({ length: maxUniformColumns }, (_, index) => (
                        <UniformColumnCell
                          key={`${character.id}-${index}`}
                          uniform={character.uniforms[index]}
                          active={index === selectedUniformIndex}
                          testId={`uniform-select-${character.id}-${index}`}
                          onClick={() => selectUniform(character.id, index)}
                        />
                      ))}
                    </tr>
                  );
                })}
                {bottomSpacer ? (
                  <tr aria-hidden="true">
                    <td colSpan={visibleColumnCount} style={{ height: bottomSpacer }} />
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dedupedFiltered.map((character) => {
            const selectedUniformIndex = Math.min(selectedUniformByCharacter[character.id] ?? 0, character.uniforms.length - 1);
            return (
              <article key={character.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <CharacterCell character={character} active={character.id === selectedId} onSelect={() => selectCharacter(character)} />
                <div className="mt-4"><ArtifactCell character={character} /></div>
                <div className="mt-4"><SkillCell uniform={character.uniforms[selectedUniformIndex]} /></div>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                  {character.uniforms.map((uniform, index) => (
                    <button key={uniform.name} type="button" data-testid={`uniform-card-${character.id}-${index}`} onClick={() => selectUniform(character.id, index)} className={`w-28 shrink-0 rounded-2xl border p-2 ${index === selectedUniformIndex ? 'border-purple-400 bg-purple-50' : 'border-slate-200 bg-white'}`}>
                      {uniform.imageUrl ? (
                        <Image src={uniform.imageUrl} alt={uniform.name} width={112} height={112} unoptimized onError={(e) => imageFallback(e, uniform.name)} className="aspect-square w-full rounded-xl object-cover" />
                      ) : (
                        <div className="grid aspect-square w-full place-items-center rounded-xl border border-slate-200 bg-slate-100 text-sm font-black text-slate-400">UNI</div>
                      )}
                      <p className="mt-2 line-clamp-2 text-[11px] font-black">{uniform.name}</p>
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
