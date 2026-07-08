import 'dotenv/config';

export const DEFAULT_THRESHOLDS = {
  // Anti-Nuke
  CHANNEL_CREATE_PER_MIN: 3,
  CHANNEL_DELETE_PER_MIN: 3,
  ROLE_CREATE_PER_MIN: 3,
  ROLE_DELETE_PER_MIN: 3,
  WEBHOOK_CREATE_PER_MIN: 3,
  EMOJI_CREATE_PER_MIN: 5,
  STICKER_CREATE_PER_MIN: 5,
  BOT_ADD_PER_MIN: 2,
  PERMISSION_CHANGES_PER_MIN: 10,
  SERVER_UPDATE_PER_MIN: 3,
  VANITY_CHANGE_PER_MIN: 2,
  PRUNE_PER_MIN: 1,
  TIMEOUT_PER_MIN: 5,
  MASS_ACTION_PER_MIN: 5,

  // AntiRaid
  JOINS_PER_SECOND: 5,
  LEAVES_PER_SECOND: 10,
  DM_RAID_MESSAGES_PER_MIN: 20,
  RAID_DETECTION_WINDOW_MS: 10_000,

  // AutoMod
  SPAM_MESSAGES_PER_SEC: 5,
  FLOOD_MESSAGES_PER_SEC: 3,
  CAPS_RATIO: 0.7,
  MAX_MENTIONS: 5,
  MAX_EMOJIS: 10,
  MAX_LINKS_PER_MSG: 2,
  DUPLICATE_MESSAGES_WINDOW_MS: 5000,
  GHOST_PING_THRESHOLD_MS: 3000,
} as const;

export interface GuildConfig {
  guildId: string;
  whitelist: string[];
  thresholds: Partial<typeof DEFAULT_THRESHOLDS>;
  useAiModeration: boolean;
  backupPath?: string;
}

const guildConfigs = new Map<string, GuildConfig>();

export async function getGuildConfig(guildId: string): Promise<GuildConfig> {
  if (guildConfigs.has(guildId)) {
    return guildConfigs.get(guildId)!;
  }

  // In a real app, load from DB
  const config: GuildConfig = {
    guildId,
    whitelist: [],
    thresholds: {},
    useAiModeration: !!process.env.GROQ_API_KEY,
  };
  guildConfigs.set(guildId, config);
  return config;
}

export async function updateGuildConfig(guildId: string, updates: Partial<GuildConfig>) {
  const config = await getGuildConfig(guildId);
  Object.assign(config, updates);
  // In a real app, save to DB
}
