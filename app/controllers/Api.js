var path = require('path');
var fs = require('fs');
var userRepository = require('../../lib/repositories/userRepository.js');
var model = require('../../lib/model.js');
var cryptoJS = require("crypto-js");
var configurations = require('../../lib/configurations.js');
var enums= require('../../lib/enums.js');



module.exports = {

    CreateUser:async function(req, res) {
        if(req.body.username=="" || req.body.username==undefined)
        {
            res.json({'status':false,'message':'Username is invalid'});
            return;
        }
        var usernameCheck=await userRepository.select({username:req.body.username});
        if(usernameCheck)
        {
            res.json({'status':false,'message':'Username is already exist'});
            return;
        }
        if(req.body.password=="")
        {
            res.json({'status':false,'message':'Invalid Password'});
            return;
        }
        if(req.body.avatarIndex!=undefined)
        {
            if(parseInt(req.body.avatarIndex)<=0 || parseInt(req.body.avatarIndex)>64)
            {
                res.json({'status':false,'message':'Invalid avatarIndex'});
                return;
            }
        }
    
        var newUser = new model.User();
        newUser.username=req.body.username;
        newUser.password=cryptoJS.MD5(req.body.password).toString();
        if(req.body.avatarIndex!=undefined)
        {
            newUser.avatarIndex= req.body.avatarIndex;
        }

        try
        {
            var insertRes= await userRepository.insert(newUser);
            if(insertRes.insertedCount==1)
            {
                res.json({'status':true,'message':'user created'});
                return;
            }
            else
            {
                res.json({'status':false,'message':'please try again'});
                return;
            }
            
        }
        catch(err){
            res.json({'status':false,'message':'please try again'});
            return;
        }
        
    },
    GetUser:async function(req, res) {
        var user=await userRepository.select({username:req.body.username});
        if(user)
        {
            res.json(user);
            return;
        }
        else
        {
            res.json(new model.User());
            return;
        }
    },
    UpdateUser:async function(req, res) {
        var user=await userRepository.select({username:req.body.username});
        if(user)
        {
            if(req.body.password && req.body.password!="")
            {
                user.password=cryptoJS.MD5(req.body.password).toString();
            }
            if(req.body.isActive && typeof req.body.isActive === "boolean")
            {
                user.isActive=req.body.isActive;
            }
            if(req.body.balance && !isNaN(req.body.balance))
            {
                user.balance= req.body.balance*1.0;
            }
            if(req.body.rake && !isNaN(req.body.rake))
            {
                user.rake=req.body.rake*1.0;
            }
            if(req.body.rakeEarnedFromThisUser && !isNaN(req.body.rakeEarnedFromThisUser))
            {
                user.rake=req.body.rakeEarnedFromThisUser*1.0;
            }
            if(req.body.avatarIndex && !isNaN(req.body.avatarIndex))
            {
                user.rake=parseInt(req.body.avatarIndex);
            }
            
            var updateRes=await userRepository.update({username:req.body.username},user);
            if(updateRes.result.n==1)
            {
                res.json({'status':true,'message':'user updated'});
                return;
            }
            else
            {
                res.json({'status':false,'message':'please try again'});    
                return;
            }
        }
        else
        {
            res.json({'status':false,'message':'please try again'});
            return;
        }
    },
    GetSessionKey:async function(req, res) {
        var user=await userRepository.select({username:req.body.username});
        if(user && user.isActive)
        {
            var letters=["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];
            for(var i=0;i<50;i++)
            {
                user.sessionKey+=letters[Math.floor((Math.random() * letters.length))];
            }
            
            var updateRes=await userRepository.update({username:req.body.username},user);
            if(updateRes.updatedCount==1)
            {
                res.json({'status':true,'message':user.sessionKey});
                return;
            }
            else
            {
                res.json({'status':false,'message':'please try again'});    
                return;
            }
        }
        else
        {
            res.json({'status':false,'message':'user not found or is not active'});
            return;
        }   
    },
    GetStatus:async function(req, res) {
        var bgServer = req.app.get('bgServer');
        
        var status =new model.Status();
        for(var i=0;i<bgServer.players.length;i++)
        {
            status.players.push(bgServer.players[i].username);
        }
        status.matchCount=bgServer.matches.length;
        for(var i=0;i<bgServer.matches.length;i++)
        {
            status.inPlay+=bgServer.matches[i].buyIn*2;
        }
        res.json(status);
        return;
    }

};