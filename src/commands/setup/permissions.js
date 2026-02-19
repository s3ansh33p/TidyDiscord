const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder } = require('discord.js');
const { setDiscordPermissionRoles, getDiscordServer } = require('../../utils/Mongo');
const Logger = require('../../utils/Logger');

module.exports = {
	category: 'setup',
	data: new SlashCommandBuilder()
		.setName('permissions')
		.setDescription('Allows you to choose which roles can use the bot.'),
	async execute(interaction) {
		// create menu from roles

		const discordServer = await getDiscordServer(interaction.guild.id);
		if (!discordServer) {
			await interaction.reply({ content: 'Discord server not linked.', ephemeral: true });
			return;
		}

		let permissionRoles = discordServer.permission_roles;
		if (!permissionRoles) permissionRoles = [];

		let permissionRolesMap = {};
		permissionRoles.forEach(role => {
			permissionRolesMap[role] = true;
		});

		const roles = interaction.guild.roles.cache.filter(role => role.name !== '@everyone').sort((a, b) => b.position - a.position);
		const options = roles.map(role => ({
			label: role.name,
			value: role.id,
			default: permissionRolesMap[role.id] ? true : false
		})).slice(0, 25);

		const select = new StringSelectMenuBuilder()
			.setCustomId('permissions')
			.setPlaceholder('Select roles')
			.setMinValues(1)
			.setMaxValues(5)
			.addOptions(options);

		const cancel = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder()
			.addComponents(select);

		const btnRow = new ActionRowBuilder()
			.addComponents(cancel);

		// button to confirm and cancel linking
		const response = await interaction.reply({
			content: `Select 1-5 roles that can use the bot.`,
			components: [row, btnRow]
		});

		// listen for interaction
    const collectorFilter = i => i.user.id === interaction.user.id;
    try {
      const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 5 * 60 * 1000 }); // 5 minutes

      if (confirmation.isButton() && confirmation.customId === 'cancel') {
				await confirmation.update({ content: 'Cancelled changes.', components: [] });
				return;
			} else if (confirmation.isStringSelectMenu() && confirmation.customId === 'permissions') {
				const selectedRoles = confirmation.values;
				Logger.info(`Selected roles: ${selectedRoles.join(', ')}`);
				// save roles to database
				await setDiscordPermissionRoles(interaction.guild.id, selectedRoles);
				const message = await confirmation.update({ content: 'Permissions saved.', components: [] });
				setTimeout(() => {
					message.delete();
				}, 10000);
			}
    } catch (error) {
      Logger.error(error.message);
      const message = await interaction.followUp({ content: 'Permissions not confirmed in 5 minutes, try again.', components: [] });
      setTimeout(() => {
        message.delete();
      }, 10000);
		}

	},
};
