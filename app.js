'use strict';

var utils = require('./modules/utils');
var config = utils.config, debug = utils.debug;

var db = require('./modules/database');
var bot = require('./modules/bot');
var cmd = require('./modules/commands');

// Check mongodb
db.check();

// /dumpdb
bot.onText(/\/dumpdb ([a-zA-Z]+)/, (msg, match) => {
	if(config('admins').indexOf('@' + msg.from.username) !== -1)
		cmd.dumpdb('@' + msg.from.username, msg.chat.id, match[1]);
});

// /ping
bot.onText(/\/ping/, (msg, match) => {
	bot.sendMessage(msg.chat.id, 'Pong!');
});

// /start
bot.onText(/\/start/, (msg, match) => {
	if(msg.chat.type !== 'private') bot.sendMessage('/start can\'t be used in group chats.');
	else cmd.start(msg.chat.id);
});

// /reset
bot.onText(/\/reset/, (msg, match) => {
	if(msg.chat.type !== 'private') bot.sendMessage('/reset can\'t be used in group chats.');
	else cmd.reset(msg.chat.id);
});

// Called on every message the bot receives
bot.on('message', (msg) => {
	const chatId = msg.chat.id;
	const username = msg.from.username || msg.from.first_name;
	const text = msg.text;
	
	console.log(username + ': ' + text);
	
	// Skip commands
	if(text[0] === '/') return;
	
	if(msg.chat.type === 'private') {
		db.users.getConfigLevel(chatId, (configlevel) => {
			// If configlevel is 0, they are sending the agent name
			// If it is 1, they are sending their level [1-16]
			// 2 means they have completed the config
			// -1 means they haven't yet started the registration process
			
			if(configlevel === -1) bot.sendMessage(chatId, 'Please register first with /start');
			else if(configlevel === 0) {
				// Get rid of any extra characters
				const agentname = text.trim().split(' ').join('').replace(/@/g, '');
				
				db.users.updateAgentName(chatId, agentname, () => {
					db.users.nextConfigLevel(chatId, () => {
						const opts = {
							parse_mode: 'Markdown',
							reply_markup: JSON.stringify({
								keyboard: [
									[  '1',  '2',  '3',  '4' ],
									[  '5',  '6',  '7',  '8' ],
									[  '9', '10', '11', '12' ],
									[ '13', '14', '15', '16' ]
								],
								one_time_keyboard: true
							})
						};
						
						bot.sendMessage(chatId, 'Your agent name is now set to @' + agentname + '\n'
							+ '(use /changeagentname to change it)\n\n'
							+ '_Now, what\'s your level in Ingress?_', opts);
					});
				});
			} else if(configlevel === 1) {
				// Get rid of any extra characters
				const level = text.trim().split(' ').join('').replace(/[^0-9]/g, '');
				
				if(level === '' || (parseInt(level) > 16 || parseInt(level) < 1)) {
					bot.sendMessage(chatId, 'Please send your level in Ingress as an integer between 1 and 16');
				} else db.users.updateLevel(chatId, level, () => {
					db.users.nextConfigLevel(chatId, () => {
						bot.sendMessage(chatId, 'Your level is now set to ' + level + '\n'
							+ '(use /changelevel to change it)\n\n'
							+ '*Registration complete!* You can now create and join farms,'
							+ 'use /help for help.', { parse_mode: 'Markdown' });
					});
				});
			}
		});
	}
});

