'use strict';

var mongo = require('mongodb').MongoClient;

var utils = require('./utils');
var config = utils.config;
var debug = utils.debug;

module.exports.check = () => {
	mongo.connect(config('mongo-url'), (err, db) => {
		if(err) throw err;
		
		debug('MongoDB is working!');
	});
};

module.exports.getCollection = (collection, callback) => {
	mongo.connect(config('mongo-url'), (err, db) => {
		if(err) throw err;
		
		db.collection(collection).find().toArray((err, docs) => {
			if(err) throw err;
			
			callback(docs);
		});
	});
};

var users = module.exports.users = {
	findUser: (id, callback) => {
		mongo.connect(config('mongo-url'), (err, db) => {
			if(err) throw err;
			
			db.collection('users').find({ id: id }).toArray((err, docs) => {
				if(err) throw err;
				
				if(docs.length === 0) callback();
				else if(docs.length === 1) callback(docs[0]);
				else throw 'Database should only ever contain one entry for id ' + id;
			});
		});
	},
	
	addUser: (data, callback) => {
		mongo.connect(config('mongo-url'), (err, db) => {
			if(err) throw err;
			
			db.collection('users').insertOne(data, (err, result) => {
				if(err) throw err;
				
				callback(result);
			});
		});
	},
	
	deleteUser: (id, callback) => {
		mongo.connect(config('mongo-url'), (err, db) => {
			if(err) throw err;
			
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
		mongo.connect(config('mongo-url'), (err, db) => {
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
		mongo.connect(config('mongo-url'), (err, db) => {
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
			mongo.connect(config('mongo-url'), (err, db) => {
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
