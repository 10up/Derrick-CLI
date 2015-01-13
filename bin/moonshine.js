#!/usr/bin/env node
var moonshine = require("../src"),
		args = require('minimist')(process.argv.slice(2), {
			string: ['port'],
			alias : {port: 'p'}
		});

var port = parseInt(args.port, 10);
if (isNaN(port) || 'number' !== typeof port || port < 1) {
	port = 239;
}

var connection = moonshine.connect(port, function () {
	console.log('Connected');
	this.close();
});
