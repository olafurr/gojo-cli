var fs = require('fs'),
	chalk = require('chalk'),
	readline = require('readline2'),
	exec = require('child_process').exec,
	spawn = require('child_process').spawn,
	async = require('async'),
	_ = require('underscore');

var readline = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: true
});

module.exports = function (cli, generator) {

	var absolutePath = process.cwd();
	var slicedPath = absolutePath.split('/');
	var currentDir = slicedPath[slicedPath.length - 1];

	var booleanQuestion = function (question, callback) {
		question = cli.prefix + chalk.cyan(' - ' + cli.generator) + '  ' + question + ' (y/n)\t';
		readline.question(question, function (answer) {
			if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
				callback(true);
			} else {
				callback(false);
			}
		});
	};

	var stringQuestion = function (question, callback) {
		question = cli.prefix + chalk.cyan(' - ' + cli.generator) + '  ' + question + ' ';
		readline.question(question, function (answer) {
			callback(answer);
		});
	};

	var installDependency = function (dependency, packageMangaer, dev) {

	};

	var info = function (message) {
		console.log(cli.prefix + chalk.cyan(' - ') + chalk.cyan(generator) + '  ' + chalk.yellow(message) + ' ');
	};

	var log = function (message) {
		console.log(cli.prefix + chalk.cyan(' - ') + chalk.cyan(generator) + '  ' + chalk.white(message));
	};

	var success = function (message) {
		console.log(cli.prefix + chalk.cyan(' - ') + chalk.cyan(generator) + '  ' + chalk.green(message));
	};

	var walkDir = function (dir, path) {
		if (!dir) {
			return;
		}
		_.each(dir, function (val, key) {
			if (typeof val !== 'string') {
				log('Creating directory: ' + path + val.name);
				fs.mkdirSync(absolutePath + path + val.name);
				walkDir(val.directories, path + val.name + '/');
			} else {
				log('Creating directory: ' + path + val);
				fs.mkdirSync(absolutePath + path + val);
				walkDir(null);
			}
		});
	};

	success(generator + ' generator !\n');

	var didNpm = false;
	var didBower = false;

	async.series(
		[

			function (done) {
				info('Generating package.json...');
				var packageJsonContents = {};
				var index = 0;
				async.whilst(
					function () {
						return cli.utils.generators[generator].packageJson.length > index;
					},
					function (finishedQ) {
						var q = cli.utils.generators[generator].packageJson[index];
						stringQuestion(q + ':', function (answer) {
							if (answer === '') {
								packageJsonContents[q] = '';
							} else {
								packageJsonContents[q] = answer;
							}
							index++;
							finishedQ();
						});
					}, function (err) {

						var pkg = JSON.stringify(packageJsonContents, null, '\t');
						console.log('\n' + pkg);
						booleanQuestion('Is this okay ?', function (okay) {
							if (okay) {
								didNpm = true;
								fs.writeFile(absolutePath + '/package.json', pkg, function (err) {
									success('Created package.json.');
									done();
								});
							} else {
								console.log('\n');
								done();
							}
						});

					}
				);
			},
			function (done) {
				info('Generating bower.json...');
				var bowerJsonContents = {};
				var index = 0;
				async.whilst(
					function () {
						return cli.utils.generators[generator].bowerJson.length > index;
					},
					function (finishedQ) {
						var q = cli.utils.generators[generator].bowerJson[index];
						stringQuestion(q + ':', function (answer) {
							if (answer === '') {
								bowerJsonContents[q] = '';
							} else {
								bowerJsonContents[q] = answer;
							}
							index++;
							finishedQ();
						});
					}, function (err) {

						var pkg = JSON.stringify(bowerJsonContents, null, '\t');
						console.log(pkg);
						booleanQuestion('Is this okay ?', function (okay) {
							if (okay) {
								didBower = true;
								fs.writeFile(absolutePath + '/bower.json', pkg, function (err) {
									success('Created bower.json.');
									done();
								});
							} else {
								console.log('\n');
								done();
							}
						});

					}
				);
			},
			function (done) {
				info('Setting up directories...\n');

				var directories = cli.utils.generators[generator].directories;

				walkDir(directories, '/');
				success('Finished creating directories.');
				done();
			},
			function (done) {
				info('Installing dependencies...\n');
				async.series(
					[

						function (cb) {
							if (didNpm) {
								var npmDev = cli.utils.generators[generator].npmdev;
								var npm = cli.utils.generators[generator].npm;
								var index = 0;

								async.whilst(
									function () {
										return npmDev.length > index;
									},
									function (npmDevDone) {
										var dep = npmDev[index];
										info('Installing dependency: ' + dep);
										exec('cd ' + absolutePath + ' && npm install ' + dep + ' --save-dev', function (err, data) {
											console.log(data);
											index++;
											npmDevDone();
										});

									},
									function (err) {
										index = 0;
										async.whilst(
											function () {
												return npm.length > index;
											},
											function (npmDone) {
												var dep = npm[index];
												info('Installing dependency: ' + dep);
												exec('cd ' + absolutePath + ' && npm install ' + dep + ' --save', function (err, data) {
													console.log(data);
													index++;
													npmDone();
												});
											},
											function (err) {
												cb();
											}
										);
									}
								);

							} else {
								cb();
							}
						},
						function (cb) {
							if (didBower) {
								var index = 0;
								var bower = cli.utils.generators[generator].bower;
								async.whilst(
									function () {
										return bower.length > index;
									},
									function (bowerDone) {
										var dep = bower[index];
										info('Installing dependency: ' + dep);
										exec('cd ' + absolutePath + ' /public && bower install ' + dep + ' --save', function (err, data) {
											console.log(data);
											index++;
											bowerDone();
										});
									},
									function (err) {
										cb();
									}
								);
							} else {
								cb();
							}
						}
					], function (err, results) {
						done();
					}
				);
			}
		], function (err, results) {
			success('Successfully created an angular project, good luck !');
			readline.close();
		}
	);


	// async.series(
	// 	[	
	// 		function (scb) {
	// 			question(chalk.yellow('Setup directories '), function (setup) {
	// 				if (setup) {
	// 					_.each(directories, function (val, key) {
	// 						fs.mkdirSync(dir + '/' + key);
	// 						if (typeof val === 'array' || val.length > 0) {
	// 							for (var i in val) {
	// 								fs.mkdirSync(dir + '/' + key + '/' + val[i]);
	// 							}
	// 						}
	// 					});
	// 					console.log(chalk.red('Finished setting up directories...'));

	// 					scb();
	// 				} else {
	// 					scb();
	// 				}
	// 			});
	// 		},
	// 		function (scb) {
	// 			async.whilst(
	// 				function () { return index < dependencies.length},
	// 				function (callback) {
	// 					question(chalk.yellow('Install ' + dependencies[index] + ' ?'), function (install) {
	// 						if (install) {
	// 							if (fs.existsSync(dir + '/public')) {
	// 								executeCommand('cd ' + dir + '/public' + ' && bower install ' + dependencies[index], function (err, stdout) {
	// 									console.log(stdout);
	// 									index++;
	// 									callback();
	// 								});
	// 							} else {
	// 								executeCommand('cd ' + dir + ' && bower install ' + dependencies[index], function (err, stdout) {
	// 									console.log(stdout);
	// 									index++;
	// 									callback();
	// 								});
	// 							}

	// 						} else {
	// 							index++;
	// 							callback();
	// 						}
	// 					});
	// 				},
	// 				function (err) {
	// 					console.log(chalk.red('Finished building project'));
	// 					scb();
	// 				}
	// 			);
	// 		}
	// 	],
	// 	function (err, results) {
	// 		readline.close();
	// 	}
	// );
};