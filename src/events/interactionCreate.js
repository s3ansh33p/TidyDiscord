const { Events, PermissionsBitField } = require('discord.js');
const { getDiscordServer, getOrganisationIdFromDiscordServerId } = require('../utils/Mongo');
const { buildUpcomingComponents } = require('../functions/index');
const Logger = require('../utils/Logger');
const config = require('../../config.json');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.channel.permissionsFor(interaction.user).has(PermissionsBitField.Flags.SendMessages)) return;

		if (interaction.isChatInputCommand()) {
			// get the guild
			const guild = interaction.guild;
			const guildId = guild.id;
			
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			const commandCategory = command.category;
			if (commandCategory === 'dev') {

				if (!config.developers.includes(interaction.user.id)) {
					Logger.warn(`User ${interaction.user.tag} tried to run command ${interaction.commandName}, but the user is not a developer.`);
					return await interaction.reply({ content: 'You are not a developer.', ephemeral: true });
				}

			} else if (commandCategory === 'main') {
				
				const discordServer = await getDiscordServer(guildId);
				if (!discordServer) {
					await interaction.reply({ content: 'Discord server not linked.', ephemeral: true });
					return;
				}

				// check if can bypass permissions
				const bypassPermissions = config.commandPermissions.bypass;
				const requiredPermissionsBitField = new PermissionsBitField(
					Array.from(bypassPermissions, permission => PermissionsBitField.Flags[permission])
				);

				const canBypassPermissions = interaction.channel.permissionsFor(interaction.user).has(requiredPermissionsBitField);

				if (!canBypassPermissions) {
					// check roles

					if (!discordServer.permission_roles) {
						Logger.warn(`Command ${interaction.commandName} does not have any permissions set.`);
						return await interaction.reply({ content: 'You are not allowed to run this command.', ephemeral: true });
					}
					
					const requiredPermissionRoles = discordServer.permission_roles;
					const userRoles = interaction.member.roles.cache;
					const hasPermission = requiredPermissionRoles.some(role => userRoles.has(role));
					if (!hasPermission) {
						Logger.warn(`User ${interaction.user.tag} tried to run command ${interaction.commandName} in channel ${interaction.channel.name}, but the user is missing permissions.`);
						return await interaction.reply({ content: `You are not allowed to run this command`, ephemeral: true });
					// } else {
						// Logger.info(`User ${interaction.user.tag} has one of ${requiredPermissionRoles.map(role => `<@&${role}>`).join(', ')}.`);
					}
				// } else {
					// Logger.info(`User ${interaction.user.tag} bypassed permissions for command ${interaction.commandName}.`);
				}

			} else {

				const requiredPermissionStrings = config.commandPermissions[commandCategory];
				if (!requiredPermissionStrings) {
					Logger.warn(`Command ${interaction.commandName} does not have any permissions set.`);
					return await interaction.reply({ content: 'This command does not have any permissions set.', ephemeral: true });
				}

				const requiredPermissionsBitField = new PermissionsBitField(
					Array.from(requiredPermissionStrings, permission => PermissionsBitField.Flags[permission])
				);

				if (!interaction.channel.permissionsFor(interaction.user).has(requiredPermissionsBitField)) {
					Logger.warn(`User ${interaction.user.tag} tried to run command ${interaction.commandName} in channel ${interaction.channel.name}, but the user is missing permissions.`);
					return await interaction.reply({ content: `You need the following permissions to run this command: ${requiredPermissionStrings.join(', ')}`, ephemeral: true });
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

			// is button
		} else if (interaction.isButton()) {
			const button = interaction.customId;
			// get the message it was clicked on
			const messageId = interaction.message.id;
			if (button === 'upcoming:delete') {
				const message = await interaction.channel.messages.fetch(messageId);
				message.delete();
			} else if (button === 'upcoming:refresh') {
				const message = await interaction.channel.messages.fetch(messageId);
				await message.edit({ content: 'Refreshing...', components: [] });
				const orgId = await getOrganisationIdFromDiscordServerId(interaction.guild.id);
				const comps = await buildUpcomingComponents(orgId);
				const refreshedString = `Refreshed <t:${Math.floor(Date.now() / 1000)}:R>`;
				await message.edit({ content: refreshedString, components: comps.components, embeds: comps.embeds });
				// finish interaction
				await interaction.deferUpdate();
			}
		}
	},
};
