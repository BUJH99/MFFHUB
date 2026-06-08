import type { Section } from '@/lib/navigation';

export function MobileNav({ setSection }: { setSection?: (section: Section) => void }) {
  const items: Array<[string, string, Section]> = [
    ['정보', '⌂', 'accountCards'],
    ['점수', '▤', 'userScores'],
    ['내캐릭', '▥', 'myCharacters'],
    ['DB', '▣', 'db'],
    ['게시판', '▧', 'board']
  ];
  return (
    <nav aria-label="모바일 주요 메뉴" className="mff-mobile-nav fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 grid grid-cols-5 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-soft backdrop-blur xl:hidden">
      {items.map(([label, icon, section]) => (
        <button type="button" key={label} onClick={() => setSection?.(section)} className="min-w-0 rounded-2xl px-1.5 py-2 text-center text-xs font-black text-slate-600 hover:bg-purple-50 hover:text-purple-700">
          <span className="block text-lg">{icon}</span>{label}
        </button>
      ))}
    </nav>
  );
}
