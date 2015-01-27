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

function _exit_error(msg) {
	"use strict";
	_exit(1, msg);
}

function doImport(configuration) {
	'use strict';
	if (!configuration) {
		_exit_error('No configuration specified!');
	}
	util.print(util.format('Starting import of %s\n', configuration));
	resolve(configuration).then(parseConfig, _exit_error);
}

function parseConfig(thing) {
	'use strict';
	var data;
	try {
		data = JSON.parse(thing);
	} catch (e) {
		_exit_error('Could not parse JSON!\n\n' +
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
			_exit_error(util.format('%s is a required field!\n', requiredFields[x]));
		}
	}
	var vm;
	try {
		vm = new VM(process.cwd());
	} catch (e) {
		_exit_error('Error: ' + e + '\n');
	}

	ensureProjectDirectory(vm, data).then(runProjectImport(data, vm), _exit_error);
}

function runProjectImport(data) {
	"use strict";
	return function () {
		NPromise.all([
			installDevResources(data.dev_resources, data.project),
			createDatabase(data.name)
		]);
	};
}

function ensureProjectDirectory(vm, data) {
	"use strict";
	var mkdir = NPromise.denodeify(mkdirp);
	return new NPromise(function (resolve, reject) {
		var projects = path.join(vm.root, 'projects'),
				project = path.join(projects, data.name),
				cache = path.join(vm.root, '_cache'),
				done = function () {
					resolve(true);
				};
		data.project = project;
		NPromise.all([mkdir(project), mkdir(cache)]).then(done, done);
	});
}

function installDevResources(rawResources, project) {
	"use strict";
	util.print('Fetching dev resources...\n');
	var resourcePromises = [],
			x;
	try {
		for (x = 0; x < rawResources.length; x += 1) {
			var resource = resources.VcsResource.newFromVcs(rawResources[x]);
			mkdirp.sync(path.dirname(path.join(project, resource.path)));
			util.print(util.format('Fetching %s...\n', resource.name));
			resourcePromises.push(resource.install(path.join(project, resource.path)));
		}
	} catch (e) {
		// do nothing
	}
	var all = NPromise.all(resourcePromises);
	all.then(null, function (res) {
		_exit_error(util.format('Not all dev resources could be installed!\n%s\n', res));
	});
	return all;
}

function createDatabase(name) {
	"use strict";
	return new NPromise(function (resolve, reject) {
		try {
			var socket = require('..').connect();
			socket.on('success', function () {
				socket.close();
				resolve(true);
			});
			socket.on('error', function (e) {
				socket.close();
				reject(e);
			});
			setTimeout(function () {
				socket.close();
				reject('Request timed out');
			}, 10000);
			socket.emit('create_db', {name: name});
		} catch (e) {
			reject(e);
		}
	});
}
