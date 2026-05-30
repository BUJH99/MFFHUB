'use client';

import dynamic from 'next/dynamic';
import { PanelSkeleton } from '@/components/layout/PanelSkeleton';
import type { AccountSpecPage } from '@/components/AccountInsights';

const CtpInventoryPanel = dynamic(() => import('@/components/CtpInventoryPanel').then((mod) => mod.CtpInventoryPanel), {
  loading: () => <PanelSkeleton title="CTP 현황" />,
});
const AccountSpecPanel = dynamic(() => import('@/components/AccountInsights').then((mod) => mod.AccountSpecPanel), {
  loading: () => <PanelSkeleton title="카드 · X-소드 · 팀업" />,
});

export function DashboardSection({ page }: { page: AccountSpecPage | 'ctp' }) {
  if (page === 'ctp') {
    return (
      <section className="space-y-5">
        <CtpInventoryPanel />
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <AccountSpecPanel page={page} />
    </section>
  );
}
