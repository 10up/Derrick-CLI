var util = require('util'),
		path = require('path'),
		resolve = require('./resolve'),
		VM = require('../vm'),
		mkdirp = require('mkdirp'),
		resources = require('../resources');

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
	msg += '\n';
	if (msg) {
		if (code) {
			process.stderr.write(msg);
		} else {
			process.stdout.write(msg);
		}
	}
	process.exit(code);
}

function doImport(configuration) {
	'use strict';
	if (!configuration) {
		_exit(1, 'No configuration specified!');
	}
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

	var installProcedure = function (resource) {
		return function (err) {
			if (err) {
				_exit(1, err);
			}
			try {
				resource.install(path.join(project, resource.path)).then(null, function (err) {
					_exit(1, err);
				});
			} catch (e) {
				_exit(1, e);
			}
		};
	};

	for (x = 0; x < data.dev_resources.length; x += 1) {
		try {
			var resource = new resources.VcsResource(data.dev_resources[x]);
			mkdirp(path.dirname(path.join(project, resource.path)), installProcedure(resource));
		} catch (e) {
			_exit(1, e);
		}
	}
}
