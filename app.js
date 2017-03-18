'use strict';

var fs = require('fs');

var mongo = require('mongodb').MongoClient;
var tgbot = require('node-telegram-bot-api');

var utils = require('./modules/utils');
var config = utils.config;
var debug = utils.debug;

// Check mongodb
mongo.connect(config('mongo-url'), (err, db) => {
	if(err) {
		console.log('Error connecting to mongodb!\n');
		throw err;
	} else debug('Connected to mongodb successfully!');
});

var bot = new tgbot(config('bot-token'), { polling: true });

// /dumpdb [admin only]
bot.onText(/\/dumpdb ([a-zA-Z]+)/, (msg, match) => {
	debug('/dumpdb issued');
	debug(match);
	
	const username = '@' + msg.from.username;
	const collection = match[1];
	
	// Make sure sender is an admin
	if(config('admins').indexOf(username) === -1) return;
	
	mongo.connect(config('mongo-url'), (err, db) => {
		if(err) throw err;
		
		db.collection(collection).find().toArray((err, docs) => {
			if(err) throw err;
			
			if(docs.length === 0) {
				// Nothing to dump
				bot.sendMessage(msg.chat.id, 'Collection ' + collection + ' empty!');
			} else bot.sendMessage(msg.chat.id, JSON.stringify(docs));
		});
	});
});

// /ping
bot.onText(/\/ping/, (msg, match) => {
	debug('/ping issued');
	bot.sendMessage(msg.chat.id, 'Pong!');
});

// /start
bot.onText(/\/start/, (msg, match) => {
	debug('/start issued');
	
	// Make sure the message was sent in a private chat
	if(msg.chat.type !== 'private') return;
	
	const chatId = msg.chat.id;
	
	// Check if user already exists in database
	mongo.connect(config('mongo-url'), (err, db) => {
		if(err) throw err;
		
		db.collection('users').find({ id: chatId }).toArray((err, docs) => {
			if(err) throw err;
			
			if(docs.length === 0) {
				// User is not in db
				db.collection('users').insertOne({
					id: chatId, // Telegram id
					agentname: '', // Ingress player name
					level: '', // Ingress level (1-16)
					configlevel: 0 // Needs to tell agentname (configlevel 1) and level (configlevel 2)
				}, (err, result) => {
					if(err) throw err;
					
					bot.sendMessage(chatId, 'Hello there!\nBefore we can start farming, we\'ll need some basic information about you.\nWhat\'s your agent name in Ingress?');
				});
			} else {
				// User already in db
				bot.sendMessage(chatId, 'You have already registered yourself!\nIf you need to register again, use /reset');
			}
		});
	});
});

// /reset
bot.onText(/\/reset/, (msg, match) => {
	debug('/reset issued');
	
	// Make sure the message was sent in a private chat
	if(msg.chat.type !== 'private') return;
	
	const chatId = msg.chat.id;
	
	// Find the user in the database
	mongo.connect(config('mongo-url'), (err, db) => {
		if(err) throw err;
		
		db.collection('users').find({ id: chatId }).toArray((err, docs) => {
			if(err) throw err;
			
			if(docs.length === 0) {
				// User not in db
				bot.sendMessage(chatId, 'You don\'t exist in my database at all. Use /start to register yourself.');
			} else {
				// Remove user from the database
				db.collection('users').deleteOne({ id: chatId }, (err, result) => {
					debug('Deleted entry for id ' + chatId + ' from database: ' + result);
					bot.sendMessage(chatId, 'You have been removed from my database.\nUse /start to re-register.');
				});
			}
		});
	});
});

bot.on('message', (msg) => {
	debug(msg);
});
