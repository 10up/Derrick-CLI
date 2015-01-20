var util = require('util'),
		path = require('path'),
		resolve = require('./resolve'),
		VM = require('../vm'),
		mkdirp = require('mkdirp');

module.exports = doImport;

function doImport(configuration) {
	'use strict';
	if (!configuration) {
		throw new Error('No configuration specified!');
	}
	resolve(configuration).then(parseConfig, function (thing) {
		if (util.isError(thing)) {
			thing = thing.message;
		}
		process.stderr.write(thing + '\n');
		process.exit(1);
	});
}

function parseConfig(thing) {
	'use strict';
	var data;
	try {
		data = JSON.parse(thing);
	} catch (e) {
		process.stderr.write('Could not parse JSON!\n\n' +
		'Error message:\n' + e + '\n');
		process.exit(1);
	}
	var requiredFields = [
				'name',
				'maintainer',
				'dev-resources',
				'vendor-resources',
				'database',
				'uploads'
			],
			x = 0;
	for (; x < requiredFields.length; x += 1) {
		if (undefined === data[requiredFields[x]]) {
			process.stderr.write(util.format('%s is a required field!\n', requiredFields[x]));
			process.exit(1);
		}
	}
	var vm;
	try {
		vm = new VM(process.cwd());
	} catch (e) {
		process.stderr.write('Error: ' + e + '\n');
		process.exit(1);
	}
	var projects = path.join(vm.root, 'projects'),
			project = path.join(projects, data.name),
			cache = path.join(vm.root, '_cache'),
			errorCase = function (err) {
				if (err) {
					process.stderr.write('Could not create path!\n' + err + '\n');
					process.exit(1);
				}
			};
	mkdirp(project, errorCase);
	mkdirp(cache, errorCase);
}
