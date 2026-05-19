'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { AllianceBattleSection } from '@/components/sections/AllianceBattleSection';
import { AnalysisSection } from '@/components/sections/AnalysisSection';
import { DashboardSection } from '@/components/sections/DashboardSection';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/MobileNav';
import { PanelSkeleton } from '@/components/layout/PanelSkeleton';
import { PlaceholderSection } from '@/components/sections/PlaceholderSection';
import { Sidebar } from '@/components/Sidebar';
import { characters, userRoster } from '@/lib/data';
import { getKstDateKey } from '@/lib/allianceBattle';
import type { Section } from '@/lib/navigation';
import { createRosterLookup } from '@mff-data-hub/core';

const CustomOptimizer = dynamic(() => import('@/components/CustomOptimizer').then((mod) => mod.CustomOptimizer), {
  loading: () => <PanelSkeleton title="조합 추천" />,
});
const DamageCalculator = dynamic(() => import('@/components/DamageCalculator').then((mod) => mod.DamageCalculator), {
  loading: () => <PanelSkeleton title="데미지 계산기" />,
});
const EnhancedCharacterDB = dynamic(() => import('@/components/EnhancedCharacterDB').then((mod) => mod.EnhancedCharacterDB), {
  loading: () => <PanelSkeleton title="캐릭터 DB" />,
});
const InfinityChallengeSection = dynamic(() => import('@/components/sections/InfinityChallengeSection').then((mod) => mod.InfinityChallengeSection), {
  loading: () => <PanelSkeleton title="인피니티 챌린지" />,
});
const PveOverallSection = dynamic(() => import('@/components/sections/PveOverallSection').then((mod) => mod.PveOverallSection), {
  loading: () => <PanelSkeleton title="PVE 종합" />,
});
const PvpModeSection = dynamic(() => import('@/components/sections/PvpModeSection').then((mod) => mod.PvpModeSection), {
  loading: () => <PanelSkeleton title="PVP 점수" />,
});
const WorldBossSection = dynamic(() => import('@/components/sections/WorldBossSection').then((mod) => mod.WorldBossSection), {
  loading: () => <PanelSkeleton title="월드보스" />,
});

export function AppShell() {
  const [section, setSection] = useState<Section>('dashboard');
  const [selectedId, setSelectedId] = useState(characters[0].id);
  const rosterLookup = useMemo(() => createRosterLookup(userRoster), []);
  const today = getKstDateKey();

  const selectCoreCharacter = (id: string) => {
    setSelectedId(id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex">
        <Sidebar section={section} setSection={setSection} />
        <main className="min-w-0 flex-1 pb-24 xl:p-6 xl:pb-6">
          <Header section={section} today={today} />
          <div className="mx-auto mt-4 grid max-w-[1780px] gap-5 px-4 xl:px-0">
            <div className="min-w-0 space-y-5">
              {section === 'dashboard' ? <DashboardSection /> : null}
              {section === 'pveOverall' ? <PveOverallSection selectedId={selectedId} setSelectedId={selectCoreCharacter} rosterLookup={rosterLookup} /> : null}
              {section === 'worldBoss' ? <WorldBossSection /> : null}
              {section === 'abx' ? <AllianceBattleSection content="ABX" today={today} /> : null}
              {section === 'abl' ? <AllianceBattleSection content="ABL" today={today} /> : null}
              {section === 'infinityChallenge' ? <InfinityChallengeSection /> : null}
              {section === 'pveTier' ? <PlaceholderSection title="PVE 티어리스트" text="PVE Overall, World Boss, ABX, ABL, Infinity Challenge 기준으로 내 계정 보정과 공용 티어를 분리해서 보여주는 화면." /> : null}
              {section === 'teamBattleArena' ? <PvpModeSection content="Team Battle Arena" selectedId={selectedId} setSelectedId={selectCoreCharacter} rosterLookup={rosterLookup} /> : null}
              {section === 'otherworld' ? <PvpModeSection content="Otherworld" selectedId={selectedId} setSelectedId={selectCoreCharacter} rosterLookup={rosterLookup} /> : null}
              {section === 'timeline' ? <PvpModeSection content="Timeline Battle" selectedId={selectedId} setSelectedId={selectCoreCharacter} rosterLookup={rosterLookup} /> : null}
              {section === 'pvpTier' ? <PlaceholderSection title="PVP 티어리스트" text="타임라인, 아더월드, 팀 배틀 아레나 기준으로 제한 캐릭터와 덱 구성을 분리해서 보여주는 화면." /> : null}
              {section === 'custom' ? <CustomOptimizer /> : null}
              {section === 'db' ? <EnhancedCharacterDB selectedId={selectedId} onSelect={setSelectedId} /> : null}
              {section === 'calculator' ? <DamageCalculator /> : null}
              {section === 'analysis' ? <AnalysisSection /> : null}
              {section === 'record' ? <PlaceholderSection title="내 기록" text="일자별 ABX/ABL/PVE/PVP 사용 기록, 점수, 실패 원인, 사용 캐릭 잠금 상태를 저장하는 화면. Supabase usage_logs 테이블과 연결 예정." /> : null}
              {section === 'guide' ? <PlaceholderSection title="캐릭터 가이드" text="캐릭터별 회전, 추천 C.T.P, 아티팩트 우선도, 유니폼 변화, 보스별 코멘트를 관리하는 화면." /> : null}
            </div>
          </div>
        </main>
      </div>
      <MobileNav setSection={setSection} />
    </div>
  );
}
