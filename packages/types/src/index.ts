export type ContentType =
  | 'PVE Overall'
  | 'ABX'
  | 'ABL'
  | 'World Boss'
  | 'Infinity Challenge'
  | 'Team Battle Arena'
  | 'Otherworld'
  | 'Timeline Battle'
  | 'PVP';

export type PveOptimizerContent = 'ABX' | 'ABL' | 'Infinity Challenge' | 'World Boss';

export type Role = 'dealer' | 'leader' | 'support' | 'striker' | 'pvp-anchor' | 'hybrid';
export type CombatType = 'Combat' | 'Blast' | 'Speed' | 'Universal';
export type Alignment = 'Hero' | 'Villain' | 'Neutral';
export type Gender = 'Male' | 'Female' | 'Other';
export type BuildTier = 'T2' | 'T3' | 'T4' | 'Awakened' | 'Native T2' | 'Native T3' | 'Native T4';
export type UniformRank = 'None' | 'Normal' | 'Advanced' | 'Rare' | 'Heroic' | 'Legendary' | 'Mythic';
export type ProcFriendliness = 'Proc' | 'Rage' | 'Flexible' | 'Manual' | 'PVP';

export interface Uniform {
  id: string;
  name: string;
  season?: string;
  changesType?: CombatType;
  tags: string[];
  pveScoreDelta?: number;
  pvpScoreDelta?: number;
  note: string;
}

export interface ArtifactInfo {
  name: string;
  effect: string;
  pveScore: number;
  pvpScore: number;
}

export interface BuffEffect {
  stat:
    | 'All Basic Attacks'
    | 'Physical Attack'
    | 'Energy Attack'
    | 'Basic Damage Dealt to Villains'
    | 'Basic Damage Dealt to Heroes'
    | 'Basic Damage Dealt to Boss Types'
    | 'Ignore Dodge'
    | 'Chain Hit Damage'
    | 'Elemental Damage'
    | 'All Debuffs Effect'
    | 'HP'
    | 'Remove Debuff';
  magnitude: number;
  appliesTo: 'all' | 'heroes' | 'villains' | 'leadership' | 'self' | 'elemental' | 'boss';
  source: 'Leadership' | 'Tier-2 Passive' | 'Uniform Effect' | '4★ Passive' | 'Artifact' | 'Team Passive';
  note?: string;
}

export interface ModeScores {
  ABX: number;
  ABL: number;
  'World Boss': number;
  'Infinity Challenge': number;
  'Team Battle Arena': number;
  Otherworld: number;
  'Timeline Battle': number;
}

export interface Character {
  id: string;
  name: string;
  slug: string;
  portraitUrl: string;
  type: CombatType;
  alignment: Alignment;
  gender: Gender;
  species: string;
  roles: Role[];
  tier: BuildTier;
  nativeTier?: BuildTier;
  instinct: 'Justice' | 'Order' | 'Cruelty' | 'Destruction';
  acquisition: 'Free' | 'Premium' | 'Crystalwall' | 'Epic Quest' | 'Native' | 'Seasonal' | 'Event';
  tags: string[];
  uniforms: Uniform[];
  artifact: ArtifactInfo;
  ctpRecommendations: string[];
  procFriendly: ProcFriendliness;
  scores: ModeScores;
  buffs: BuffEffect[];
  rotations: {
    pve?: string;
    pvp?: string;
    note?: string;
  };
  buildNotes: string[];
  sourceHint?: string;
}

export interface UserCharacter {
  characterId: string;
  owned: boolean;
  favorite?: boolean;
  level: number;
  tier: BuildTier | string;
  uniformOwned: boolean;
  uniformId?: string;
  uniformRank: UniformRank;
  artifactStars: number;
  ctp?: string;
  buildQuality: number;
  skillCooldown: number;
  ignoreDefense: number;
  criticalDamage: number;
  notes?: string;
}

export interface UserAccount {
  agentName: string;
  agentLevel: number;
  vip: number;
  cardAttack: number;
  accountAttack?: number;
  swordAttack?: number;
  teamUpAttack?: number;
  teamUpAttackBonusByCharacter?: Record<string, number>;
  pierce: number;
  cardPierce?: number;
  swordMasteryLevel?: number;
  teamUpCollections?: number;
  maxCharacters: number;
  updatedAt: string;
}

export interface ChallengeRule {
  id: string;
  date: string;
  content: 'ABX' | 'ABL';
  label: string;
  dayName: string;
  rotationRound?: number;
  mode?: 'Extreme' | 'Legend';
  recommendedType: CombatType | 'Any';
  requiredAlignment?: Alignment | 'Any';
  requiredGender?: Gender | 'Any';
  requiredTags: string[];
  bonusTags: string[];
  bannedTags: string[];
  scoringFocus: string[];
  cancelEffects?: string[];
  isResetDay?: boolean;
  sourceUrl?: string;
  note: string;
}

export interface CustomOptimizerInput {
  content: PveOptimizerContent;
  type: CombatType | 'Any';
  alignment: Alignment | 'Any';
  gender: Gender | 'Any';
  tags: string[];
  accountOnly: boolean;
  requireUniform: boolean;
  preferSafeRotation: boolean;
}

export interface ScoreBreakdown {
  base: number;
  condition: number;
  account: number;
  gear: number;
  leadership: number;
  support: number;
  penalty: number;
  total: number;
}

export interface TeamRecommendation {
  dealer: Character;
  leader: Character | null;
  support1: Character | null;
  support2: Character | null;
  score: number;
  grade: 'SS' | 'S+' | 'S' | 'A+' | 'A' | 'B';
  breakdown: ScoreBreakdown;
  reasons: string[];
  upgradeHints: string[];
}

export interface DamageCalculatorInput {
  baseAttack: number;
  cardAttack: number;
  pierce: number;
  leadershipAttack: number;
  supportDamageVillain: number;
  supportDamageHero: number;
  bossDamage: number;
  chainHit: number;
  elementalDamage: number;
  procMultiplier: number;
  critDamage: number;
}
