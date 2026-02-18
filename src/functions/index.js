const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { getEventSummary } = require('../utils/Mongo');

async function buildUpcomingComponents(orgDetails, eventData = null) {
  if (!eventData) {
    const limit = 10;
    const publicOnly = true;
    const start_at = new Date().toISOString();
    eventData = await getEventSummary(orgDetails.id, limit, publicOnly, start_at);
  }
  // console.log(eventData);

  let description = '';
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
        const ticketSummary = `${ticket.quantity_sold}${ticket.initial_quantity ? "/" + ticket.initial_quantity : ""} sold - ${ticketCost}`;
        ticketsSummary += `🎟️ ${ticket.name}: ${ticketSummary}\n`;
        totalTickets += ticket.quantity_sold;
      }
      ticketsSummary += `💵 Total: ${totalTickets} tickets sold - $${ticketSales.toFixed(2)}`;
    }
    
    const eventName = `**${event.name}** - [View](https://${orgDetails.domain_prefix}.tidyhq.com/public/schedule/events/${event.id}) - [Edit](https://${orgDetails.domain_prefix}.tidyhq.com/schedule/events/${event.id}) - [Scan](https://tidy.mcginty.io/panel/events/${event.id})`;

    description += `${eventName}\n⏰ <t:${Math.floor(new Date(event.start_at).getTime() / 1000)}:f>\n🗺️ ${event.location ? event.location : 'No location set'}\n${ticketsSummary}\n\n`;
  }

  if (description === '') {
    description = 'No upcoming events.';
  }

  const embed = new EmbedBuilder()
    .setTitle("Upcoming Events")
    .setDescription(description)

  const refresh = new ButtonBuilder()
    .setCustomId('upcoming:refresh')
    .setLabel('🔄 Refresh')
    .setStyle(ButtonStyle.Secondary);
  
  const deleteBtn = new ButtonBuilder()
    .setCustomId('upcoming:delete')
    .setLabel('❌ Delete Message')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder()
    .addComponents(refresh, deleteBtn);

  return { embeds: [embed], components: [row] };
}

async function buildUpcomingPublicComponents(orgDetails, eventData = null) {
  if (!eventData) {
    const limit = 10;
    const publicOnly = true;
    const start_at = new Date().toISOString();
    eventData = await getEventSummary(orgDetails.id, limit, publicOnly, start_at);
  }

  let description = '';
  for (let eventIdx = eventData.length - 1; eventIdx >= 0; eventIdx--) {
    const event = eventData[eventIdx];
    const eventName = `[**${event.name}**](https://${orgDetails.domain_prefix}.tidyhq.com/public/schedule/events/${event.id})`;
    description += `${eventName}\n⏰ <t:${Math.floor(new Date(event.start_at).getTime() / 1000)}:f>\n🗺️ ${event.location ? event.location : 'No location set'}\n\n`;
  }

  if (description === '') {
    description = 'No upcoming events.';
  }

  const embed = new EmbedBuilder()
    .setTitle("Upcoming Events")
    .setDescription(description)

  const refresh = new ButtonBuilder()
    .setCustomId('upcoming:refresh:public')
    .setLabel('🔄 Refresh')
    .setStyle(ButtonStyle.Secondary);

  const deleteBtn = new ButtonBuilder()
    .setCustomId('upcoming:delete')
    .setLabel('❌ Delete Message')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder()
    .addComponents(refresh, deleteBtn);

  return { embeds: [embed], components: [row] };
}

module.exports = {
  buildUpcomingComponents,
  buildUpcomingPublicComponents
};
