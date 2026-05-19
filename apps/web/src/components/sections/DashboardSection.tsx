'use client';

import dynamic from 'next/dynamic';
import { PanelSkeleton } from '@/components/layout/PanelSkeleton';
import { Rankings } from '@/components/Rankings';
import { UsageStats } from '@/components/UsageStats';
import { characters } from '@/lib/data';

const CtpInventoryPanel = dynamic(() => import('@/components/CtpInventoryPanel').then((mod) => mod.CtpInventoryPanel), {
  loading: () => <PanelSkeleton title="CTP 현황" />,
});
const AccountSpecPanel = dynamic(() => import('@/components/AccountInsights').then((mod) => mod.AccountSpecPanel), {
  loading: () => <PanelSkeleton title="카드 · X-소드 · 팀업" />,
});

export function DashboardSection() {
  return (
    <section className="space-y-5">
      <AccountSpecPanel />

      <CtpInventoryPanel />

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.3fr]">
        <UsageStats />
        <Rankings characters={characters} />
      </div>
    </section>
  );
}
