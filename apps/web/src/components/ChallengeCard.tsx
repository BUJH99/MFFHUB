import Image from 'next/image';
import { getChallengeCancelIcons, getChallengeRestrictionIcons, type AllianceBattleIcon } from '@/lib/allianceBattle';
import type { ChallengeRule } from '@mff-data-hub/types';

function IconStrip({ icons, tone }: { icons: AllianceBattleIcon[]; tone: 'blue' | 'purple' | 'slate' }) {
  const shellClass =
    tone === 'blue'
      ? 'bg-blue-50 ring-blue-100'
      : tone === 'purple'
        ? 'bg-purple-50 ring-purple-100'
        : 'bg-slate-100 ring-slate-200';

  return (
    <div className="mt-2 flex min-h-10 flex-wrap items-center gap-2" aria-label={icons.map((icon) => icon.label).join(', ')}>
      {icons.map((icon) => (
        <span key={`${icon.kind}-${icon.key}`} className={`grid h-10 w-10 place-items-center rounded-xl p-1.5 ring-1 ${shellClass}`} title={icon.label}>
          <Image src={icon.src} alt={icon.label} width={32} height={32} unoptimized className="h-full w-full object-contain" />
        </span>
      ))}
    </div>
  );
}

export function ChallengeCard({ rule }: { rule: ChallengeRule }) {
  const icon = rule.content === 'ABX' ? '◎' : '✥';
  const tone = rule.content === 'ABX' ? 'blue' : 'purple';
  const restrictionIcons = getChallengeRestrictionIcons(rule);
  const cancelIcons = getChallengeCancelIcons(rule);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-3xl ${tone === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-700'} text-4xl font-black`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className={`text-2xl font-black ${tone === 'blue' ? 'text-blue-600' : 'text-purple-700'}`}>{rule.content}</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Round {rule.rotationRound ?? '-'}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{rule.mode ?? 'Mode'}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{rule.dayName}</span>
            {rule.isResetDay ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">2회 입장</span> : null}
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="font-black text-slate-500">요구 조건</p>
              <IconStrip icons={restrictionIcons} tone={tone} />
            </div>
            <div>
              <p className="font-black text-slate-500">효과 해제</p>
              <IconStrip icons={cancelIcons} tone="slate" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
