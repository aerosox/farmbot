'use strict';

var tgbot = require('node-telegram-bot-api');

var utils = require('./utils');
var config = utils.config, debug = utils.debug;

var bot = new tgbot(config('bot-token'), { polling: true });

bot.getMe().then((me) => {
	debug('Bot working! @' + me.username + ' / ' + me.id);
});

module.exports = bot;
