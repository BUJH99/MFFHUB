import type { Section } from '@/lib/navigation';
import { getKoreanDayName } from '@/lib/allianceBattle';

const titles: Record<Section, string> = {
  dashboard: 'EXTREME',
  pveOverall: 'PVE OVERALL',
  worldBoss: 'WORLD BOSS',
  abx: 'ABX',
  abl: 'ABL',
  infinityChallenge: 'INFINITY CHALLENGE',
  pveTier: 'PVE TIER LIST',
  teamBattleArena: 'TEAM BATTLE ARENA',
  otherworld: 'OTHERWORLD',
  timeline: 'TIMELINE',
  pvpTier: 'PVP TIER LIST',
  custom: 'CUSTOM OPTIMIZER',
  db: 'CHARACTER DB',
  calculator: 'DAMAGE LAB',
  analysis: 'ANALYTICS',
  record: 'MY LOG',
  guide: 'GUIDE',
};

export function Header({ section, today }: { section: Section; today: string }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur xl:static xl:border-0 xl:bg-transparent xl:px-0">
      <div className="flex items-center gap-3 xl:hidden">
        <button className="rounded-xl border border-slate-200 p-2">☰</button>
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">✦</div>
          <p className="font-black">MFF DATA HUB</p>
        </div>
      </div>
      <div className="hidden items-center gap-5 xl:flex">
        <button className="rounded-2xl border border-slate-200 bg-white px-8 py-4 text-lg font-black shadow-sm">{today} ({getKoreanDayName(today)}) <span className="ml-5">▣</span></button>
        <h2 className="text-3xl font-black text-purple-700">{titles[section]}</h2>
      </div>
      <div className="flex items-center gap-3 text-xl text-slate-700">
        <button className="rounded-xl p-2 hover:bg-slate-100">☼</button>
        <button className="rounded-xl p-2 hover:bg-slate-100">⚙</button>
        <button className="rounded-xl p-2 hover:bg-slate-100">🔔</button>
        <button className="rounded-xl p-2 hover:bg-slate-100">♡</button>
      </div>
    </header>
  );
}
