var NPromise = require('promise');

module.exports = resolveConfigFile;

function resolveConfigFile(config) {
	'use strict';
	return /^(https?):\/\//.test(config) ?
			resolveRemoteConfigFile(config) :
			resolveLocalConfigFile(config);
}

function resolveRemoteConfigFile(config) {
	'use strict';
	var transport,
			url = require('url').parse(config),
			opts;
	transport = require(url.protocol.replace(/:$/, ''));
	opts = {
		hostname: url.hostname,
		path    : url.path
	};
	if (url.port) {
		opts.port = url.port;
	}
	if (url.auth) {
		opts.auth = url.auth;
	}
	return new NPromise(function (resolve, reject) {
		var request = transport.request(opts, function (response) {
			var data;
			response.on('data', function (chunk) {
				data += chunk.toString('utf8');
			});
			response.on('end', function () {
				if (data) {
					resolve(data.toString('utf8'));
				} else {
					reject('No data received!');
				}
			});
		});
		request.on('error', reject);
		request.end();
	});
}

function resolveLocalConfigFile(config) {
	'use strict';
	var fs = require('fs');
	return new NPromise(function (resolve, reject) {
		fs.readFile(config, {encoding: 'utf8'}, function (err, data) {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
}
