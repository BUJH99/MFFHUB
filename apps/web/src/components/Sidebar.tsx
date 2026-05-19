import { account } from '@/lib/data';
import type { Section } from '@/lib/navigation';

const pveItems = ['PVE Overall', 'World Boss', 'ABL', 'ABX', 'Infinity Challenge', '티어리스트'];
const pvpItems = ['Team Battle Arena', '아더월드', '타임라인', '티어리스트'];
const pveSections: Record<string, Section> = {
  'PVE Overall': 'pveOverall',
  'World Boss': 'worldBoss',
  ABL: 'abl',
  ABX: 'abx',
  'Infinity Challenge': 'infinityChallenge',
  티어리스트: 'pveTier',
};
const pvpSections: Record<string, Section> = {
  'Team Battle Arena': 'teamBattleArena',
  아더월드: 'otherworld',
  타임라인: 'timeline',
  티어리스트: 'pvpTier',
};

function NavItem({ icon, label, active, sub, onClick, badge }: { icon: string; label: string; active?: boolean; sub?: string; badge?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${active ? 'bg-purple-50 text-hub-purple ring-1 ring-purple-200' : 'text-slate-700 hover:bg-slate-50'}`}>
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-tight">{label}</p>
        {sub ? <p className="truncate text-xs text-slate-500">{sub}</p> : null}
      </div>
      {badge ? <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-black text-white">{badge}</span> : null}
    </button>
  );
}

export function Sidebar({ section, setSection }: { section: Section; setSection: (section: Section) => void }) {
  return (
    <aside className="hidden h-screen w-[306px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-5 py-6 xl:block">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg">✦</div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-950">MFF DATA HUB</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-slate-500">Marvel Future Fight</p>
        </div>
      </div>

      <section className="mb-5 rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-black text-slate-950">계정 정보</p>
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-950 text-white ring-4 ring-white">⚔</div>
          <div className="flex-1">
            <p className="text-sm font-black">{account.agentName}</p>
            <p className="text-xs text-slate-500">Agent Lv.{account.agentLevel} · 계정공 {account.accountAttack ?? account.cardAttack}%</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${Math.min(account.pierce * 4, 100)}%` }} />
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <span className="rounded-xl bg-purple-600 px-2 py-2 font-black text-white">VIP {account.vip}</span>
          <span className="rounded-xl bg-blue-50 px-2 py-2 font-black text-blue-700">피어스 {account.pierce}%</span>
          <span className="rounded-xl bg-slate-100 px-2 py-2 font-black text-slate-700">{account.maxCharacters}명</span>
        </div>
      </section>

      <nav className="space-y-1 text-sm">
        <NavItem icon="👤" label="캐릭터 정보" active={section === 'dashboard'} onClick={() => setSection('dashboard')} />
        <div className="pt-3">
          <div className="mb-2 flex items-center justify-between rounded-2xl px-3 py-2 font-black text-hub-purple">
            <span className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-600 text-white">✦</span>PVE</span><span>⌄</span>
          </div>
          <div className="ml-8 space-y-1 border-l border-slate-200 pl-3">
            {pveItems.map((item) => {
              const targetSection = pveSections[item];
              const active = section === targetSection && targetSection !== 'dashboard';
              return (
                <button
                  key={item}
                  onClick={() => setSection(targetSection)}
                  className={`block w-full rounded-xl px-2 py-2 text-left ${active ? 'bg-purple-50 font-black text-hub-purple' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
        <div className="pt-3">
          <div className="mb-2 flex items-center justify-between rounded-2xl px-3 py-2 font-black text-red-500">
            <span className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-red-500 text-white">×</span>PVP</span><span>›</span>
          </div>
          <div className="ml-8 space-y-1 border-l border-slate-200 pl-3">
            {pvpItems.map((item) => {
              const targetSection = pvpSections[item];
              const active = section === targetSection;
              return (
                <button
                  key={item}
                  onClick={() => setSection(targetSection)}
                  className={`block w-full rounded-xl px-2 py-2 text-left ${active ? 'bg-red-50 font-black text-red-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
        <div className="my-3 h-px bg-slate-100" />
        <NavItem icon="📊" label="통계 / 분석" active={section === 'analysis'} onClick={() => setSection('analysis')} />
        <NavItem icon="📋" label="내 기록" active={section === 'record'} onClick={() => setSection('record')} />
        <NavItem icon="📖" label="캐릭터 가이드" active={section === 'guide'} onClick={() => setSection('guide')} />
        <NavItem icon="🧬" label="커스텀 조합 추천" sub="계정 기반 ABX / ABL 최적 조합" badge="NEW" active={section === 'custom'} onClick={() => setSection('custom')} />
        <NavItem icon="▣" label="캐릭터 DB" sub="캐릭터명, 유니폼, 아티팩트, 버프" active={section === 'db'} onClick={() => setSection('db')} />
        <NavItem icon="🧮" label="계산기" sub="버프/디버프, 데미지 효과 계산" active={section === 'calculator'} onClick={() => setSection('calculator')} />
      </nav>
    </aside>
  );
}
