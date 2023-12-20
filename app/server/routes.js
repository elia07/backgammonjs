
var configurations = require('../../lib/configurations.js');

var express = require('express'),
router = express.Router(),
Home = require('../controllers/Home');
Lobby = require('../controllers/Lobby');
Api = require('../controllers/Api');
middlewares = require('./middlewares.js');



module.exports = function(app) {
    router.get('/', Home.Index);
    router.get('/Page404', Home.Page404);
    router.get('/Page500', Home.Page500);
    router.get('/Logout',middlewares.requireLogin,Home.Logout);
    router.post('/Login', Home.Login);

    router.get('/Lobby/',middlewares.requireLogin, Lobby.Index);
    router.get('/Lobby/Index',middlewares.requireLogin,Lobby.Index);
    router.get('/Lobby/IndexOrg',middlewares.requireLogin,Lobby.IndexOrg);
    
    
    router.post(configurations.ApiAddress+"CreateUser/",middlewares.ApiAuthorize, Api.CreateUser);
    router.post(configurations.ApiAddress+"GetUser/",middlewares.ApiAuthorize, Api.GetUser);
    router.post(configurations.ApiAddress+"UpdateUser/",middlewares.ApiAuthorize, Api.UpdateUser);
    router.post(configurations.ApiAddress+"GetSessionKey/",middlewares.ApiAuthorize, Api.GetSessionKey);
    router.post(configurations.ApiAddress+"GetStatus/",middlewares.ApiAuthorize, Api.GetStatus);
    
    app.use(router);
};