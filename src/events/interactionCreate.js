const { Events, PermissionsBitField } = require('discord.js');
const Logger = require('../utils/Logger');
const config = require('../../config.json');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.channel.permissionsFor(interaction.user).has(PermissionsBitField.Flags.SendMessages)) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		const commandCategory = command.category;
		if (commandCategory === 'dev') {

			if (!config.developers.includes(interaction.user.id)) {
				Logger.warn(`User ${interaction.user.tag} tried to run command ${interaction.commandName}, but the user is not a developer.`);
				return await interaction.reply('You are not a developer.');
			}

		} else {

			const requiredPermissionStrings = config.commandPermissions[commandCategory];
			if (!requiredPermissionStrings) {
				Logger.warn(`Command ${interaction.commandName} does not have any permissions set.`);
				return await interaction.reply('This command does not have any permissions set.');
			}

			const requiredPermissionsBitField = new PermissionsBitField(
				Array.from(requiredPermissionStrings, permission => PermissionsBitField.Flags[permission])
			);

			if (!interaction.channel.permissionsFor(interaction.user).has(requiredPermissionsBitField)) {
				Logger.warn(`User ${interaction.user.tag} tried to run command ${interaction.commandName} in channel ${interaction.channel.name}, but the user is missing permissions.`);
				return await interaction.reply(`You need the following permissions to run this command: ${requiredPermissionStrings.join(', ')}`);
			}

		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	},
};
