var dataAccess = require('../dataAccess.js');
var configurations = require('../configurations.js');
var collectionName="settings";

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
    },
    count:async function(args){
        var count =await dataAccess.getDb().collection(collectionName).find(args).count();
        return !count==0;  
    },
    upsert:async function(args)
    {
        return await dataAccess.getDb().collection(collectionName).updateOne({key:args.key},args,{upsert: true});
    },
    upsertLeaguePot:async function(args)
    {
        var instance=this.select(args)
        if(instance!=null)
        {
            var pot=parseFloat(instance.value)+args.value;
            return await dataAccess.getDb().collection(collectionName).updateOne({key:args.key},{key:args.key,value:pot});
        }
        else
        {
            return await dataAccess.getDb().collection(collectionName).insertOne(args);
        }
        
    },
    utils:{
        
    }
}