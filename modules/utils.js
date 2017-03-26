'use strict';

var config;

module.exports.config = (key) => {
	return config[key];
};

var debug = module.exports.debug = (msg) => {
	if(config['debug-mode']) {
		if(typeof msg === 'object') msg = JSON.stringify(msg);
		console.log('[DEBUG] ' + msg);
	}
};

// Try loading config.json
try {
	config = require('../config.json');
	debug('Config file loaded successfully!');
} catch(err) {
	console.log('Error reading config file!\n');
	throw err;
}

module.exports.keyboardAgentLevel = {
	parse_mode: 'Markdown',
	reply_markup: {
		keyboard: [
			[  '1',  '2',  '3',  '4' ],
			[  '5',  '6',  '7',  '8' ],
			[  '9', '10', '11', '12' ],
			[ '13', '14', '15', '16' ]
		],
		one_time_keyboard: true
	}
};
