const { Events, ActivityType, PresenceUpdateStatus } = require('discord.js');
const Logger = require('../utils/Logger');
const setupQueueListener = require('../utils/QueueListener');
require('dotenv').config();

const IS_DEV = process.env.NODE_ENV === 'development';

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
    Logger.info(`Ready! Logged in as ${client.user.tag}`);
    let presence = {
      activities: [
        {
          name: 'TidyHQ',
          type: ActivityType.Listening,
        },
      ],
      status: PresenceUpdateStatus.Idle,
    };
    if (IS_DEV) {
      presence.activities[0].name = 'Dev/Updates...';
      presence.status = PresenceUpdateStatus.DoNotDisturb;
    }

    // Set the bot's activity
    client.user.setPresence(presence);

    setupQueueListener(client);

	},
};
