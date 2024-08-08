const { Events } = require('discord.js');
const { addDiscordServer } = require('../utils/Mongo');
const Logger = require('../utils/Logger');

module.exports = {
  name: Events.GuildCreate,
  once: false,
  execute(guild) {
    Logger.info(`Joined a new guild: ${guild.name} (ID: ${guild.id})`);
    addDiscordServer({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      added_at: new Date()
    });
  },
};
