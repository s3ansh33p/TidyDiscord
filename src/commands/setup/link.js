const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder } = require('discord.js');
const { getOrganisationsFromDiscordUserId, linkDiscordServerToTidyHQ } = require('../../utils/Mongo');
const Logger = require('../../utils/Logger');

module.exports = {
	category: 'setup',
	data: new SlashCommandBuilder()
		.setName('link')
		.setDescription('Links a discord server to your TidyHQ account.'),
	async execute(interaction) {
		// get user id
    const discordId = interaction.user.id;
    // get organisation
    let orgs;
    try {
      orgs = await getOrganisationsFromDiscordUserId(discordId);
    } catch (error) {
      Logger.error(error);

      const linkBtn = new ButtonBuilder()
        .setLabel('Link')
        .setStyle(ButtonStyle.Link)
        .setURL('https://tidy.mcginty.io/panel/admin');

      const row = new ActionRowBuilder()
        .addComponents(linkBtn);

      const message = interaction.reply({
        content: "Unable to get organisation. Have you linked your account?",
        components: [row],
        fetchReply: true
      });

      return setTimeout(() => {
        message.then(m => m.delete());
      }, 10000);
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId('organisation')
      .setPlaceholder('Select an organisation')
      .addOptions(orgs.map(org => new StringSelectMenuOptionBuilder().setLabel(org.name).setValue(org.id)));
    
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
      content: `Select an organisation to link to this server.`,
      components: [row, btnRow]
    });

    const collectorFilter = i => i.user.id === interaction.user.id;
    try {
      const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60000 }); //60 seconds

      if (confirmation.isButton() && confirmation.customId === 'cancel') {
        const message = await confirmation.update({ content: 'Linking cancelled.', components: [] });
        setTimeout(() => {
          message.delete();
        }, 10000);
      } else if (confirmation.isStringSelectMenu()) {
        const organisationId = confirmation.values[0];
        const guildId = interaction.guild.id;
        await linkDiscordServerToTidyHQ(guildId, organisationId);
        Logger.info(`Server ${guildId} linked to organisation: ${organisationId}`);
        const message = await confirmation.update({ content: 'Server linked!', components: [] });
        setTimeout(() => {
          message.delete();
        }, 10000);
      }
    } catch (error) {
      Logger.error(error.message);
      const message = await interaction.followUp({ content: 'Linking not confirmed in 1 minute, try again.', components: [] });
      setTimeout(() => {
        message.delete();
      }, 10000);
    }
	},
};
