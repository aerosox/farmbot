'use strict';

var fs = require('fs');

var tgbot = require('node-telegram-bot-api');

var utils = require('./modules/utils');
var config = utils.config;
var debug = utils.debug;

var db = require('./modules/database');

// Check mongodb
db.check();

var bot = new tgbot(config('bot-token'), { polling: true });

// /dumpdb [admin only]
bot.onText(/\/dumpdb ([a-zA-Z]+)/, (msg, match) => {
	debug('/dumpdb issued');
	debug(match);
	
	const username = '@' + msg.from.username;
	const collection = match[1];
	
	// Make sure sender is an admin
	if(config('admins').indexOf(username) === -1) return;
	
	db.getCollection(collection, (docs) => {
		if(docs.length === 0) {
			// Nothing to dump
			bot.sendMessage(msg.chat.id, 'Collection ' + collection + ' is empty!');
		} else bot.sendMessage(msg.chat.id, JSON.stringify(docs));
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
				bot.sendMessage(chatId, 'You have been removed from the database.\n\nUse /start if you wish to re-register.');
			});
		}
	});
});

bot.on('message', (msg) => {
	// Skip commands
	if(msg.text[0] === '/') return;
	
	debug(msg);
	
	const chatId = msg.chat.id;
	
	if(msg.chat.type === 'private') {
		db.users.getConfigLevel(chatId, (configlevel) => {
			debug('Configlevel for id ' + chatId + ' is ' + configlevel);
			
			// If configlevel is 0, they are sending the agent name
			// If it is 1, they are sending their level [1-16]
			// 2 means they have completed the config
			// -1 means they haven't yet started the registration process
			
			if(configlevel === -1) {
				bot.sendMessage(chatId, 'Please register first with /start');
			} else if(configlevel === 0) {
				// Get rid of any extra characters
				const agentname = msg.text.trim().split(' ').join('').replace(/@/g, '');
				
				db.users.updateAgentName(chatId, agentname, () => {
					db.users.nextConfigLevel(chatId, () => {
						bot.sendMessage(chatId, 'Your agent name is now set to @' + agentname + ' (use /changeagentname to change it)\n\n_Now, what\'s your level in Ingress?_', { parse_mode: 'Markdown' });
					});
				});
			} else if(configlevel === 1) {
				// Get rid of any extra characters
				const level = msg.text.trim().split(' ').join('').replace(/[^0-9]/g, '');
				
				if(level === '' || (parseInt(level) > 16 || parseInt(level) < 1)) {
					bot.sendMessage(chatId, 'Please send your level in Ingress as an integer between 1 and 16');
					return;
				}
				
				db.users.updateLevel(chatId, level, () => {
					db.users.nextConfigLevel(chatId, () => {
						bot.sendMessage(chatId, 'Your level is now set to ' + level + ' (use /changelevel to change it)\n\nRegistration complete! You can now create and join farms, use /help for help.');
					});
				});
			}
		});
	}
});
