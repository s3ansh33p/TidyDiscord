const { Events } = require('discord.js');
const { deleteDiscordServer } = require('../utils/Mongo');
const Logger = require('../utils/Logger');

module.exports = {
  name: Events.GuildDelete,
  once: false,
  execute(guild) {
    Logger.info(`Left a guild: ${guild.name} (ID: ${guild.id})`);
    deleteDiscordServer(guild.id);
  },
};
