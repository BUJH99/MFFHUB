import { AllianceBattleSchedule } from '@/components/AllianceBattleSchedule';

type AllianceBattleSectionProps = {
  content: 'ABX' | 'ABL';
  today: string;
};

export function AllianceBattleSection({ content, today }: AllianceBattleSectionProps) {
  return (
    <section>
      <AllianceBattleSchedule today={today} content={content} />
    </section>
  );
}
