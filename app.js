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
bot.onText(/\/start$/, (msg, match) => {
	if(msg.chat.type !== 'private') bot.sendMessage(msg.chat.id, '/start can\'t be used in group chats.');
	else cmd.start(msg.chat.id);
});

// /start newfarm
// Invoked from the inline menu
bot.onText(/\/start newfarm/, (msg, match) => {
	if(msg.chat.type !== 'private') bot.sendMessage(msg.chat.id, '/start can\'t be used in group chats.');
	else if(msg.chat.type === 'private') cmd.newfarm(msg.chat.id);
});

// /newfarm
bot.onText(/\/newfarm/, (msg, match) => {
	if(msg.chat.type !== 'private') bot.sendMessage(msg.chat.id, '/start can\'t be used in group chats.');
	else if(msg.chat.type === 'private') cmd.newfarm(msg.chat.id);
});

// /reset
bot.onText(/\/reset/, (msg, match) => {
	if(msg.chat.type !== 'private') bot.sendMessage(msg.chat.id, '/reset can\'t be used in group chats.');
	else cmd.reset(msg.chat.id);
});

bot.onText(/\/changeagenname/, (msg, match) => {
	if(msg.chat.type !== 'private') bot.sendMessage(msg.chat.id, '/changeagentname can\'t be used in group chats.');
	else cmd.changeagentname(msg.chat.id);
});

bot.onText(/\/changelevel/, (msg, match) => {
	if(msg.chat.type !== 'private') bot.sendMessage(msg.chat.id, '/changelevel can\'t be used in group chats.');
	else cmd.changelevel(msg.chat.id);
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
		db.users.getTodo(chatId, (todo) => {
			if(todo === undefined) bot.sendMessage(chatId, 'Please register first with /start');
			else if(todo === 'RegisterAgentNameAndLevel') {
				const agentname = text.trim().split(' ').join('').replace(/@/g, '');
				
				db.users.updateAgentName(chatId, agentname, () => {
					db.users.setTodo(chatId, 'RegisterAgentLevel', () => {
						bot.sendMessage(chatId, 'Your agent name is now set to @' + agentname + '\n'
							+ '(use /changeagentname to change it)\n\n'
							+ '_Now, what\'s your level in Ingress?_',
							utils.keyboardAgentLevel);
					});
				});
			} else if(todo === 'RegisterAgentLevel') {
				const level = text.trim().split(' ').join('').replace(/[^0-9]/g, '');
				
				if(level === '' || (parseInt(level) > 16 || parseInt(level) < 1)) {
					bot.sendMessage(chatId, 'Please send your level in Ingress as an integer between 1 and 16');
				} else db.users.updateLevel(chatId, level, () => {
					db.users.setTodo(chatId, 'Idle', () => {
						bot.sendMessage(chatId, 'Your level is now set to ' + level + '\n'
							+ '(use /changelevel to change it)\n\n'
							+ '*Registration complete!* You can now create and join farms,'
							+ 'use /help for help.', { parse_mode: 'Markdown' });
					});
				});
			} else if(todo === 'ChangeAgentLevel') {
				const level = text.trim().split(' ').join('').replace(/[^0-9]/g, '');
				
				if(level === '' || (parseInt(level) > 16 || parseInt(level) < 1)) {
					bot.sendMessage(chatId, 'Please send your level in Ingress as an integer between 1 and 16');
				} else db.users.updateLevel(chatId, level, () => {
					db.users.setTodo(chatId, 'Idle', () => {
						bot.sendMessage(chatId, 'Your level has been changed to ' + level);
					});
				});
			}
		});
	}
});

// Called on every inline query
bot.on('inline_query', (msg) => {
	const queryId = msg.id;
	const queryText = msg.query;
	const querySender = msg.from.id;
	
	var result = [
		{
			type: 'location',
			id: 'test',
			latitude: 0.0,
			longitude: 0.0,
			title: 'test'
		}
	];
	
	debug('Inline query by ' + msg.from.id);
	debug(JSON.stringify(msg));
	
	bot.answerInlineQuery(queryId, result, {
		is_personal: true,
		switch_pm_text: 'Create new farm',
		switch_pm_parameter: 'newfarm'
	});
});

