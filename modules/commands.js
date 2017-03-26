'use strict';

var utils = require('./utils');
var config = utils.config, debug = utils.debug;

var bot = require('./bot');
var db = require('./database');

// [Admin only] /dumpdb <collection>
module.exports.dumpdb = (senderName, chatId, collection) => {
	db.getCollection(collection, (docs) => {
		if(docs.length === 0) bot.sendMessage(chatId, 'Collection ' + collection + ' is empty!');
		else bot.sendMessage(chatId, JSON.stringify(docs));
	});
};

// /start
module.exports.start = (userId) => {
	db.users.findUser(userId, (doc) => {
		if(!doc) {
			// No database entry for user, create one
			db.users.addUser({
				id: userId, // Telegram user id
				agentname: '', // Ingress agent name
				level: 0, // Ingress level (1-16)
				todo: 'AgentNameAndLevel'
			}, (result) => {
				debug('Created database entry for id ' + userId + ': ' + result);
				bot.sendMessage(userId, '*Hello there!*\n\n'
					+ 'Before we can start farming, we\'ll need some basic information about you.\n\n'
					+ '_What\'s your Ingress agent name?_', { parse_mode: 'Markdown' });
			});
		} else bot.sendMessage(userId, 'You have already registered!\n\nIf you want to re-register, use /reset');
	});
};


// /reset
module.exports.reset = (userId) => {
	db.users.findUser(userId, (doc) => {
		if(!doc) bot.sendMessage(userId, 'You don\'t seem to exist in the database at all. Use /start to register.');
		else db.users.deleteUser(userId, (result) => {
			debug('Deleted database entry for id ' + userId + ': ' + result);
			bot.sendMessage(userId, 'You have been removed from the database.\n\n'
				+ 'Use /start if you wish to re-register.');
		});
	});
};

module.exports.changeagentname = (userId) => {
	// TODO
	bot.sendMessage(userId, 'Not yet implemented. Re-register with /reset for now.');
};

module.exports.changelevel = (userId) => {
	db.users.setTodo(userId, 'ChangeAgentLevel', () => {
		bot.sendMessage(userId, 'What is your level in Ingress?', utils.keyboardAgentLevel);
	});
};

module.exports.newfarm = (userId) => {
	if(db.locations.getLocationsForUser(userId, 5, (docs) => {
		if(docs.length === 0) {
			bot.sendMessage(userId, '*Alright, let\'s create ourselves a new farm!*\n\n'
				+ 'Where whould this farm take place?\n'
				+ '(Please send me a location or venue from the location menu)',
				{ parse_mode: 'Markdown' });
		} else {
			var opts = {
				parse_mode: 'Markdown',
				reply_markup: {
					keyboard: [],
					one_time_keyboard: true
				}
			};
			
			docs.forEach((doc) => {
				opts.reply_markup.keyboard.push('[' + (opts.reply_markup.keyboard.length+1) + '] '
					+ doc.name);
			});
			
			bot.sendMessage(userId, '*Alright, let\'s create ourselves a new farm!*\n\n'
				+ 'Where whould this farm take place?\n'
				+ '(Please send me a location or venue from the location menu, '
				+ 'or choose one of your recently used locations)', opts);
		}
	}));
};
