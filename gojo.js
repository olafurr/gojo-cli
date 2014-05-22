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

var welcome = chalk.green('\n\n\n' + pkg.name + ' - CLI\n');
welcome += chalk.green(pkg.name + ' v' + pkg.version + ' - node ' + process.version);
welcome += '\n\n';


var cli = {
	pkg: pkg,
	utils: utils,
	welcomeMessage: welcome,
	prefix: chalk.bold.cyan('[' + pkg.name + ']')
};



if (args.length > 0) {
	if (fs.existsSync(__dirname + '/tasks/' + args[0] + '.js')) {
		cli.task = args[0];
		if (args.length > 1) {
			if (utils.generators.hasOwnProperty(args[1])) {
				cli.generator = args[1];
				require(__dirname + '/tasks/' + args[0] + '.js')(cli, args[1]);
			}
		} else {
			console.log(cli.prefix + chalk.bold.green(' Please provide a generator, available generators:'));
			_.each(utils.generators, function (val, key) {
				console.log(cli.prefix + chalk.yellow('\t' + key));
			});
		}
	} else {
		console.log(chalk.bold.red('Unknown option: ' + args[0]));
	}
} else {
	console.log(cli.prefix + ': ' + chalk.green(pkg.name + ' - CLI'));
	console.log(cli.prefix + ': ' + chalk.green(pkg.name + ' v' + pkg.version + ' - node ' + process.version));
	console.log('\n');
	console.log(cli.prefix + ': ' + chalk.cyan.underline.blue('Commands\n'));
	console.log(cli.prefix + ': ' + chalk.cyan('Generate Angular webapp'));
	console.log(cli.prefix + ': gojo init angular\n');
}