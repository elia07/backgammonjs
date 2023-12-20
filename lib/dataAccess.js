var session = require('client-sessions');
var cookie = require('cookies');
var configurations = require('./configurations.js');

var MongoClient = require('mongodb').MongoClient;
var _db;


module.exports = {
    connect:async function(callback) {
        MongoClient.connect(configurations.connectionString, { useNewUrlParser: true }, function( err, db ) {
            if(!err)
            {
                _db = db.db(configurations.databaseName);
            }
            return callback(err);
        });
    },
    getDb: function() {
        return _db;
    } 
}