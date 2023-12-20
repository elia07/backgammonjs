"use strict";

var express = require("express");
var config = require("./server/configure.js");
var app = express();
var dataAccess = require("../lib/dataAccess.js");
var backgammonGameServer = require("./server/backgammonGameServer.js");
var configurations = require("../lib/configurations.js");
var http = require("http").Server(app);
var io = require("socket.io")(http);

var host = process.env.OPENSHIFT_NODEJS_IP || configurations.BindAddress;
var port =
  process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || configurations.Port;

app.set("host", host);
app.set("port", port);
app.set("views", __dirname + "/views");
//app.set('views','./views');

var bgServer = new backgammonGameServer();
dataAccess.connect(function (err) {
  if (err) {
    console.log("Cannot Connect To Database");
    console.log(err);
  } else {
    console.log("Connected to DB");
    bgServer.run(io);
    /*app.listen(app.get('port'),app.get('host'), function() {
          console.log('Server up: http://localhost:' + app.get('port'));
        });*/

    http.listen(port, host, function () {
      console.log("listening on *:" + port);
    });
  }

  app.set("bgServer", bgServer);
  app = config(app);
});
