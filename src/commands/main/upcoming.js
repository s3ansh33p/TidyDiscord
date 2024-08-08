const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { getEventSummary } = require('../../utils/Mongo');

module.exports = {
	category: 'main',
	data: new SlashCommandBuilder()
		.setName('upcoming')
		.setDescription('Lists upcoming events.'),
	async execute(interaction) {
		let description = '';

		const orgId = "f9afc4215c2b";
		const limit = 5;
		const publicOnly = true;
		const start_at = new Date().toISOString();
		const eventData = await getEventSummary(orgId, limit, publicOnly, start_at);
		// console.log(eventData);

		for (let eventIdx = eventData.length - 1; eventIdx >= 0; eventIdx--) {
			const event = eventData[eventIdx];
			let ticketsSummary = '🎟️ No Tickets';
			if (event.tickets.length > 0) {
				let ticketSales = 0;
				let totalTickets = 0;
				ticketsSummary = '';
				for (let i = 0; i < event.tickets[0].length; i++) {
					const ticket = event.tickets[0][i];
					const isFree = ticket.amount === '0.0';
					if (!isFree) ticketSales += parseFloat(ticket.amount) * ticket.quantity_sold;
					const ticketCost = isFree ? 'Free' : `$${parseFloat(ticket.amount).toFixed(2)}`;
					const ticketSummary = `${ticket.quantity_sold} sold - ${ticketCost}`;
					ticketsSummary += `🎟️ ${ticket.name}: ${ticketSummary}\n`;
					totalTickets += ticket.quantity_sold;
				}
				ticketsSummary += `💵 Total: ${totalTickets} tickets sold - $${ticketSales.toFixed(2)}`;
			}
			
			const eventName = `**${event.name}** - [View](https://comssa.tidyhq.com/public/schedule/events/${event.id}) - [Edit](https://comssa.tidyhq.com/schedule/events/${event.id})`;

			description += `${eventName}\n⏰ <t:${Math.floor(new Date(event.start_at).getTime() / 1000)}:f>\n🗺️ ${event.location ? event.location : 'No location set'}\n${ticketsSummary}\n\n`;
		}

		const embed = new EmbedBuilder()
			.setTitle("Upcoming Events")
			.setDescription(description)

		await interaction.reply({ embeds: [embed] });
	},
};
