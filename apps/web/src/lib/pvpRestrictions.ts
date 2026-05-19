'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { characters } from '@/lib/data';
import type { PvpScoreContent } from '@/lib/scoreDisplay';

export interface PvpRestrictionCharacter {
  id: string;
  name: string;
  kind: string;
  note: string;
  custom?: boolean;
}

type RestrictionStore = Partial<Record<PvpScoreContent, PvpRestrictionCharacter[]>>;

const storageKey = 'mff-data-hub:pvp-restrictions:v1';
const eventName = 'mff-data-hub:pvp-restrictions-updated';
const emptyRestrictions: PvpRestrictionCharacter[] = [];

const contentKind: Record<PvpScoreContent, string> = {
  Otherworld: 'custom-5pct',
  'Timeline Battle': 'custom-restricted',
  'Team Battle Arena': 'custom-banned',
};

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '');
}

function readStore(): RestrictionStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as RestrictionStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(next: RestrictionStore) {
  window.localStorage.setItem(storageKey, JSON.stringify(next));
  window.dispatchEvent(new Event(eventName));
}

export function findRestrictionCharacter(value: string, content: PvpScoreContent): PvpRestrictionCharacter | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const key = normalize(trimmed);
  const character = characters.find((item) => [item.id, item.name, item.slug].map(normalize).includes(key));

  return {
    id: character?.id ?? `custom-${key}`,
    name: character?.name ?? trimmed,
    kind: contentKind[content],
    note: character ? '로컬 캐릭터 DB 매칭' : '사용자 직접 입력',
    custom: true,
  };
}

function mergeRestrictions(defaults: readonly PvpRestrictionCharacter[], custom: readonly PvpRestrictionCharacter[]) {
  const seen = new Set<string>();
  return [...defaults, ...custom].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function usePvpRestrictionOverrides(content: PvpScoreContent, defaults: readonly PvpRestrictionCharacter[] = []) {
  const [store, setStore] = useState<RestrictionStore>({});

  useEffect(() => {
    const sync = () => setStore(readStore());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(eventName, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(eventName, sync);
    };
  }, []);

  const customRestrictions = store[content] ?? emptyRestrictions;
  const restrictions = useMemo(() => mergeRestrictions(defaults, customRestrictions), [customRestrictions, defaults]);
  const restrictedIds = useMemo(() => new Set<string>(restrictions.map((item) => item.id)), [restrictions]);

  const addRestriction = useCallback((value: string) => {
    const restriction = findRestrictionCharacter(value, content);
    if (!restriction) return false;

    const nextStore = readStore();
    const current = nextStore[content] ?? [];
    if (current.some((item) => item.id === restriction.id)) return false;

    nextStore[content] = [...current, restriction];
    writeStore(nextStore);
    return true;
  }, [content]);

  const removeRestriction = useCallback((id: string) => {
    const nextStore = readStore();
    nextStore[content] = (nextStore[content] ?? []).filter((item) => item.id !== id);
    writeStore(nextStore);
  }, [content]);

  const clearRestrictions = useCallback(() => {
    const nextStore = readStore();
    nextStore[content] = [];
    writeStore(nextStore);
  }, [content]);

  return { restrictions, customRestrictions, restrictedIds, addRestriction, removeRestriction, clearRestrictions };
}
