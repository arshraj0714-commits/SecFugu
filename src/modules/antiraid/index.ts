import { Events, GuildMember, Message, Guild } from 'discord.js';
import { client } from '../../core/bot';
import { getGuildConfig } from '../../core/config';
import { logAuditEvent } from '../audit';
import { sendSecurityAlert } from '../alerts';
import { lockdownGuild, quarantineUser } from './actions';

const joinTimestamps: string[] = [];
const leaveTimestamps: string[] = [];
const dmMessages: Map<string, number> = new Map(); // userId -> count

export function setupAntiRaid() {
  client.on(Events.GuildMemberAdd, (member: GuildMember) => {
    const now = Date.now();
    joinTimestamps.push(now);
    
    // Clean old entries
    while (joinTimestamps.length > 0 && now - joinTimestamps[0] > 10_000) {
      joinTimestamps.shift();
    }

    if (joinTimestamps.length > 5) {
      handleRaidDetected(member.guild, 'JOIN_RAID');
    }
  });

  client.on(Events.GuildMemberRemove, (member: GuildMember) => {
    const now = Date.now();
    leaveTimestamps.push(now);
    
    while (leaveTimestamps.length > 0 && now - leaveTimestamps[0] > 10_000) {
      leaveTimestamps.shift();
    }

    if (leaveTimestamps.length > 10) {
      handleRaidDetected(member.guild, 'LEAVE_RAID');
    }
  });

  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.channel.isDMBased() && !message.author.bot) {
      const count = (dmMessages.get(message.author.id) ?? 0) + 1;
      dmMessages.set(message.author.id, count);

      setTimeout(() => {
        dmMessages.delete(message.author.id);
      }, 60_000);

      if (count > 20) {
        handleRaidDetected(null, 'DM_RAID', message.author.id);
      }
    }
  });
}

async function handleRaidDetected(guild: Guild | null, type: string, userId?: string) {
  logAuditEvent(guild?.id ?? 'DM', 'ANTI_RAID_TRIGGERED', { type, userId });

  if (guild) {
    sendSecurityAlert(guild, `Raid detected: ${type}`);
    await lockdownGuild(guild);
  }

  if (userId && guild) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (member) await quarantineUser(guild, member);
  }
}
