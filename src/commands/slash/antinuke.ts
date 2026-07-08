// src/commands/slash/antinuke.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { updateGuildConfig } from '../../core/config';

export const data = new SlashCommandBuilder()
  .setName('antinuke')
  .setDescription('Configure anti-nuke thresholds')
  .addSubcommand(sub => sub
    .setName('threshold')
    .setDescription('Set a threshold')
    .addStringOption(opt => opt
      .setName('action')
      .setDescription('Action type')
      .setRequired(true)
      .addChoices(
        { name: 'Channel Create', value: 'CHANNEL_CREATE' },
        { name: 'Role Delete', value: 'ROLE_DELETE' },
        // ...
      ))
    .addIntegerOption(opt => opt
      .setName('value')
      .setDescription('New threshold')
      .setRequired(true)
    )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has('Administrator')) {
    return interaction.reply({ content: 'You need administrator permissions.', ephemeral: true });
  }

  const action = interaction.options.getString('action', true);
  const value = interaction.options.getInteger('value', true);

  await updateGuildConfig(interaction.guildId!, { [`antinuke.${action.toLowerCase()}`]: value });

  await interaction.reply({ content: `Set ${action} threshold to ${value}`, ephemeral: true });
}
