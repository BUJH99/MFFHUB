import type { Section } from '@/lib/navigation';

export function MobileNav({ setSection }: { setSection?: (section: Section) => void }) {
  const items: Array<[string, string, Section]> = [
    ['홈', '⌂', 'dashboard'],
    ['추천', '✦', 'custom'],
    ['기록', '▤', 'record'],
    ['계산기', '▧', 'calculator'],
    ['DB', '▣', 'db']
  ];
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-soft backdrop-blur xl:hidden">
      {items.map(([label, icon, section]) => (
        <button key={label} onClick={() => setSection?.(section)} className="rounded-2xl px-2 py-2 text-center text-xs font-black text-slate-600 hover:bg-purple-50 hover:text-purple-700">
          <span className="block text-lg">{icon}</span>{label}
        </button>
      ))}
    </nav>
  );
}
