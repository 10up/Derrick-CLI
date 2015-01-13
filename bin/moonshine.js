#!/usr/bin/env node
var moonshine = require("../src");

var connection = moonshine.connect();

connection.on('connect',function(){
	connection.close();
});
