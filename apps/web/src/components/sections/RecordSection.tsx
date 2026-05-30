'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { characters } from '@/lib/data';
import { getKstDateKey } from '@/lib/allianceBattle';
import { pveWeeklyModes, type PveWeeklyContent } from '@/lib/scoreDisplay';

type ScoreRecord = {
  date: string;
  scores: Record<PveWeeklyContent, number>;
  combos: Record<PveWeeklyContent, string[]>;
};
type ComboPickerState = {
  recordDate: string;
  content: PveWeeklyContent;
  slotIndex: number;
} | null;

const recordScoreStorageKey = 'mff-data-hub:alliance-score-analysis:v1';
const emptyScores = (): Record<PveWeeklyContent, number> => ({
  ABX: 0,
  ABL: 0,
  'Infinity Challenge': 0,
});
const emptyCombos = (): Record<PveWeeklyContent, string[]> => ({
  ABX: ['', '', ''],
  ABL: ['', '', ''],
  'Infinity Challenge': ['', '', ''],
});
const characterById = new Map(characters.map((character) => [character.id, character]));

function normalizeRecord(value: Partial<ScoreRecord> | undefined, fallbackDate: string): ScoreRecord {
  const scores = emptyScores();
  const combos = emptyCombos();

  for (const mode of pveWeeklyModes) {
    const storedScore = value?.scores?.[mode.content];
    scores[mode.content] = Number.isFinite(Number(storedScore)) ? Math.max(0, Math.round(Number(storedScore))) : 0;
    const storedCombo = value?.combos?.[mode.content];
    combos[mode.content] = [0, 1, 2].map((index) => {
      const characterId = Array.isArray(storedCombo) ? storedCombo[index] : '';
      return characterId && characterById.has(characterId) ? characterId : '';
    });
  }

  return {
    date: /^\d{4}-\d{2}-\d{2}$/.test(value?.date ?? '') ? value!.date! : fallbackDate,
    scores,
    combos,
  };
}

function createRecord(date: string): ScoreRecord {
  return normalizeRecord({ date }, date);
}

function readStoredRecords(today: string) {
  if (typeof window === 'undefined') return [createRecord(today)];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(recordScoreStorageKey) ?? '[]') as Array<Partial<ScoreRecord>>;
    const normalized = parsed.map((record) => normalizeRecord(record, today));
    return normalized.length ? normalized : [createRecord(today)];
  } catch {
    return [createRecord(today)];
  }
}

function formatScore(value: number) {
  return Math.round(value).toLocaleString('ko-KR');
}

function recordTotal(record: ScoreRecord) {
  return pveWeeklyModes.reduce((sum, mode) => sum + record.scores[mode.content], 0);
}

function modeTotal(records: ScoreRecord[], content: PveWeeklyContent) {
  return records.reduce((sum, record) => sum + record.scores[content], 0);
}

function getCharacterLabel(characterId: string) {
  return characterById.get(characterId)?.name ?? '미선택';
}

function ComboIconSlots({
  record,
  content,
  onOpenPicker,
  onClearSlot,
}: {
  record: ScoreRecord;
  content: PveWeeklyContent;
  onOpenPicker: (slotIndex: number) => void;
  onClearSlot: (slotIndex: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5" data-testid={`record-combo-icons-${record.date}-${content}`}>
      {record.combos[content].map((characterId, slotIndex) => {
        const character = characterById.get(characterId);
        return (
          <button
            key={`${record.date}-${content}-${slotIndex}`}
            type="button"
            aria-label={`${record.date} ${content} 조합 ${slotIndex + 1}번 ${getCharacterLabel(characterId)}`}
            title={character ? `${character.name} 우클릭/다시 선택으로 변경` : '캐릭터 선택'}
            onClick={() => onOpenPicker(slotIndex)}
            onContextMenu={(event) => {
              event.preventDefault();
              onClearSlot(slotIndex);
            }}
            className={`grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border text-[11px] font-black transition ${character ? 'border-purple-200 bg-white shadow-sm hover:ring-2 hover:ring-purple-100' : 'border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-purple-300 hover:text-purple-600'}`}
          >
            {character ? (
              <Image src={character.portraitUrl} alt="" width={32} height={32} unoptimized className="h-full w-full object-cover" />
            ) : (
              '+'
            )}
          </button>
        );
      })}
    </div>
  );
}

function ComboPicker({
  picker,
  records,
  onSelect,
  onClose,
}: {
  picker: ComboPickerState;
  records: ScoreRecord[];
  onSelect: (characterId: string) => void;
  onClose: () => void;
}) {
  if (!picker) return null;

  const record = records.find((item) => item.date === picker.recordDate);
  const selectedIds = new Set(record?.combos[picker.content].filter(Boolean) ?? []);
  const sortedCharacters = [...characters].sort((left, right) => right.scores[picker.content] - left.scores[picker.content]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6" data-testid="record-combo-picker">
      <div className="max-h-[78vh] w-full max-w-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-xs font-black text-purple-600">{picker.recordDate}</p>
            <h3 className="text-sm font-black text-slate-950">{picker.content} 조합 {picker.slotIndex + 1}번</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-black text-slate-600 hover:bg-slate-50">닫기</button>
        </div>
        <div className="grid max-h-[62vh] grid-cols-[repeat(auto-fill,minmax(38px,1fr))] gap-2 overflow-y-auto overscroll-contain p-3">
          {sortedCharacters.map((character) => {
            const selected = selectedIds.has(character.id);
            return (
              <button
                key={`${picker.content}-${character.id}`}
                type="button"
                aria-label={`${character.name} 선택`}
                title={character.name}
                onClick={() => onSelect(character.id)}
                className={`grid h-10 w-10 place-items-center overflow-hidden rounded-full border bg-white transition hover:border-purple-300 hover:ring-2 hover:ring-purple-100 ${selected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-slate-200'}`}
              >
                <Image src={character.portraitUrl} alt="" width={40} height={40} unoptimized className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function RecordSection() {
  const today = getKstDateKey();
  const [records, setRecords] = useState<ScoreRecord[]>(() => [createRecord(today)]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [dateDraft, setDateDraft] = useState(today);
  const [picker, setPicker] = useState<ComboPickerState>(null);

  useEffect(() => {
    setRecords(readStoredRecords(today));
    setRecordsLoaded(true);
  }, [today]);

  useEffect(() => {
    if (!recordsLoaded || typeof window === 'undefined') return;
    window.localStorage.setItem(recordScoreStorageKey, JSON.stringify(records));
  }, [records, recordsLoaded]);

  const sortedRecords = useMemo(() => [...records].sort((left, right) => right.date.localeCompare(left.date)), [records]);
  const grandTotal = useMemo(() => records.reduce((sum, record) => sum + recordTotal(record), 0), [records]);
  const bestRecord = useMemo(() => sortedRecords.reduce<ScoreRecord | null>((best, record) => (!best || recordTotal(record) > recordTotal(best) ? record : best), null), [sortedRecords]);

  const addDateRecord = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateDraft)) return;
    setRecords((current) => {
      if (current.some((record) => record.date === dateDraft)) return current;
      return [...current, createRecord(dateDraft)];
    });
  };

  const updateScore = (date: string, content: PveWeeklyContent, value: string) => {
    const score = Math.max(0, Math.round(Number(value) || 0));
    setRecords((current) => current.map((record) => (
      record.date === date ? { ...record, scores: { ...record.scores, [content]: score } } : record
    )));
  };

  const updateComboSlot = (characterId: string) => {
    if (!picker) return;
    setRecords((current) => current.map((record) => {
      if (record.date !== picker.recordDate) return record;
      const combo = [...record.combos[picker.content]];
      combo[picker.slotIndex] = characterId;
      return { ...record, combos: { ...record.combos, [picker.content]: combo } };
    }));
    setPicker(null);
  };

  const clearComboSlot = (date: string, content: PveWeeklyContent, slotIndex: number) => {
    setRecords((current) => current.map((record) => {
      if (record.date !== date) return record;
      const combo = [...record.combos[content]];
      combo[slotIndex] = '';
      return { ...record, combos: { ...record.combos, [content]: combo } };
    }));
  };

  const removeRecord = (date: string) => {
    setRecords((current) => {
      const next = current.filter((record) => record.date !== date);
      return next.length ? next : [createRecord(today)];
    });
  };

  const resetRecords = () => {
    setRecords([createRecord(today)]);
    setDateDraft(today);
  };

  return (
    <section className="space-y-5" data-testid="my-record-score-log">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-purple-600">My Score Log</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">날짜별 점수 기록</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={dateDraft}
              onChange={(event) => setDateDraft(event.target.value)}
              aria-label="점수 기록 날짜"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800 outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
            />
            <button type="button" onClick={addDateRecord} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800">날짜 추가</button>
            <button type="button" onClick={resetRecords} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:border-purple-200 hover:text-purple-700">초기화</button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-xs font-black text-slate-300">총합</p>
            <p className="mt-2 text-2xl font-black">{formatScore(grandTotal)}</p>
          </div>
          {pveWeeklyModes.map((mode) => (
            <div key={`summary-${mode.content}`} className={`rounded-2xl p-4 ring-1 ${mode.accent}`}>
              <p className="text-xs font-black">{mode.label}</p>
              <p className="mt-2 text-2xl font-black">{formatScore(modeTotal(records, mode.content))}</p>
            </div>
          ))}
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-xs font-black text-slate-500">최고일</p>
            <p className="mt-2 text-lg font-black text-slate-950">{bestRecord ? bestRecord.date : '-'}</p>
            <p className="mt-1 text-sm font-black text-purple-700">{bestRecord ? formatScore(recordTotal(bestRecord)) : '0'}</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[116px_repeat(3,minmax(190px,1fr))_92px] bg-slate-950 text-xs font-black text-white">
          <div className="px-3 py-3">날짜</div>
          {pveWeeklyModes.map((mode) => <div key={`head-${mode.content}`} className="px-3 py-3">{mode.label}</div>)}
          <div className="px-3 py-3 text-right">합계</div>
        </div>
        <div className="divide-y divide-slate-100">
          {sortedRecords.map((record) => (
            <article key={record.date} className="grid grid-cols-[116px_repeat(3,minmax(190px,1fr))_92px] items-stretch bg-white">
              <div className="flex flex-col justify-between gap-2 border-r border-slate-100 px-3 py-3">
                <p className="text-sm font-black text-slate-950">{record.date}</p>
                <button type="button" onClick={() => removeRecord(record.date)} className="w-fit rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-black text-slate-500 hover:border-red-200 hover:text-red-600">삭제</button>
              </div>
              {pveWeeklyModes.map((mode) => (
                <div key={`${record.date}-${mode.content}`} className="border-r border-slate-100 px-3 py-3">
                  <label className="grid gap-2">
                    <span className="sr-only">{record.date} {mode.label} 점수</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={record.scores[mode.content] || ''}
                      onChange={(event) => updateScore(record.date, mode.content, event.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right text-sm font-black text-slate-950 outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
                    />
                  </label>
                  <div className="mt-2">
                    <ComboIconSlots
                      record={record}
                      content={mode.content}
                      onOpenPicker={(slotIndex) => setPicker({ recordDate: record.date, content: mode.content, slotIndex })}
                      onClearSlot={(slotIndex) => clearComboSlot(record.date, mode.content, slotIndex)}
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-end px-3 py-3 text-right text-lg font-black text-purple-700">{formatScore(recordTotal(record))}</div>
            </article>
          ))}
        </div>
      </section>

      <ComboPicker picker={picker} records={records} onSelect={updateComboSlot} onClose={() => setPicker(null)} />
    </section>
  );
}
