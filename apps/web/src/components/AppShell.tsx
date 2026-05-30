'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { AllianceBattleSection } from '@/components/sections/AllianceBattleSection';
import { AnalysisSection } from '@/components/sections/AnalysisSection';
import { DashboardSection } from '@/components/sections/DashboardSection';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/MobileNav';
import { PanelSkeleton } from '@/components/layout/PanelSkeleton';
import { PlaceholderSection } from '@/components/sections/PlaceholderSection';
import { RecordSection } from '@/components/sections/RecordSection';
import { Sidebar } from '@/components/Sidebar';
import { characters } from '@/lib/data';
import { getKstDateKey } from '@/lib/allianceBattle';
import type { Section } from '@/lib/navigation';

const DamageCalculator = dynamic(() => import('@/components/DamageCalculator').then((mod) => mod.DamageCalculator), {
  loading: () => <PanelSkeleton title="데미지 계산기" />,
});
const EnhancedCharacterDB = dynamic(() => import('@/components/EnhancedCharacterDB').then((mod) => mod.EnhancedCharacterDB), {
  loading: () => <PanelSkeleton title="캐릭터 DB" />,
});
const PvpModeSection = dynamic(() => import('@/components/sections/PvpModeSection').then((mod) => mod.PvpModeSection), {
  loading: () => <PanelSkeleton title="PVP 점수" />,
});
const WorldBossSection = dynamic(() => import('@/components/sections/WorldBossSection').then((mod) => mod.WorldBossSection), {
  loading: () => <PanelSkeleton title="월드보스" />,
});
const SeasonUniformSection = dynamic(() => import('@/components/sections/SeasonUniformSection').then((mod) => mod.SeasonUniformSection), {
  loading: () => <PanelSkeleton title="시즌 유니폼" />,
});
const TierListSection = dynamic(() => import('@/components/sections/TierListSection').then((mod) => mod.TierListSection), {
  loading: () => <PanelSkeleton title="티어리스트" />,
});

export function AppShell() {
  const [section, setSection] = useState<Section>('accountCards');
  const [selectedId, setSelectedId] = useState(characters[0].id);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const today = getKstDateKey();

  const selectCoreCharacter = (id: string) => {
    setSelectedId(id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex">
        <Sidebar section={section} setSection={setSection} mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
        <main className="min-w-0 flex-1 pb-24 xl:p-6 xl:pb-6">
          <Header section={section} today={today} onOpenMobileMenu={() => setMobileSidebarOpen(true)} />
          <div className="mx-auto mt-4 grid max-w-[1780px] gap-5 px-4 xl:px-0">
            <div className="min-w-0 space-y-5">
              {section === 'accountCards' ? <DashboardSection page="cards" /> : null}
              {section === 'accountXSwords' ? <DashboardSection page="xSwords" /> : null}
              {section === 'accountTeamUps' ? <DashboardSection page="teamUps" /> : null}
              {section === 'ctpInventory' ? <DashboardSection page="ctp" /> : null}
              {section === 'worldBoss' ? <WorldBossSection /> : null}
              {section === 'abx' ? <AllianceBattleSection content="ABX" today={today} /> : null}
              {section === 'abl' ? <AllianceBattleSection content="ABL" today={today} /> : null}
              {section === 'seasonUniforms' ? <SeasonUniformSection /> : null}
              {section === 'pveTier' ? <TierListSection mode="pve" /> : null}
              {section === 'teamBattleArena' ? <PvpModeSection content="Team Battle Arena" selectedId={selectedId} setSelectedId={selectCoreCharacter} /> : null}
              {section === 'otherworld' ? <PvpModeSection content="Otherworld" selectedId={selectedId} setSelectedId={selectCoreCharacter} /> : null}
              {section === 'timeline' ? <PvpModeSection content="Timeline Battle" selectedId={selectedId} setSelectedId={selectCoreCharacter} /> : null}
              {section === 'pvpTier' ? <TierListSection mode="pvp" /> : null}
              {section === 'db' ? <EnhancedCharacterDB selectedId={selectedId} onSelect={setSelectedId} /> : null}
              {section === 'myCharacters' ? <EnhancedCharacterDB mode="my" selectedId={selectedId} onSelect={setSelectedId} /> : null}
              {section === 'calculator' ? <DamageCalculator /> : null}
              {section === 'analysis' ? <AnalysisSection /> : null}
              {section === 'record' ? <RecordSection /> : null}
              {section === 'guide' ? <PlaceholderSection title="캐릭터 가이드" text="캐릭터별 회전, 추천 C.T.P, 아티팩트 우선도, 유니폼 변화, 보스별 코멘트를 관리하는 화면." /> : null}
            </div>
          </div>
        </main>
      </div>
      {mobileSidebarOpen ? null : <MobileNav setSection={setSection} />}
    </div>
  );
}
