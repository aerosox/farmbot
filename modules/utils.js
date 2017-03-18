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
