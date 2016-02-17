#!/usr/bin/env node

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('redis');
var redisClient = redis.createClient();

redisClient.on("error",function(err){
	console.log("Error: " + err);
});


io.on('connection', function(client){

	//log to console when users connect and disconnect
	console.log('Client connected...');
	client.on('disconnect',function(){
		console.log('Client disconnected');
	});


	//When a "messages" event comes in, log the message to the console and emit back to clients
	client.on('messages',function(data){
		var userName = client.userName;
		console.log(data);

		//send to redis db client (10 most recent messages)
		var storeMessage = function(userName, data){
			var redisMessage = JSON.stringify({userName: userName, data: data});
			redisClient.lpush("redisMessages",redisMessage, function(err,response){
				redisClient.ltrim("redisMessages",0,9);
			});
		};

		storeMessage(userName,data)


		//emit to client
		client.emit('messages',userName + ": " + data);
		client.broadcast.emit('messages',userName + ": " + data);
	});

	//establish client username
	client.on('join',function(nickName){
		client.userName = nickName;

		//retrieve most recent messages and send to client
		redisClient.lrange("redisMessages",0,-1,function(err,redisMessages){
			redisMessages = redisMessages.reverse();
			redisMessages.forEach(function(message){
				message = JSON.parse(message);
				client.emit("messages",message.userName + ": " + message.data);
			});
		});
	});

	
});

app.get('/',function(req,res){
	res.sendFile(__dirname + '/index.html');
});

server.listen(8080);

console.log('DanChat initialized');