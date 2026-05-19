import type { Character } from '@mff-data-hub/types';

export type ScoreGrade = 'SS' | 'S+' | 'S' | 'A+' | 'A' | 'B';
export type PvpScoreContent = 'Team Battle Arena' | 'Otherworld' | 'Timeline Battle';
export type PveWeeklyContent = 'ABX' | 'ABL' | 'Infinity Challenge';

export const pveWeeklyModes: Array<{ content: PveWeeklyContent; label: string; shortLabel: string; accent: string }> = [
  { content: 'ABX', label: 'ABX', shortLabel: 'ABX', accent: 'bg-orange-50 text-orange-700 ring-orange-100' },
  { content: 'ABL', label: 'ABL', shortLabel: 'ABL', accent: 'bg-purple-50 text-purple-700 ring-purple-100' },
  { content: 'Infinity Challenge', label: '인피니티 챌린지', shortLabel: 'IC', accent: 'bg-blue-50 text-blue-700 ring-blue-100' },
];

export const pvpScoreModes: Array<{ content: PvpScoreContent; label: string; shortLabel: string; accent: string }> = [
  { content: 'Otherworld', label: '아더월드', shortLabel: 'OW', accent: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100' },
  { content: 'Timeline Battle', label: '타임라인', shortLabel: 'TL', accent: 'bg-red-50 text-red-700 ring-red-100' },
  { content: 'Team Battle Arena', label: '팀 배틀 아레나', shortLabel: 'TBA', accent: 'bg-amber-50 text-amber-700 ring-amber-100' },
];

export function gradeForScore(score: number): ScoreGrade {
  if (score >= 95) return 'SS';
  if (score >= 90) return 'S+';
  if (score >= 85) return 'S';
  if (score >= 80) return 'A+';
  if (score >= 70) return 'A';
  return 'B';
}

export function averageDeckScore(members: Character[], content: PvpScoreContent) {
  if (!members.length) return 0;
  const total = members.reduce((sum, member) => sum + member.scores[content], 0);
  return Math.round((total / members.length) * 10) / 10;
}
