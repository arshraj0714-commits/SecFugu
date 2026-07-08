import { Events, Message } from 'discord.js';
import { client } from '../../core/bot';
import { getGuildConfig } from '../../core/config';
import { isSpam, isFlood, isCaps, containsBadWords, containsScamLink, isNSFW } from './filters';
import { moderateWithAi } from './ai';
import { logAuditEvent } from '../audit';
import { sendModAlert } from '../alerts';

const userMessageCounts = new Map<string, Map<string, number>>();
const lastMessageTimestamps = new Map<string, Map<string, number>>();
const duplicateTracker = new Map<string, Map<string, string>>();

export function setupAutoMod() {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot || !message.inGuild()) return;

    const guildId = message.guildId;
    const userId = message.author.id;
    const config = await getGuildConfig(guildId);
    if (config.whitelist.includes(userId)) return;

    // AI Moderation (if Groq API key is set)
    if (config.useAiModeration) {
      const aiResult = await moderateWithAi(message);
      if (aiResult === 'unsafe') {
        await message.delete();
        await message.member?.timeout(15 * 60_000, 'AI moderation: unsafe content');
        logAuditEvent(guildId, 'AUTOMOD_AI_UNSAFE', { userId });
        return;
      }
    }

    // Spam & Flood
    if (isSpam(message, config)) {
      await message.delete();
      await message.member?.timeout(5 * 60_000, 'Spam detected');
      logAuditEvent(guildId, 'AUTOMOD_SPAM', { userId, content: message.content });
      return;
    }

    if (isFlood(message, config)) {
      await message.delete();
      logAuditEvent(guildId, 'AUTOMOD_FLOOD', { userId });
      return;
    }

    // Caps
    if (isCaps(message, config)) {
      await message.delete();
      await message.channel.send(`${message.author}, please avoid excessive caps.`);
      logAuditEvent(guildId, 'AUTOMOD_CAPS', { userId });
      return;
    }

    // Bad words
    if (containsBadWords(message, config)) {
      await message.delete();
      await message.member?.timeout(10 * 60_000, 'Inappropriate language');
      logAuditEvent(guildId, 'AUTOMOD_BAD_WORDS', { userId });
      return;
    }

    // Scam / phishing / IP loggers
    if (await containsScamLink(message, config)) {
      await message.delete();
      await message.member?.ban({ reason: 'Scam link detected' });
      logAuditEvent(guildId, 'AUTOMOD_SCAM_LINK', { userId });
      sendModAlert(message.guild, `Banned ${message.author.tag} for scam link: ${message.content}`);
      return;
    }

    // NSFW
    if (await isNSFW(message, config)) {
      await message.delete();
      await message.member?.timeout(15 * 60_000, 'NSFW content');
      logAuditEvent(guildId, 'AUTOMOD_NSFW', { userId });
      return;
    }

    // Duplicate messages
    const userDuplicates = duplicateTracker.get(guildId) ?? new Map();
    const lastContent = userDuplicates.get(userId);
    if (lastContent === message.content) {
      await message.delete();
      logAuditEvent(guildId, 'AUTOMOD_DUPLICATE', { userId });
      return;
    }
    userDuplicates.set(userId, message.content);
    duplicateTracker.set(guildId, userDuplicates);

    // Ghost pings: track mentions and check if message is deleted quickly
    // (implementation similar to above but with deletion tracking)
  });
}
