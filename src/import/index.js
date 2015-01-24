var util = require('util'),
		path = require('path'),
		resolve = require('./resolve'),
		VM = require('../vm'),
		mkdirp = require('mkdirp'),
		resources = require('../resources'),
		NPromise = require('promise');

module.exports = doImport;

function _exit(code, msg) {
	"use strict";
	if (code && 'number' !== typeof code) {
		msg = code;
		code = 0;
	}
	code = parseInt(code, 10);
	if (isNaN(code)) {
		code = 0;
	}
	msg += '';
	if (msg) {
		if (code) {
			util.error(msg);
		} else {
			util.debug(msg);
		}
	}
	process.exit(code);
}

function doImport(configuration) {
	'use strict';
	if (!configuration) {
		_exit(1, 'No configuration specified!');
	}
	util.print(util.format('Starting import of %s\n', configuration));
	resolve(configuration).then(parseConfig, function (thing) {
		if (util.isError(thing)) {
			thing = thing.message;
		}
		_exit(1, thing + '\n');
	});
}

function parseConfig(thing) {
	'use strict';
	var data;
	try {
		data = JSON.parse(thing);
	} catch (e) {
		_exit(1, 'Could not parse JSON!\n\n' +
		'Error message:\n' + e + '\n');
	}
	var requiredFields = [
				'name',
				'dev_resources',
				'vendor_resources',
				'database',
				'uploads'
			],
			x = 0;
	for (; x < requiredFields.length; x += 1) {
		if (undefined === data[requiredFields[x]]) {
			_exit(1, util.format('%s is a required field!\n', requiredFields[x]));
		}
	}
	var vm;
	try {
		vm = new VM(process.cwd());
	} catch (e) {
		_exit(1, 'Error: ' + e + '\n');
	}
	var projects = path.join(vm.root, 'projects'),
			project = path.join(projects, data.name),
			cache = path.join(vm.root, '_cache'),
			errorCase = function (err) {
				if (err) {
					_exit(1, 'Could not create path!\n' + err + '\n');
				}
			};
	mkdirp(project, errorCase);
	mkdirp(cache, errorCase);

	util.print('Fetching dev resources...\n');
	var resourcePromises = [];
	for (x = 0; x < data.dev_resources.length; x += 1) {
		try {
			var resource = new resources.VcsResource(data.dev_resources[x]);
			mkdirp.sync(path.dirname(path.join(project, resource.path)));
			util.print(util.format('Fetching %s...\n', resource.name));
			resourcePromises.push(resource.install(path.join(project, resource.path)));
		} catch (e) {
			_exit(1, e);
		}
	}
	NPromise.all(resourcePromises).then(function (res) {
		console.log('Successes:', res);
	}, function (res) {
		_exit(1, util.format('Not all dev resources could be installed!\n%s\n', res));
	});
}
