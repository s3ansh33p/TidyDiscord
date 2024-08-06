const { Events, ActivityType, PresenceUpdateStatus } = require('discord.js');
const Logger = require('../utils/Logger');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
    Logger.info(`Ready! Logged in as ${client.user.tag}`);

    // Set the bot's activity
    client.user.setPresence({
      activities: [
        {
          name: 'TidyHQ',
          type: ActivityType.Listening,
        },
      ],
      status: PresenceUpdateStatus.Idle,
    });
    
	},
};
