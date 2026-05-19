import { usageStats } from '@/lib/data';

export function UsageStats() {
  const max = Math.max(...usageStats.map(([, count]) => count));

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-black text-slate-950">월간 사용 통계 <span className="text-sm font-bold text-slate-500">(2026년 5월)</span></h2>
      <p className="mb-3 text-sm font-bold text-slate-500">사용 횟수 TOP 10</p>
      <div className="space-y-3">
        {usageStats.map(([name, count], index) => (
          <div key={name} className="grid grid-cols-[22px_1fr_130px_32px] items-center gap-3 text-sm">
            <span className="font-black text-slate-500">{index + 1}</span>
            <span className="truncate font-bold text-slate-800">{name}</span>
            <div className="h-2.5 rounded-full bg-slate-100">
              <div className="h-2.5 rounded-full bg-gradient-to-r from-red-500 via-purple-500 to-blue-500" style={{ width: `${(count / max) * 100}%` }} />
            </div>
            <span className="text-right font-black text-slate-700">{count}</span>
          </div>
        ))}
      </div>
      <button className="mt-8 w-full rounded-2xl border border-slate-200 py-3 font-black text-slate-700 hover:bg-slate-50">더보기 ›</button>
    </section>
  );
}
