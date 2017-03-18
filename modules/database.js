'use strict';

var mongo = require('mongodb').MongoClient;

var utils = require('./utils');
var config = utils.config;

module.exports.users = {
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
	}
};
