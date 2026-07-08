import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { loadCommands } from '../commands';
import { loadModules } from '../modules';
import { logger } from './logger';
import { config } from './config';

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();

export async function setupBot() {
  await loadCommands(client);
  await loadModules(client);
  
  client.on('ready', () => {
    logger.info(`Logged in as ${client.user?.tag}`);
  });

  client.on('error', logger.error);
  client.on('warn', logger.warn);

  await client.login(process.env.DISCORD_TOKEN);
}
