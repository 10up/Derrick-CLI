var sockets = {},
		io = require('socket.io-client'),
		url = require('url');

module.exports = function (port, onConnect) {
	"use strict";
	if ("function" === typeof port) {
		onConnect = port;
		port = 239;
	}
	port = port || 239;
	onConnect = onConnect || function () {
	};
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
		onConnect.apply(socket, arguments);
	});
	socket.on('error', function () {
		sockets[location].connecting = false;
	});
	return socket;
};
