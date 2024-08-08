const fs = require('fs');
const path = require('path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const Logger = require('./utils/Logger');
const { connectToMongoDB } = require('./utils/Mongo');

const config = require('../config.json');
require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = config[NODE_ENV].guild;

Logger.info(`Environment: ${NODE_ENV}`);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// LOAD COMMANDS
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
			Logger.info(`Load Command: ${command.data.name}`);
		} else {
			Logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// LOAD EVENTS
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
	Logger.info(`Load Event: ${event.name}`);
}

process.on('uncaughtException', function (err) {
		Logger.error('!! [uncaughtException]', err);
});

connectToMongoDB().then(() => {
	Logger.info('Logging in...');
	client.login(DISCORD_TOKEN);
}).catch(err => {
	Logger.error('Failed to connect to MongoDB', err);
});
