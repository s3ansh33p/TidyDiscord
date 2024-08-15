const { SlashCommandBuilder } = require('discord.js');
const { getOrganisationIdFromDiscordServerId } = require('../../utils/Mongo');
const { buildUpcomingComponents } = require('../../functions/index');

module.exports = {
	category: 'main',
	data: new SlashCommandBuilder()
		.setName('upcoming')
		.setDescription('Lists upcoming events.'),
	async execute(interaction) {
		const orgId = await getOrganisationIdFromDiscordServerId(interaction.guild.id);
		if (!orgId) {
			await interaction.reply({ content: "This server is not linked to a TidyHQ organisation.", ephemeral: true });
			return;
		};
		const comps = await buildUpcomingComponents(orgId);
		await interaction.reply(comps);
	},
};
