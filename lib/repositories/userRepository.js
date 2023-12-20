var dataAccess = require('../dataAccess.js');
var configurations = require('../configurations.js');
var session = require('client-sessions');
var cookie = require('cookies');
var collectionName="users";

module.exports = {
    select:async function(args)
    {
        return await dataAccess.getDb().collection(collectionName).findOne(args);
    },
    selectMany:async function(args)
    {
        return await dataAccess.getDb().collection(collectionName).find(args);
    },
    insert:async function(args)
    {
        return await dataAccess.getDb().collection(collectionName).insertOne(args);
    },
    update:async function(query,args)
    {
        return await dataAccess.getDb().collection(collectionName).update(query,args);
    },
    updateMany:async function(query,args)
    {
        return await dataAccess.getDb().collection(collectionName).updateMany(query,args);
    },
    delete:async function(args)
    {
      //  return await dataAccess.getDb().collection(collectionName).insertOne(user);
    },
    count:async function(args){
        var count =await dataAccess.getDb().collection(collectionName).find(args).count();
        return !count==0;  
    },
    getUserFromCookie: function(cookie) {
        if(cookie==undefined)
        {
        return;
        }
        
        var cookieParts=cookie.split(" ");
        var encryptedCookie="";
        for(var i=0;i<cookieParts.length;i++)
        {
            if(cookieParts[i].includes(configurations.sessionName))
            {
            encryptedCookie=cookieParts[i].replace(configurations.sessionName+"=","");
            break;
            }
        }

        try
        {
        var res= session.util.decode({cookieName:configurations.sessionName,secret:configurations.secret},encryptedCookie).content.user;
        return res;
        }
        catch(e){}
        return null;
    },
    updateLoginDate:async function(args)
    {
       var user= await dataAccess.getDb().collection(collectionName).findOne(args);  
       user.lastLoginDate=Date.now();
       dataAccess.getDb().collection(collectionName).update({ username: args.username },user);
    },
    utils:{
        getUserRake:function(user)
        {
            if(user.rake==-1.0)
            {
                return configurations.rake;
            }
            else
            {
                return user.rake;
            }
            
        }
    }
}