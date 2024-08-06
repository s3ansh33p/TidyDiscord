const chalk = require('chalk');
const util = require('util')

class Logger {

    static get prefix() {
        const now = new Date();
        const formattedDate = now.toLocaleString('en-AU', { 
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'Australia/Perth'
        });
        const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
        return chalk.gray(`${formattedDate}.${milliseconds}`);
    }

    static formatInput(args) {
        return args.map((arg) => arg instanceof Object ? util.inspect(arg) : arg)
    }

    static info(...args) {
        args = this.formatInput(args)
        console.log(this.prefix + ' ' + chalk.green('[INFO]') + ' ' + args.join(' '))
    }

    static warn(...args) {
        args = this.formatInput(args)
        console.log(this.prefix + ' ' + chalk.yellow('[WARN]') + ' ' + args.join(' '))
    }

    static error(...args) {
        args = this.formatInput(args)
        console.log(this.prefix + ' ' + chalk.red('[ERROR]') + ' ' + args.join(' '))
    }

    static route(...args) {
        args = this.formatInput(args)
        console.log(this.prefix + ' ' + chalk.cyan('[ROUTE]') + ' ' + args.join(' '))
    }

}

module.exports = Logger;