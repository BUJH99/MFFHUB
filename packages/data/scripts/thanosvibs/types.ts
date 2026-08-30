export type CombatType = 'Combat' | 'Blast' | 'Speed' | 'Universal' | 'Unknown';
export type Side = 'Hero' | 'Villain' | 'Neutral' | 'Unknown';

export type SyncedUniform = {
  character: string;
  characterId: string;
  name: string;
  acquisition?: string;
  season?: string;
  cost?: string;
  releaseUpdate?: string;
  releaseDate?: string;
  portraitId?: string;
  portraitUrl?: string;
  imageUrl?: string;
  localImageUrl?: string;
  localImagePath?: string;
  sourceUrl: string;
};

export type SyncedArtifact = {
  character: string;
  characterId: string;
  name: string;
  exclusiveSkill?: string;
  pveScore?: string;
  pvpScore?: string;
  effects: string[];
  acquisition?: string;
  releaseUpdate?: string;
  imageUrl?: string;
  localImageUrl?: string;
  localImagePath?: string;
  sourceUrl: string;
};

export type SyncedComicCard = {
  id: string;
  name: string;
  cardType?: string;
  fixedStats: string[];
  optionStats: Record<string, string[]>;
  imageUrl?: string;
  localImageUrl?: string;
  localImagePath?: string;
  sourceUrl: string;
};

export type SyncedAllianceBattleCondition = {
  id: string;
  roundNo: number;
  mode: 'Normal' | 'Extreme' | 'Legend' | 'Infinite Challenge';
  content: 'AB' | 'ABX' | 'ABL' | 'Infinity Challenge';
  isResetDay: boolean;
  restrictions: string[];
  requiredType?: string;
  requiredAlignment?: string;
  requiredGender?: string;
  requiredTags: string[];
  cancelEffects: string[];
  sourceUrl: string;
  note?: string;
};

export type SyncedSupport = {
  character: string;
  characterId: string;
  portraitId?: string;
  uniform?: string;
  leadership: string[];
  passive: string[];
  uniformEffect: string[];
  artifactExclusiveSkill: string[];
  sourceUrl: string;
};

export type AppearanceAbilityKind = 'leader' | 'passive' | 'uniform_effect';

export type AppearanceAbilityCoverageStatus =
  | 'complete'
  | 'not_applicable'
  | 'missing'
  | 'needs_review';

export type SyncedAppearanceAbility = {
  id: string;
  portraitId: string;
  characterId: string;
  character: string;
  uniform?: string;
  baseCharacter: boolean;
  kind: AppearanceAbilityKind;
  sourceSkillType: string;
  skillId: string;
  skillName: string;
  cooldown?: number | string;
  target?: string;
  activation?: string;
  icon?: string;
  sortOrder: number;
  sourceUrl: string;
};

export type SyncedAppearanceAbilityEffect = {
  id: string;
  appearanceAbilityId: string;
  stageId: string;
  stageOrder: number;
  effectId: string;
  effectOrder: number;
  abilityCode?: string | number;
  effectName: string;
  description: string;
  duration?: string | number | boolean | null;
  tick?: string | number | boolean | null;
  persistent?: string | number | boolean | null;
  valueMetadata?: Record<string, unknown>;
};

export type SyncedAppearanceAbilityCoverage = {
  id: string;
  portraitId: string;
  characterId: string;
  character: string;
  uniform?: string;
  baseCharacter: boolean;
  kind: AppearanceAbilityKind;
  status: AppearanceAbilityCoverageStatus;
  abilityCount: number;
  effectCount: number;
  reason?: string;
  sourceUrl: string;
};

export type SyncedEffect = {
  character: string;
  characterId: string;
  portraitId?: string;
  uniform?: string;
  sourceKind: string;
  effectName: string;
  magnitude?: number;
  magnitudeText?: string;
  restrictionText?: string;
  rawText: string;
  sourceUrl: string;
};

export type AttributeRow = {
  character: string;
  characterId: string;
  uniform?: string;
  portraitId?: string;
  portraitUrl?: string;
  localPortraitUrl?: string;
  localPortraitPath?: string;
  combatType: CombatType;
  side: Side;
  gender?: string;
  species?: string;
  tags: string[];
  latestUniform: boolean;
  baseCharacter: boolean;
};

export type SyncedCharacter = {
  id: string;
  name: string;
  portraitUrl: string;
  localPortraitUrl?: string;
  localPortraitPath?: string;
  combatType: CombatType;
  side: Side;
  gender?: string;
  species?: string;
  tags: string[];
  source: string;
  sourceUrl: string;
};

export type SyncPayload = {
  syncedAt: string;
  source: string;
  pages: Record<string, string>;
  characters: SyncedCharacter[];
  uniforms: SyncedUniform[];
  artifacts: SyncedArtifact[];
  comicCards: SyncedComicCard[];
  allianceBattleConditions: SyncedAllianceBattleCondition[];
  supports: SyncedSupport[];
  characterEffects: SyncedEffect[];
  appearanceAbilities: SyncedAppearanceAbility[];
  appearanceAbilityEffects: SyncedAppearanceAbilityEffect[];
  appearanceAbilityCoverage: SyncedAppearanceAbilityCoverage[];
  attributes: AttributeRow[];
  assetStats?: {
    requested: number;
    downloaded: number;
    skipped: number;
    failed: number;
  };
  warnings: string[];
};
