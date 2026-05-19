export function PanelSkeleton({ title }: { title: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-black text-slate-400">{title} 로딩 중</p>
      <div className="mt-4 grid gap-3">
        <div className="h-12 rounded-2xl bg-slate-100" />
        <div className="h-24 rounded-2xl bg-slate-100" />
      </div>
    </section>
  );
}
