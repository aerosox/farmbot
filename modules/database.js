'use strict';

var mongo = require('mongodb').MongoClient;

var utils = require('./utils');
var config = utils.config, debug = utils.debug;

function connect(callback) {
	mongo.connect(config('mongo-url'), (err, db) => {
		if(err) throw err;
		
		callback(db);
	});
}

module.exports.check = () => {
	connect((db) => {
		debug('MongoDB is working!');
	});
};

module.exports.getCollection = (collection, callback) => {
	connect((db) => {
		db.collection(collection).find().toArray((err, docs) => {
			if(err) throw err;
			
			callback(docs);
		});
	});
};

var users = module.exports.users = {
	findUser: (id, callback) => {
		connect((db) => {
			db.collection('users').find({ id: id }).toArray((err, docs) => {
				if(err) throw err;
				
				if(docs.length === 0) callback();
				else if(docs.length === 1) callback(docs[0]);
				else throw 'Database should only ever contain one entry for id ' + id;
			});
		});
	},
	
	addUser: (data, callback) => {
		connect((db) => {
			db.collection('users').insertOne(data, (err, result) => {
				if(err) throw err;
				
				callback(result);
			});
		});
	},
	
	deleteUser: (id, callback) => {
		connect((db) => {
			db.collection('users').deleteOne({ id: id }, (err, result) => {
				if(err) throw err;
				
				callback(result);
			});
		});
	},
	
	getConfigLevel: (id, callback) => {
		users.findUser(id, (doc) => {
			callback(doc.configlevel !== undefined ? doc.configlevel : -1);
		});
	},
	
	updateAgentName: (id, agentname, callback) => {
		connect((db) => {
			db.collection('users').updateOne({ id: id }, {
				$set: {
					agentname: agentname
				}
			}, (err, result) => {
				if(err) throw err;
				
				callback(result);
			});
		});
	},

	updateLevel: (id, level, callback) => {
		connect((db) => {
			db.collection('users').updateOne({ id: id }, {
				$set: {
					level: level
				}
			}, (err, result) => {
				if(err) throw err;
				
				callback(result);
			});
		});
	},
	
	nextConfigLevel: (id, callback) => {
		users.getConfigLevel(id, (configlevel) => {
			connect((db) => {
				db.collection('users').updateOne({ id: id }, {
					$set: {
						configlevel: configlevel + 1
					}
				}, (err, result) => {
					if(err) throw err;
					
					callback(result);
				});
			});
		});
	}
};

module.exports.farm = {
	getActiveFarm: (callback) => {
		connect((db) => {
			db.collection('farms').find({ active: true }, (err, docs) => {
				if(err) throw err;
				
				if(docs.size === 0) callback();
				else if(docs.size === 1) callback(docs[0]);
				else throw 'There should never be more than one active farm at a time.';
			});
		});
	},
	
	clearFarm: (callback) => {
		// Clears the active farm
		connect((db) => {
			db.collection('farms').updateOne({ active: true }, {
				$set: {
					active: false
				}
			}, (err, result) => {
				if(err) throw err;
				
				callback(result);
			});
		});
	},
	
	addFarm: (creator, timeOfStart, duration, venue, venueName, callback) => {
		connect((db) => {
			db.collection('farms').insertOne({
				active: true,
				creator: creator,
				timeCreated: (new Date()).getTime(),
				timeOfStart: timeOfStart,
				duration: duration,
				venue: venue,
				venueName: venueName
			}, (err, result) => {
				if(err) throw err;
				
				callback(result);
			});
		});
	}
};

