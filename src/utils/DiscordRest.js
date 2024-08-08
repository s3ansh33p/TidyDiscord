const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Logger = require('./Logger');
const config = require('../../config.json');
require('dotenv').config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;

const devCommands = [];
const commands = [];

function loadCommands() {
	// Grab all the command folders from the commands directory you created earlier
	const foldersPath = path.join(__dirname, '..', 'commands');
	const commandFolders = fs.readdirSync(foldersPath);

	for (const folder of commandFolders) {
		// Grab all the command files from the commands directory you created earlier
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
		// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			Logger.info(`Loading command: ${filePath}`);
			const command = require(filePath);
			if ('data' in command && 'execute' in command && 'category' in command) {
				if (command.category === 'dev') {
					devCommands.push(command.data.toJSON());
				} else {
					commands.push(command.data.toJSON());
				}
			} else {
				Logger.warn(`The command at ${filePath} is missing a required "data", "execute" or "category" property.`);
			}
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(DISCORD_TOKEN);

// and deploy your commands!
async function reloadGuildSlashCommands(guildId) {
	if (commands.length === 0) {
		loadCommands();
	}
	try {
		const IS_DEV_GUILD = guildId === config["development"].guild;
		const guildCommands = IS_DEV_GUILD ? devCommands : [];
		Logger.info(`Started refreshing guild ${guildCommands.length} application (/) commands.`);

		if (IS_DEV_GUILD) {
			Logger.info('Development guild detected. Using dev commands.');
		} else {
			// exit early if the guild is not the development guild
			Logger.info('TODO: Extra non-global commands for specific guilds. Is empty for now.');
		}

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(DISCORD_CLIENT_ID, guildId),
			{
				body: guildCommands
			},
		);

		Logger.info(`Successfully reloaded guild ${data.length} application (/) commands.`);
	} catch (error) {
		Logger.error(error);
	}
};

async function reloadGlobalSlashCommands() {
	if (commands.length === 0) {
		loadCommands();
	}
	try {
		Logger.info(`Started refreshing global ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(DISCORD_CLIENT_ID),
			{
				body: commands
			},
		);

		Logger.info(`Successfully reloaded global ${data.length} application (/) commands.`);
	} catch (error) {
		Logger.error(error);
	}
};

module.exports = { reloadGlobalSlashCommands, reloadGuildSlashCommands };
