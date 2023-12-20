var path = require('path');
var fs = require('fs');
var userRepository = require('../../lib/repositories/userRepository.js');
var session = require('client-sessions');
var cookie = require('cookies');
exphbs = require('express-handlebars');
var configurations = require('../../lib/configurations.js');

/*fs.readFile(path.join(__dirname, '../public/statics/lobby.html'),function (err, data){
            res.writeHead(200, {'Content-Type': 'text/html','Content-Length':data.length});
            res.write(data);
            res.end();
          });*/

module.exports = {
    Index: function(req, res) {
        var viewModel = {
            tablesInfo:configurations.tablesInfo,
            tablesInfoJsonString:JSON.stringify(configurations.tablesInfo)
        }
        res.render(path.join(__dirname , '../Views/Lobby/Index.handlebars'),{layout: false ,viewModel:viewModel});
    },
    IndexOrg: function(req, res) {
        var viewModel = {
            tablesInfo:configurations.tablesInfo
        }
        res.render(path.join(__dirname , '../Views/Lobby/IndexOrg.handlebars'),{layout: false ,viewModel:viewModel});
    }
};