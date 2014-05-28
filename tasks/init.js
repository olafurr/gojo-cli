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

var absolutePath = process.cwd();
var slicedPath = absolutePath.split('/');
var currentDir = slicedPath[slicedPath.length - 1];

module.exports = function (cli, projectName) {


	// Helpers
	var booleanQuestion = function (question, callback) {
		question = cli.prefix + chalk.cyan(' - ' + projectName) + '  ' + question + ' (y/n)\t';
		readline.question(question, function (answer) {
			if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
				callback(true);
			} else {
				callback(false);
			}
		});
	};

	var stringQuestion = function (question, callback) {
		question = cli.prefix + chalk.cyan(' - ' + projectName) + '  ' + question + ' ';
		readline.question(question, function (answer) {
			callback(answer);
		});
	};


	function installDependency(dependency, packageManager, dev, cb) {
		var shell = 'cd ' + absolutePath + ' && ' + packageManager + ' install ' + dependency + ' --save';
		if (dev) {
			shell += '-dev';
		}
		console.log(shell);
		exec(shell, function (err, data) {
			if (err) {
				console.log(err);
			}
			console.log(data);
			return cb();
		});
	}

	var walkDir = function (dir, path) {
		if (!dir) {
			return;
		}
		_.each(dir, function (val, key) {
			if (typeof val !== 'string') {
				cli.log(projectName, 'Creating directory: ' + path + val.name);
				fs.mkdirSync(absolutePath + path + val.name);
				walkDir(val.directories, path + val.name + '/');
			} else {
				cli.log(projectName, 'Creating directory: ' + path + val);
				fs.mkdirSync(absolutePath + path + val);
				walkDir(null);
			}
		});
	};

	var didNpm = false;
	var didBower = false;

	async.series(
		[

			function (done) {
				cli.info('Generate package.json...');
				var packageJsonContents = {};
				var index = 0;
				var suggestion = '';
				async.whilst(
					function () {
						return cli.utils.generators.angular.packageJson.length > index;
					},
					function (finishedQ) {
						var q = cli.utils.generators.angular.packageJson[index];
						if (q === 'name') {
							suggestion = '(' + projectName + ')';
						} else if (q === 'version') {
							suggestion = '(0.0.0)';
						} else if (q === 'license') {
							suggestion = '(ISC)';
						} else {
							suggestion = '';
						}
						stringQuestion(q + ': ' + suggestion, function (answer) {
							if (answer === '') {
								if (q === 'name') {
									packageJsonContents[q] = projectName;
								} else if (q === 'version') {
									packageJsonContents[q] = '0.0.0';
								} else if (q === 'test command') {
									packageJsonContents.scripts = {
										test: "echo \"Error: no test specified\" && exit 1"
									};
								} else if (q === 'license') {
									packageJsonContents[q] = 'ISC';
								}
							} else {
								if (q === 'git repository') {
									packageJsonContents.repository = {
										type: 'git',
										url: answer
									};
								} else if (q === 'test command') {
									packageJsonContents.scripts = {
										test: answer
									};
								} else if (q === 'keywords') {
									packageJsonContents.keywords = answer.split(',');
								} else {
									packageJsonContents[q] = answer;
								}
							}

							index++;
							finishedQ();
						});
					},
					function (err) {

						var pkg = JSON.stringify(packageJsonContents, null, '\t ');
						console.log('\n ' + pkg);
						booleanQuestion('Is this okay ? ', function (okay) {
							if (okay) {
								didNpm = true;
								fs.writeFile(absolutePath + '/package.json', pkg, function (err) {
									cli.success('Created package.json.');
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
				cli.info('Generate bower.json...');
				var bowerJsonContents = {};
				bowerJsonContents['private'] = true;
				var index = 0;
				async.whilst(
					function () {
						return cli.utils.generators.angular.bowerJson.length > index;
					},
					function (finishedQ) {
						var q = cli.utils.generators.angular.bowerJson[index];
						if (q === 'name') {
							suggestion = '(' + projectName + ')';
						} else if (q === 'version') {
							suggestion = '(0.0.0)';
						} else if (q === 'license') {
							suggestion = '(ISC)';
						} else {
							suggestion = '';
						}
						stringQuestion(q + ': ' + suggestion, function (answer) {
							if (answer === '') {
								if (q === 'name') {
									bowerJsonContents[q] = projectName;
								} else if (q === 'version') {
									bowerJsonContents[q] = '0.0.0';
								} else if (q === 'license') {
									bowerJsonContents[q] = 'ISC';
								}
							} else {
								bowerJsonContents[q] = answer;
							}
							index++;
							finishedQ();
						});
					}, function (err) {

						var pkg = JSON.stringify(bowerJsonContents, null, '\t ');
						console.log(pkg);
						booleanQuestion('Is this okay ? ', function (okay) {
							if (okay) {

								var bowerrc = {
									directory: 'public/bower_components'
								};
								var jsonBowerrc = JSON.stringify(bowerrc, null, '\t');

								didBower = true;
								fs.writeFile(absolutePath + '/bower.json', pkg, function (err) {
									cli.success('Created bower.json.');
									fs.writeFile(absolutePath + '/.bowerrc', jsonBowerrc, function (err) {
										cli.success('Created.bowerrc...');
										done();
									});
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
				cli.info('Setting up directories...\n ');

				var directories = cli.utils.generators.angular.directories;

				walkDir(directories, '/');
				cli.success('Finished creating directories.');
				done();
			},
			function (done) {
				cli.info('Installing dependencies...\n ');
				async.series(
					[

						function (cb) {
							if (didNpm) {
								var npmDev = cli.utils.generators.angular.npmdev;
								var npm = cli.utils.generators.angular.npm;
								var index = 0;

								async.whilst(
									function () {
										return npmDev.length > index;
									},
									function (npmDevDone) {
										var dep = npmDev[index];
										cli.info('Installing dependency : ' + dep);
										installDependency(dep, 'npm', true, function () {
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
												cli.info('Installing dependency: ' + dep);
												installDependency(dep, 'npm', false, function () {
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
								var bower = cli.utils.generators.angular.bower;
								async.whilst(
									function () {
										return bower.length > index;
									},
									function (bowerDone) {
										var dep = bower[index];
										cli.info('Installing dependency: ' + dep);
										installDependency(dep, 'bower', false, function () {
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
					],
					function (err, results) {
						done();
					}
				);
			},
			function (done) {
				cli.info('Creating gulpfile.js ...');

				fs.readFile(__dirname + '/../files/gulpfile.js', function (err, data) {
					fs.writeFile(absolutePath + '/gulpfile.js', data, function (err) {
						cli.success('gulpfile.js created');
						done();
					});
				});
			}
		],
		function (err, results) {
			cli.success('Finished setting up project');
			readline.close();
		}
	);
};