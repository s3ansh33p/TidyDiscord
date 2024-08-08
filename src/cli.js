const { setup } = require('./utils/Mongo');
const { reloadGlobalSlashCommands, reloadGuildSlashCommands } = require('./utils/DiscordRest');

const args = process.argv.slice(2);

function help() {
  console.log('Usage: cli.js [command]');
  console.log('Commands:');
  console.log('  setup [dev|prod] - Setup the MongoDB database.');
  console.log('  global           - Reload global slash commands.');
  console.log('  guild [guildId]  - Reload guild slash commands.');
}

if (args.length === 0) {
  help();
  process.exit(1);
}
switch (args[0]) {
  case 'setup':
    if (args.length !== 2) {
      help();
      process.exit(1);
    }
    const shortMap = {
      'dev': 'development',
      'prod': 'production'
    };
    const env = shortMap[args[1]];
    if (!env) {
      help();
      process.exit(1);
    }
    setup(env);
    break;
  case 'global':
    reloadGlobalSlashCommands();
    break;
  case 'guild':
    if (args.length !== 2) {
      help();
      process.exit(1);
    }
    reloadGuildSlashCommands(args[1]);
    break;
  default:
    help();
    process.exit(1);
}
