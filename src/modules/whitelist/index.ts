import { getGuildConfig } from '../../core/config';

export function isWhitelisted(guildId: string, userId: string): Promise<boolean> {
  return getGuildConfig(guildId).then(config => config.whitelist.includes(userId));
}
