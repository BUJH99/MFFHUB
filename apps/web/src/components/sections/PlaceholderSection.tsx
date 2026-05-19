export function PlaceholderSection({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-3xl font-black text-slate-950">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm font-bold leading-relaxed text-slate-500">{text}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {['데이터 입력', '필터/정렬', 'Supabase 연동'].map((item) => (
          <div key={item} className="rounded-3xl bg-slate-50 p-5">
            <p className="font-black text-purple-700">{item}</p>
            <p className="mt-2 text-sm font-bold text-slate-500">다음 단계 확장 슬롯. DB 스키마는 supabase/schema.sql에 반영됨.</p>
          </div>
        ))}
      </div>
    </section>
  );
}
