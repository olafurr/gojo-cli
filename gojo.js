#!/usr/bin/env node

var args = process.argv.slice(2);

var fs = require('fs');
var chalk = require('chalk');
var readline = require('readline');
var pkg = require(__dirname + '/package.json');
var utils = require(__dirname + '/utils.json');
var _ = require('underscore');

// Let's change the name to something fancy
pkg.name = 'GoJo';


// Prompt welcome message

console.log(chalk.green('\n\n\n' + pkg.name + ' - CLI\n'));
console.log(chalk.green(pkg.name + ' v' + pkg.version + ' - node ' + process.version) + '\n\n');


var cli = {
	pkg: pkg,
	utils: utils,
	prefix: chalk.bold.cyan('[' + pkg.name + ']'),
	info: function (message) {
		console.log(cli.prefix + chalk.cyan(' - ') + chalk.yellow(message));
	},
	log: function (task, message) {
		console.log(cli.prefix + chalk.cyan(' - ') + chalk.cyan(task) + '  ' + chalk.white(message));
	},
	success: function (message) {
		console.log(cli.prefix + chalk.cyan(' - ') + chalk.green(message));
	},
	error: function (message) {
		console.log(cli.prefix + chalk.cyan(' - ') + chalk.red(message));
	}

};


if (args.length > 1) {
	if (fs.existsSync(__dirname + '/tasks/' + args[0] + '.js')) {
		if (args.length > 1) {
			require(__dirname + '/tasks/' + args[0] + '.js')(cli, args[1]);
		}
	} else {
		console.log(chalk.bold.red('Unknown task: ' + args[0]));
	}
} else {
	console.log(cli.prefix + ': ' + chalk.green(pkg.name + ' - CLI'));
	console.log(cli.prefix + ': ' + chalk.green(pkg.name + ' v' + pkg.version + ' - node ' + process.version));
	console.log('\n');
	console.log(cli.prefix + ': ' + chalk.cyan.underline.blue('Commands\n'));
	console.log(cli.prefix + ': ' + chalk.cyan('Generate webapp'));
	console.log(cli.prefix + ': gojo init <project name>\n');
}