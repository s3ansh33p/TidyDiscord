const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	category: 'utility',
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		const messageDate = interaction.createdTimestamp;
		await interaction.reply(`🏓 Latency is ${Date.now() - messageDate}ms.`);
	},
};
