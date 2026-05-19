'use client';

import { Rankings } from '@/components/Rankings';
import { UsageStats } from '@/components/UsageStats';
import { characters } from '@/lib/data';

export function AnalysisSection() {
  return (
    <section className="space-y-5">
      <UsageStats />
      <Rankings characters={characters} />
    </section>
  );
}
