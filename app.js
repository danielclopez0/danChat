#!/usr/bin/env node

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);


io.on('connection', function(client){

	//log to console when users connect and disconnect
	console.log('Client connected...');
	client.on('disconnect',function(){
		console.log('Client disconnected');
	});

	//establish client username
	client.on('join',function(nickName){
		client.userName = nickName;
	});

	//When a "messages" event comes in, log the message to the console and emit back to clients
	client.on('messages',function(data){
		var userName = client.userName;
		var message = userName + ": " + data; 
		console.log(data);
		client.emit('messages',message);
		client.broadcast.emit('messages',message);
	});
});

app.get('/',function(req,res){
	res.sendFile(__dirname + '/index.html');
});

server.listen(8080);

console.log('DanChat initialized');