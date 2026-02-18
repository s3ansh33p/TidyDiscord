const Queue = require('bull');
const Logger = require('./Logger');
const { getDiscordServersByOrganisationId, getOrganisationFromDiscordServerId, removeUpcomingMessageRef, getEventSummary } = require('./Mongo');
const { buildUpcomingComponents, buildUpcomingPublicComponents } = require('../functions/index');

module.exports = function setupQueueListener(client) {
    const workerQueue = new Queue('Worker Queue', {
        redis: {
            port: parseInt(process.env.REDIS_PORT),
            host: process.env.REDIS_HOST,
            password: process.env.REDIS_PASSWORD
        }
    });

    workerQueue.on('global:completed', async (jobId) => {
        const job = await workerQueue.getJob(jobId);
        if (!job) return;

        const { orgId } = job.data;

        const refreshEvents = ['Webhook.event.updated', 'Webhook.event.pack.activated', 'Webhook.event.pack.cancelled'];
        if (refreshEvents.includes(job.name)) {
            const servers = await getDiscordServersByOrganisationId(orgId);
            let updated = 0, removed = 0;
            for (const server of servers) {
                const refs = server.upcoming_messages || [];
                if (!refs.length) continue;
                const orgDetails = await getOrganisationFromDiscordServerId(server.id);
                if (!orgDetails) continue;
                const eventData = await getEventSummary(orgDetails.id, 10, true, new Date().toISOString());
                const publicComps = await buildUpcomingPublicComponents(orgDetails, eventData);
                const privateComps = await buildUpcomingComponents(orgDetails, eventData);
                const refreshedString = `Refreshed <t:${Math.floor(Date.now() / 1000)}:R>`;
                const isPackEvent = job.name !== 'Webhook.event.updated';
                for (const ref of refs) {
                    if (isPackEvent && ref.public) continue;
                    try {
                        const comps = ref.public ? publicComps : privateComps;
                        const channel = await client.channels.fetch(ref.channel_id);
                        const message = await channel.messages.fetch(ref.message_id);
                        await message.edit({ content: refreshedString, embeds: comps.embeds, components: comps.components });
                        updated++;
                    } catch (err) {
                        await removeUpcomingMessageRef(server.id, ref.message_id);
                        removed++;
                    }
                }
            }
            if (updated > 0 || removed > 0) {
                Logger.info(`[Queue] ${job.name} org=${orgId} updated=${updated} removed=${removed}`);
            }
        }
    });

    Logger.info('[Queue] Listener initialized');
};
