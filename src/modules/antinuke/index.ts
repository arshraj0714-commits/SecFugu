import { Events, GuildChannel, Role, GuildMember, Webhook, GuildEmoji, Sticker, AuditLogEvent } from 'discord.js';
import { client } from '../../core/bot';
import { getGuildConfig } from '../../core/config';
import { logAuditEvent, revertChanges, quarantineUser } from '../audit';
import { sendSecurityAlert } from '../alerts';

const actionCounts = new Map<string, Map<string, number>>(); // guildId -> (userId -> count)
const lastActionTimestamps = new Map<string, Map<string, number>>();

function trackAction(guildId: string, userId: string, threshold: number, actionType: string) {
  const now = Date.now();
  const userActions = actionCounts.get(guildId) ?? new Map();
  const userTimestamps = lastActionTimestamps.get(guildId) ?? new Map();

  const lastTime = userTimestamps.get(userId) ?? 0;
  if (now - lastTime > 60_000) {
    userActions.set(userId, 0);
  }

  const count = (userActions.get(userId) ?? 0) + 1;
  userActions.set(userId, count);
  userTimestamps.set(userId, now);

  actionCounts.set(guildId, userActions);
  lastActionTimestamps.set(guildId, userTimestamps);

  if (count > threshold) {
    handleNukeDetected(guildId, userId, actionType, count);
  }
}

async function handleNukeDetected(guildId: string, userId: string, actionType: string, count: number) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return;

  const config = await getGuildConfig(guildId);
  if (config.whitelist.includes(userId)) return;

  logAuditEvent(guildId, 'ANTI_NUKE_TRIGGERED', { userId, actionType, count });
  sendSecurityAlert(guild, `Anti-Nuke triggered: ${member.user.tag} (${userId}) - ${actionType} x${count}`);

  await quarantineUser(guild, member);
  await revertChanges(guild, userId, actionType);
}

export function setupAntiNuke() {
  client.on(Events.ChannelCreate, (channel) => {
    if (!(channel instanceof GuildChannel)) return;
    trackAction(channel.guildId, channel.guild.members.me!.id, 3, 'CHANNEL_CREATE');
  });

  client.on(Events.ChannelDelete, (channel) => {
    if (!(channel instanceof GuildChannel)) return;
    trackAction(channel.guildId, channel.guild.members.me!.id, 3, 'CHANNEL_DELETE');
  });

  client.on(Events.GuildRoleCreate, (role: Role) => {
    trackAction(role.guild.id, role.guild.members.me!.id, 3, 'ROLE_CREATE');
  });

  client.on(Events.GuildRoleDelete, (role: Role) => {
    trackAction(role.guild.id, role.guild.members.me!.id, 3, 'ROLE_DELETE');
  });

  client.on(Events.WebhookCreate, (webhook: Webhook) => {
    trackAction(webhook.guildId!, webhook.guild!.members.me!.id, 3, 'WEBHOOK_CREATE');
  });

  client.on(Events.GuildEmojiCreate, (emoji: GuildEmoji) => {
    trackAction(emoji.guild.id, emoji.guild.members.me!.id, 5, 'EMOJI_CREATE');
  });

  client.on(Events.GuildStickerCreate, (sticker: Sticker) => {
    trackAction(sticker.guildId!, sticker.guild!.members.me!.id, 5, 'STICKER_CREATE');
  });

  client.on(Events.GuildMemberAdd, (member) => {
    if (member.user.bot) {
      trackAction(member.guild.id, member.guild.members.me!.id, 2, 'BOT_ADD');
    }
  });

  // Permission changes: track via audit logs
  client.on(Events.GuildAuditLogEntryCreate, async (auditLog, guild) => {
    if (auditLog.action === AuditLogEvent.MemberRoleUpdate) {
      trackAction(guild.id, auditLog.executorId!, 10, 'PERMISSION_CHANGE');
    }
  });

  // Vanity, prune, timeout, mass actions similarly...
}
