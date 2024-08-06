const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } = require('discord.js');

const eventData = [
	{
		"id": 41507,
		"archived": false,
		"body": "<p>This is a brief introduction to Git, its basic features and Git hosting services. It is intended for Curtin students who are interested in learning about version control. Version control is an industry staple of project management and teamwork, whose usefulness extends to personal projects and outside the discipline of computing. The workshop will cover Git basics, Github hosting, authentication, branching and how to handle pull requests.</p>\r\n\r\n<p><strong>*Venue location will be announced as soon as the guild gets back to us on our discord: discord.comssa.org.au, it will also be emailed to you if you sign up*</strong></p>\r\n",
		"created_at": "2022-03-17T07:38:27.000Z",
		"end_at": "2022-03-30T06:00:00.000Z",
		"image_url": "https://s3.tidyhq.com/orgs/f9afc4215c2b/event/image/078cd69ca8997de864b6dd608ce4f9050f6b5f8c/show/ComSSA_Git_Workshop_Wide_Landscape.jpg",
		"location": null,
		"name": "ComSSA x SE@Curtin Git & Github Workshop",
		"public": true,
		"public_url": "https://comssa.tidyhq.com/public/events/41507-comssa-x-se-curtin-git-github-workshop",
		"start_at": "2022-03-30T04:00:00.000Z",
		"tickets": [
			{
				"id": "d8237c42e576",
				"name": "Member Ticket",
				"amount": "0.0",
				"initial_quantity": null,
				"quantity_sold": 27,
				"maximum_purchase": null,
				"sales_end": null,
				"members_only": false,
				"membership_level_id": null,
				"created_at": "2022-03-17T07:49:12.000Z"
			},
			{
				"id": "d8237c42e576",
				"name": "Regular Ticket",
				"amount": "5.0",
				"initial_quantity": null,
				"quantity_sold": 13,
				"maximum_purchase": null,
				"sales_end": null,
				"members_only": false,
				"membership_level_id": null,
				"created_at": "2022-03-17T07:49:53.000Z"
			}
		]
	}
]

module.exports = {
	category: 'main',
	data: new SlashCommandBuilder()
		.setName('events')
		.setDescription('Provides a summary of recent events.'),
	async execute(interaction) {
		const event = eventData[0];
		let description = event.body ? event.body.replace(/<[^>]*>?/gm, '').replace(/\n/g, '').replace(/\s\s+/g, ' ').replace(/&nbsp;/g, ' ').substring(0, 130) : '';
		if (description !== '') description += '...';

		// add starts and ends at, and location if set, otherwise say no location set
		const location = event.location ? event.location : 'No location set';
		const formattedStart = `<t:${Math.floor(new Date(event.start_at).getTime() / 1000)}:f>`;
		const formattedEnd = `<t:${Math.floor(new Date(event.end_at).getTime() / 1000)}:f>`;

		const ticketFields = [];
		let ticketSales = 0;
		for (const ticket of event.tickets) {
			const isFree = ticket.amount === '0.0';
			if (!isFree) ticketSales += parseFloat(ticket.amount) * ticket.quantity_sold;
			const ticketCost = isFree ? 'Free' : `$${parseFloat(ticket.amount).toFixed(2)}`;
			const ticketSummary = `${ticket.quantity_sold} sold - ${ticketCost}`;
			ticketFields.push({ name: ticket.name, value: ticketSummary, inline: true });
		}

		const eventSummary = `⏰ ${formattedStart} to ${formattedEnd}\n🗺️ ${location}\n🎟️ [Get Tickets](${event.public_url}) - $${ticketSales.toFixed(2)} in sales`;

		const embed = new EmbedBuilder()
			.setTitle(event.name)
			.setDescription(description)
			.setImage(event.image_url)
			.addFields(
				{ name: 'Summary', value: eventSummary, inline: false },
			)
			for (const field of ticketFields) {
				embed.addFields(field);
			}

		const prevBtn = new ButtonBuilder()
			.setCustomId('prevBtn')
			.setLabel('Previous')
			.setStyle(ButtonStyle.Secondary);

		const nextBtn = new ButtonBuilder()
			.setCustomId('nextBtn')
			.setLabel('Next')
			.setStyle(ButtonStyle.Secondary);

		const actionRow = new ActionRowBuilder()
			.addComponents(prevBtn, nextBtn);

		await interaction.reply({ embeds: [embed], components: [actionRow] });
	},
};
