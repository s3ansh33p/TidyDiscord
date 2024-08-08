const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { getOrganisationFromDiscordUserId, linkDiscordServerToTidyHQ } = require('../../utils/Mongo');
const Logger = require('../../utils/Logger');

module.exports = {
	category: 'main',
	data: new SlashCommandBuilder()
		.setName('link')
		.setDescription('Links a discord server to your TidyHQ account.'),
	async execute(interaction) {
		// get user id
    const discordId = interaction.user.id;
    // get organisation
    let organisation;
    try {
      organisation = await getOrganisationFromDiscordUserId(discordId);
    } catch (error) {
      Logger.error(error);

      const linkBtn = new ButtonBuilder()
        .setLabel('Link')
        .setStyle(ButtonStyle.Link)
        .setURL('https://tidy.mcginty.io/panel/admin');

      const row = new ActionRowBuilder()
        .addComponents(linkBtn);

      return interaction.reply({
        content: "Unable to get organisation. Have you linked your account?",
        components: [row]
      });
    }
    
    const confirm = new ButtonBuilder()
			.setCustomId('link')
			.setLabel('Link')
			.setStyle(ButtonStyle.Primary);

		const cancel = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder()
			.addComponents(confirm, cancel);

    // button to confirm and cancel linking
		const response = await interaction.reply({
      content: `Are you sure you want to link this server to [${organisation.name}](https://${organisation.domain_prefix}.tidyhq.com)?`,
      components: [row]
    });

    const collectorFilter = i => i.user.id === interaction.user.id;
    try {
      const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60000 }); //60 seconds

      if (confirmation.customId === 'link') {
        // link the server
        await linkDiscordServerToTidyHQ(interaction.guild.id, organisation.id);
        await confirmation.update({ content: 'Server linked!', components: [] });
      } else {
        await confirmation.update({ content: 'Linking cancelled.', components: [] });
      }
    } catch (error) {
      Logger.error(error.message);
      await interaction.followUp({ content: 'Linking not confirmed in 1 minute, try again.', components: [] });
    }
	},
};
