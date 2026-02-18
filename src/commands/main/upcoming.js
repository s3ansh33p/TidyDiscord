const { SlashCommandBuilder } = require('discord.js');
const { getOrganisationFromDiscordServerId, saveUpcomingMessageRef } = require('../../utils/Mongo');
const { buildUpcomingComponents } = require('../../functions/index');

module.exports = {
	category: 'main',
	data: new SlashCommandBuilder()
		.setName('upcoming')
		.setDescription('Lists upcoming events.'),
	async execute(interaction) {
		const orgDetails = await getOrganisationFromDiscordServerId(interaction.guild.id);
		if (!orgDetails) {
			await interaction.reply({ content: "This server is not linked to a TidyHQ organisation.", ephemeral: true });
			return;
		};
		const comps = await buildUpcomingComponents(orgDetails);
		await interaction.reply(comps);
		const message = await interaction.fetchReply();
		await saveUpcomingMessageRef(interaction.guild.id, interaction.channel.id, message.id);
	},
};
