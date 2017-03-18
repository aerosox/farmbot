var config;

// Try loading config.json
try {
	config = require('../config.json');
} catch(err) {
	console.log('Error reading config file!\n');
	throw err;
}

module.exports.config = (key) => {
	return config[key];
};

module.exports.debug = (msg) => {
	if(config['debug-mode']) {
		if(typeof msg === 'object') msg = JSON.stringify(msg);
		console.log('[DEBUG] ' + msg);
	}
};
