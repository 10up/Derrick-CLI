var sockets = {},
		io = require('socket.io-client'),
		url = require('url');

module.exports = function (port) {
	"use strict";
	port = port || 239;
	var location = url.format({
				protocol: 'http',
				hostname: 'moonshine',
				port    : port
			}),
			socket = sockets[location] ? sockets[location].sock : undefined,
			connecting = sockets[location] ? sockets[location].connecting : undefined;
	if (socket && (socket.connected || connecting)) {
		return socket;
	}
	sockets[location] = {
		sock      : io(location),
		connecting: true
	};
	socket = sockets[location].sock;
	socket.on('connect', function () {
		sockets[location].connecting = false;
	});
	socket.on('error', function () {
		sockets[location].connecting = false;
	});
	return socket;
};
