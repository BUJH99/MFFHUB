import Image from 'next/image';
import { CheckCircle2, CircleDashed, Database, FlaskConical } from 'lucide-react';
import { getAllianceAttributeIcon, type AllianceBattleIcon } from '@/lib/allianceBattle';

type Tone = 'slate' | 'purple' | 'blue' | 'green' | 'red' | 'amber';
type Size = 'sm' | 'md';

const toneClasses: Record<Tone, string> = {
  slate: 'border-slate-200 bg-slate-100 text-slate-700',
  purple: 'border-purple-200 bg-purple-50 text-purple-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  red: 'border-rose-200 bg-rose-50 text-rose-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-7 min-w-7 rounded-lg p-1',
  md: 'h-8 min-w-8 rounded-xl p-1.5',
};

const hiddenTags = new Set(['artifact-data', 'uniform-data', 'sync-needed']);

function cleanTag(tag: string) {
  if (tag.startsWith('Source:')) return undefined;
  if (hiddenTags.has(tag)) return undefined;
  if (tag.startsWith('Gender:')) return tag.replace('Gender:', '');
  if (tag.startsWith('Species:')) return tag.replace('Species:', '');
  return tag;
}

function IconBadge({ icon, tone, size }: { icon: AllianceBattleIcon; tone: Tone; size: Size }) {
  return (
    <span className={`inline-grid place-items-center border ${sizeClasses[size]} ${toneClasses[tone]}`} title={icon.label} aria-label={icon.label}>
      <Image src={icon.src} alt={icon.label} width={24} height={24} unoptimized className="h-full w-full object-contain" />
    </span>
  );
}

export function AttributeBadge({
  value,
  tone = 'slate',
  size = 'md',
  fallback = true,
}: {
  value?: string;
  tone?: Tone;
  size?: Size;
  fallback?: boolean;
}) {
  const cleaned = value ? cleanTag(value) : undefined;
  if (!cleaned || cleaned === 'Other' || cleaned === 'Unknown') return null;

  const icon = getAllianceAttributeIcon(cleaned);
  if (icon) return <IconBadge icon={icon} tone={tone} size={size} />;
  if (!fallback) return null;

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${toneClasses[tone]}`}>{cleaned}</span>;
}

export function CharacterTagBadges({ tags, emptyLabel = '속성 미등록' }: { tags: string[]; emptyLabel?: string }) {
  const visible = tags.map(cleanTag).filter(Boolean) as string[];

  if (!visible.length) {
    return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${toneClasses.slate}`}>{emptyLabel}</span>;
  }

  return visible.map((tag, index) => <AttributeBadge key={`${tag}-${index}`} value={tag} tone="slate" size="sm" />);
}

export function SourceStatusBadge({ status }: { status?: 'synced' | 'manual' | 'placeholder' }) {
  const Icon = status === 'synced' ? CheckCircle2 : status === 'manual' ? Database : status === 'placeholder' ? FlaskConical : CircleDashed;
  const tone = status === 'synced' ? 'green' : status === 'manual' ? 'blue' : 'amber';
  const label = status === 'synced' ? '동기화 완료' : status === 'manual' ? '수동 보강' : 'placeholder';

  return (
    <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-xl border px-2 ${toneClasses[tone]}`} title={label} aria-label={label}>
      <Icon size={16} aria-hidden="true" />
    </span>
  );
}
