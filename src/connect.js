var sockets = {},
		io = require('socket.io-client'),
		url = require('url');

module.exports = connectToServer;

/**
 * Connect to the server
 * @param {number=} port Defaults to 239
 * @param {function=} onConnect Optional function to run on connect
 * @returns {*}
 */
function connectToServer(port, onConnect) {
	"use strict";

	// Set up default arguments and handle optional args being omitted
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
	});

	var socket = sockets[location] ? sockets[location].sock : undefined;

	var connecting = sockets[location] ? sockets[location].connecting : undefined;

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
}
