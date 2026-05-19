import { sourceLinks } from '@/lib/data';

export function SourcePanel() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">참고 자료</h2>
      <p className="mt-1 text-sm font-bold text-slate-500">캐릭터 DB, 티어, 리더/서포트, 아티팩트, 카드 계산기 보강에 쓰는 자료 모음.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {sourceLinks.map((source) => (
          <a key={source.href} href={source.href} target="_blank" className="rounded-3xl border border-slate-200 p-4 hover:border-purple-300 hover:bg-purple-50">
            <p className="font-black text-purple-700">{source.label}</p>
            <p className="mt-2 text-xs font-bold leading-relaxed text-slate-500">{source.note}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
