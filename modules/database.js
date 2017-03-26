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
	
	getTodo: (id, callback) => {
		users.findUser(id, (doc) => {
			if(doc === undefined) callback(undefined);
			callback(doc.todo);
		});
	},
	
	setTodo: (id, todo, callback) => {
		connect((db) => {
			db.collection('users').updateOne({ id: id }, {
				$set: {
					todo: todo
				}
			}, (err, result) => {
				if(err) throw err;
				
				callback(result);
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
	
	addFarm: (creator, callback) => {
		connect((db) => {
			db.collection('farms').insertOne({
				active: true,
				ready: false,
				creator: creator,
				timeCreated: (new Date()).getTime(),
				timeOfStart: 0, // in unix timestamp
				duration: 0, // in seconds
				venue: {
					latitude: 0.0,
					longitude: 0.0
				},
				venueName: ''
			}, (err, result) => {
				if(err) throw err;
				
				callback(result);
			});
		});
	}
};

module.exports.locations = {
	getLocationsForUser: (userId, limit, callback) => {
		connect((db) => {
			db.collection('locations')
					.find({ user: userId })
					.sort({ time: -1 })
					.limit(limit)
					.toArray((err, docs) => {
				
				if(err) throw err;
				
				callback(docs);
			});
		});
	},
	
	addLocation: (userId, name, latitude, longitude, callback) => {
		connect((db) => {
			db.collection('locations').insertOne({
				user: userId,
				time: (new Date()).getTime(),
				name: name,
				latitude: latitude,
				longitude: longitude
			}, (err, result) => {
				if(err) throw err;
				
				callback(result);
			});
		});
	}
};

