import { pgSchema, pgTable, text, uuid, timestamp, boolean, integer, jsonb, numeric, primaryKey, unique, date, index } from 'drizzle-orm/pg-core';

export const authSchema = pgSchema('auth');

export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

export const appProfiles = pgTable('app_profiles', {
  userId: uuid('user_id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  loginId: text('login_id').notNull().unique(),
  nickname: text('nickname').notNull(),
  role: text('role').notNull().default('user'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  loginIdx: index('app_profiles_login_id_idx').on(t.loginId),
  roleIdx: index('app_profiles_role_idx').on(t.role),
}));

export const characters = pgTable('characters', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  portraitUrl: text('portrait_url'),
  portraitLocalUrl: text('portrait_local_url'),
  combatType: text('combat_type').default('Unknown'),
  side: text('side').default('Unknown'),
  gender: text('gender'),
  species: text('species'),
  tags: text('tags').array().default([]),
  source: text('source').default('manual'),
  sourceUrl: text('source_url'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const uniforms = pgTable('uniforms', {
  id: uuid('id').defaultRandom().primaryKey(),
  characterId: text('character_id').references(() => characters.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  acquisition: text('acquisition'),
  season: text('season'),
  cost: text('cost'),
  releaseUpdate: text('release_update'),
  releaseDate: text('release_date'),
  imageUrl: text('image_url'),
  imageLocalUrl: text('image_local_url'),
  sourceUrl: text('source_url').default('https://thanosvibs.money/uniforms'),
}, (t) => ({ uniq: unique().on(t.characterId, t.name) }));

export const artifacts = pgTable('artifacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  characterId: text('character_id').references(() => characters.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  exclusiveSkill: text('exclusive_skill'),
  pveScore: text('pve_score'),
  pvpScore: text('pvp_score'),
  effects: jsonb('effects').default([]),
  acquisition: text('acquisition'),
  releaseUpdate: text('release_update'),
  imageUrl: text('image_url'),
  imageLocalUrl: text('image_local_url'),
  sourceUrl: text('source_url').default('https://thanosvibs.money/artifacts'),
}, (t) => ({ uniq: unique().on(t.characterId) }));

export const comicCards = pgTable('comic_cards', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  cardType: text('card_type').default('Unknown'),
  fixedStats: text('fixed_stats').array().default([]),
  optionStats: jsonb('option_stats').default({}),
  imageUrl: text('image_url'),
  imageLocalUrl: text('image_local_url'),
  sourceUrl: text('source_url').default('https://thanosvibs.money/cards'),
  note: text('note'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const userComicCards = pgTable('user_comic_cards', {
  userId: uuid('user_id').notNull().references(() => appProfiles.userId, { onDelete: 'cascade' }),
  slot: integer('slot').notNull(),
  cardId: text('card_id').references(() => comicCards.id, { onDelete: 'set null' }),
  quality: integer('quality'),
  craftedStars: integer('crafted_stars'),
  blueStars: integer('blue_stars'),
  pierce: numeric('pierce'),
  attackContribution: numeric('attack_contribution'),
  selectedOptions: text('selected_options').array().default([]),
  stats: jsonb('stats').default({}),
  priority: text('priority'),
  memo: text('memo'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.slot] }) }));

export const xSwordElements = pgTable('x_sword_elements', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  koreanName: text('korean_name'),
  colorName: text('color_name'),
  statKey: text('stat_key').notNull(),
  statLabel: text('stat_label').notNull(),
  levelValues: jsonb('level_values').default([]),
  imageUrl: text('image_url'),
  imageLocalUrl: text('image_local_url'),
  sourceUrl: text('source_url').default('https://thanosvibs.money/dailybuggle/script_guide_swords'),
});

export const userXSwords = pgTable('user_x_swords', {
  userId: uuid('user_id').notNull().references(() => appProfiles.userId, { onDelete: 'cascade' }),
  slot: integer('slot').notNull(),
  elementId: text('element_id').references(() => xSwordElements.id, { onDelete: 'set null' }),
  level: integer('level').default(0),
  runes: text('runes').array().default([]),
  optionStats: jsonb('option_stats').default({}),
  quality: text('quality'),
  memo: text('memo'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.slot] }) }));

export const teamUpCollections = pgTable('team_up_collections', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  targetHeroIds: text('target_hero_ids').array().default([]),
  targetHeroes: text('target_heroes').array().default([]),
  iconImageUrl: text('icon_image_url'),
  sourceUrl: text('source_url').default('https://future-fight.fandom.com/wiki/Team-Up_Collection'),
  recommendedOptions: text('recommended_options').array().default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const userTeamUpCollections = pgTable('user_team_up_collections', {
  userId: uuid('user_id').notNull().references(() => appProfiles.userId, { onDelete: 'cascade' }),
  themeId: text('theme_id').references(() => teamUpCollections.id, { onDelete: 'cascade' }),
  completedSteps: integer('completed_steps').default(0),
  collectionLevel: integer('collection_level').default(0),
  optionLevel: integer('option_level').default(0),
  appliedOption: text('applied_option'),
  stats: jsonb('stats').default({}),
  tokenProgress: integer('token_progress').default(0),
  tokenGoal: integer('token_goal').default(0),
  status: text('status').default('farm'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.themeId] }) }));

export const allianceBattleRotations = pgTable('alliance_battle_rotations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  version: text('version'),
  startsAt: date('starts_at', { mode: 'date' }),
  resetTimezone: text('reset_timezone').default('Asia/Seoul'),
  sourceUrl: text('source_url').default('https://thanosvibs.money/abxl'),
  communityUrl: text('community_url'),
  note: text('note'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const allianceBattleConditions = pgTable('alliance_battle_conditions', {
  id: text('id').primaryKey(),
  rotationId: text('rotation_id').references(() => allianceBattleRotations.id, { onDelete: 'cascade' }),
  roundNo: integer('round_no').notNull(),
  mode: text('mode').notNull(),
  content: text('content').notNull(),
  isResetDay: boolean('is_reset_day').default(false),
  restrictions: text('restrictions').array().default([]),
  requiredType: text('required_type'),
  requiredAlignment: text('required_alignment'),
  requiredGender: text('required_gender'),
  requiredTags: text('required_tags').array().default([]),
  cancelEffects: text('cancel_effects').array().default([]),
  sourceUrl: text('source_url').default('https://thanosvibs.money/abxl'),
  note: text('note'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({ uniq: unique().on(t.rotationId, t.roundNo, t.mode) }));

export const characterEffects = pgTable('character_effects', {
  id: uuid('id').defaultRandom().primaryKey(),
  characterId: text('character_id').references(() => characters.id, { onDelete: 'cascade' }),
  uniformId: uuid('uniform_id').references(() => uniforms.id, { onDelete: 'cascade' }),
  sourceKind: text('source_kind').default('Other'),
  effectName: text('effect_name').notNull(),
  magnitude: numeric('magnitude'),
  magnitudeText: text('magnitude_text'),
  restrictionText: text('restriction_text'),
  rawText: text('raw_text'),
  sourceUrl: text('source_url').default('https://thanosvibs.money/supports'),
});

export const userCharacters = pgTable('user_characters', {
  userId: uuid('user_id').notNull().references(() => appProfiles.userId, { onDelete: 'cascade' }),
  characterId: text('character_id').references(() => characters.id, { onDelete: 'cascade' }),
  owned: boolean('owned').default(false),
  tier: text('tier'),
  level: integer('level'),
  uniformId: uuid('uniform_id').references(() => uniforms.id, { onDelete: 'set null' }),
  uniformRank: text('uniform_rank'),
  artifactId: uuid('artifact_id').references(() => artifacts.id, { onDelete: 'set null' }),
  artifactStars: integer('artifact_stars'),
  ctp: text('ctp'),
  memo: text('memo'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.characterId] }) }));

export const userCharacterPreferences = pgTable('user_character_preferences', {
  userId: uuid('user_id').notNull().references(() => appProfiles.userId, { onDelete: 'cascade' }),
  characterId: text('character_id').references(() => characters.id, { onDelete: 'cascade' }),
  favorite: boolean('favorite').default(false),
  priority: text('priority'),
  buildRole: text('build_role'),
  tags: text('tags').array().default([]),
  notes: jsonb('notes').default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.characterId] }),
  userIdx: index('user_character_preferences_user_idx').on(t.userId),
}));

export const userWorldBossProgress = pgTable('user_world_boss_progress', {
  userId: uuid('user_id').notNull().references(() => appProfiles.userId, { onDelete: 'cascade' }),
  bossId: text('boss_id').notNull(),
  unlocked: boolean('unlocked').default(false),
  highestStage: integer('highest_stage').default(0),
  conquerLevel: integer('conquer_level').default(0),
  dailyClearCount: integer('daily_clear_count').default(0),
  stagePicks: jsonb('stage_picks').default([]),
  memo: text('memo'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.bossId] }),
  userIdx: index('user_world_boss_progress_user_idx').on(t.userId),
}));

export const userPvpLoadouts = pgTable('user_pvp_loadouts', {
  userId: uuid('user_id').notNull().references(() => appProfiles.userId, { onDelete: 'cascade' }),
  mode: text('mode').notNull(),
  slot: integer('slot').notNull().default(1),
  name: text('name'),
  isPrimary: boolean('is_primary').default(false),
  deck: jsonb('deck').default({}),
  restrictions: jsonb('restrictions').default({}),
  memo: text('memo'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.mode, t.slot] }),
  userIdx: index('user_pvp_loadouts_user_idx').on(t.userId),
}));

export const userContentSettings = pgTable('user_content_settings', {
  userId: uuid('user_id').notNull().references(() => appProfiles.userId, { onDelete: 'cascade' }),
  contentKey: text('content_key').notNull(),
  settings: jsonb('settings').default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.contentKey] }),
  userIdx: index('user_content_settings_user_idx').on(t.userId),
}));

export const userAnalyticsSnapshots = pgTable('user_analytics_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => appProfiles.userId, { onDelete: 'cascade' }),
  snapshotKey: text('snapshot_key').notNull(),
  sourceContent: text('source_content'),
  metrics: jsonb('metrics').default({}),
  rosterSummary: jsonb('roster_summary').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  userIdx: index('user_analytics_snapshots_user_idx').on(t.userId),
  snapshotIdx: index('user_analytics_snapshots_key_idx').on(t.snapshotKey),
}));

export const userScoreEntries = pgTable('user_score_entries', {
  userId: uuid('user_id').notNull().references(() => appProfiles.userId, { onDelete: 'cascade' }),
  playerNickname: text('player_nickname'),
  scoreDate: date('score_date', { mode: 'date' }).notNull(),
  content: text('content').notNull(),
  score: numeric('score').default('0'),
  team: jsonb('team').default([]),
  memo: text('memo'),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.scoreDate, t.content] }),
  userIdx: index('user_score_entries_user_idx').on(t.userId),
  dateIdx: index('user_score_entries_date_idx').on(t.scoreDate),
}));

export const boardPosts = pgTable('board_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => appProfiles.userId, { onDelete: 'cascade' }),
  authorNickname: text('author_nickname'),
  category: text('category').notNull().default('general'),
  title: text('title').notNull(),
  body: text('body').notNull(),
  isPinned: boolean('is_pinned').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  categoryIdx: index('board_posts_category_idx').on(t.category),
  createdIdx: index('board_posts_created_idx').on(t.createdAt),
  userIdx: index('board_posts_user_idx').on(t.userId),
}));

export const boardComments = pgTable('board_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').notNull().references(() => boardPosts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => appProfiles.userId, { onDelete: 'cascade' }),
  authorNickname: text('author_nickname'),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  postIdx: index('board_comments_post_idx').on(t.postId),
  userIdx: index('board_comments_user_idx').on(t.userId),
}));

export const dailyChallenges = pgTable('daily_challenges', {
  id: text('id').primaryKey(),
  challengeDate: date('challenge_date', { mode: 'date' }).notNull(),
  content: text('content').notNull(),
  label: text('label'),
  rotationRound: integer('rotation_round'),
  mode: text('mode'),
  isResetDay: boolean('is_reset_day').default(false),
  recommendedType: text('recommended_type'),
  requiredAlignment: text('required_alignment'),
  requiredGender: text('required_gender'),
  requiredTags: text('required_tags').array().default([]),
  bonusTags: text('bonus_tags').array().default([]),
  bannedTags: text('banned_tags').array().default([]),
  cancelEffects: text('cancel_effects').array().default([]),
  sourceUrl: text('source_url'),
  note: text('note'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const usageLogs = pgTable('usage_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => appProfiles.userId, { onDelete: 'cascade' }),
  usedAt: date('used_at', { mode: 'date' }).notNull(),
  content: text('content').notNull(),
  bossOrMode: text('boss_or_mode'),
  dealerId: text('dealer_id').references(() => characters.id, { onDelete: 'set null' }),
  leaderId: text('leader_id').references(() => characters.id, { onDelete: 'set null' }),
  support1Id: text('support_1_id').references(() => characters.id, { onDelete: 'set null' }),
  support2Id: text('support_2_id').references(() => characters.id, { onDelete: 'set null' }),
  score: numeric('score'),
  memo: text('memo'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const calculatorPresets = pgTable('calculator_presets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => appProfiles.userId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  preset: jsonb('preset').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const rawSourceSnapshots = pgTable('raw_source_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceName: text('source_name').notNull(),
  sourceUrl: text('source_url').notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow(),
  contentHash: text('content_hash'),
  payload: jsonb('payload').notNull(),
});
