var dataAccess = require('../dataAccess.js');
var userRepository = require('../repositories/userRepository.js');
var settingRepository = require('../repositories/settingRepository.js');
//var collectionName="matchHistory";
var configurations = require('../configurations.js');
module.exports = {
    
    saveMatchResult :async function(match,winnerName)
    {
      if(match.buyIn>0)
      {

        var tableInfo=configurations.GetLeague(match.leagueName);
        var hostPlayer=await userRepository.select({username:match.host.username});
        var guestPlayer=await userRepository.select({username:match.guest.username});
  
        var winner=null;
        var looser=null;
        var winnerBefore=null;
        var looserBefore=null;
    
        
    
        if(winnerName==hostPlayer.username)
        {
            winner=hostPlayer;
            looser=guestPlayer;
        }
        else
        {
            winner=guestPlayer;
            looser=hostPlayer;
        }

        winnerBefore=winner;
        looserBefore=looser;


        var prizeForWinner=(match.buyIn-((configurations.rake *match.buyIn)/100));

        winner.balance+=prizeForWinner;
        winner.stats.wins++;
        winner.stats.overalBalance+=prizeForWinner;
        var res=await userRepository.update({ username: winner.username }, winner);
    
        looser.balance-=match.buyIn;
        looser.stats.looses++;
        looser.stats.overalBalance-=tableInfo.buyIn;
        res=await userRepository.update({ username: looser.username }, looser);
        
   
        /*var matchHistory=model.MatchHistory();
        matchHistory.leagueName=tableInfo.league;
        matchHistory.hostUser=hostPlayer.username;
        matchHistory.guestUser=guestPlayer.username;
        matchHistory.date=Date.now();
        matchHistory.buyIn=match.buyIn;
        matchHistory.ruleName=match.ruleName;
        matchHistory.length=match.length;
        matchHistory.winner=winner;
        matchHistory.winnerBefore=winnerBefore;
        matchHistory.looser=looser;
        matchHistory.looserBefore=looserBefore;
        matchHistory.rake=configurations.rake;
        matchHistory.profit=match.buyIn-prizeForWinner;*/
        
    
        //call caller api
        }
        
        return true;
    }
}