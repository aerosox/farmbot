'use strict';

var fs = require('fs');

var mongo = require('mongodb').MongoClient;
var tgbot = require('node-telegram-bot-api');

var utils = require('./modules/utils');
var config = utils.config;
var debug = utils.debug;

var db = require('./modules/database');

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
	db.users.findUser(chatId, (doc) => {
		if(!doc) {
			// User does not exist in the database
			db.users.addUser({
				id: chatId, // Telegram id
				agentname: '', // Ingress player name
				level: '', // Ingress level (1-16)
				configlevel: 0 // Needs to tell agentname (configlevel 1) and level (configlevel 2)
			}, (result) => {
				debug('Created database entry for id ' + chatId + ': ' + result);	
				bot.sendMessage(chatId, '*Hello there!*\n\nBefore we can start farming, we\'ll need some basic information about you.\n\n_What\'s your agent name in Ingress?_', { parse_mode: 'Markdown' });
			});
		} else {
			// User already in database
			bot.sendMessage(chatId, 'You are already registered!\n\nIf you want to re-register, use /reset');
		}
	});
});

// /reset
bot.onText(/\/reset/, (msg, match) => {
	debug('/reset issued');
	
	// Make sure the message was sent in a private chat
	if(msg.chat.type !== 'private') return;
	
	const chatId = msg.chat.id;
	
	// Find the user in the database
	db.users.findUser(chatId, (doc) => {
		if(!doc) {
			// User not in db
			bot.sendMessage(chatId, 'You don\'t exist in the database at all.\n\nUse /start to register.');
		} else {
			db.users.deleteUser(chatId, (result) => {
				debug('Deleted entry for id ' + chatId + ' from database: ' + result);
				bot.sendMessage(chatId, 'You have been removed from the database.\n\nUse /start to re-register.');
			});
		}
	});
});

bot.on('message', (msg) => {
	debug(msg);
	
	if(msg.chat.type === 'private') {
		
	}
});
