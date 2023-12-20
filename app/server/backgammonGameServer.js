


var comm = require('../../lib/comm.js');
var model = require('../../lib/model.js');
var queue_manager = require('../public/js/queue_manager.js');
require('../../lib/rules/rule.js');
var session = require('client-sessions');
var cookie = require('cookies');
var configurations = require('../../lib/configurations.js');
var dataAccess = require('../../lib/dataAccess.js');
var userRepository = require('../../lib/repositories/userRepository.js');
var matchHistoryRepository = require('../../lib/repositories/matchHistoryRepository.js');

var io=null;
var db=null;

/**
 * Backgammon server.
 * Listens to socket for command messages and processes them.
 * The server is responsible for management of game and player objects,
 * rolling dice and validation of moves.
 *
 * @constructor
 */
function backgammonGameServer() {
    /**
     * Map of client sockets, indexed by socket ID
     * @type {{}}
     */
    this.clients = {};
  
    /**
     * List of all players
     * @type {Player[]}
     */
    this.players = [];
    
    /**
     * List of all matches
     * @type {Match[]}
     */
    this.matches = [];
  
    /**
     * Responsible for management of queues with players waiting to play
     * @type {QueueManager}
     */
    //this.queueManager = new queue_manager.QueueManager();
  
    /**
     * Server's default config object
     * @type {{rulePath: string, enabledRules: string[]}}
     */
    this.config = require('./config.js');
    
  
  
  
  
  
  
  
  
    /**
     * Load enabled rules
     */
    this.loadRules = function () {
      for (var i = 0; i < this.config.enabledRules.length; i++) {
        var ruleName = this.config.enabledRules[i];
        require(this.config.rulePath + ruleName + '.js');
      }
    };
    
    /**
     * Save server state to database, in order to be able to resume active games later
     */
    this.snapshotServer = async function () {
      if (db) {
        //console.log("Saving server state...");
      
        /*if(this.players.length!=0)
        {
          var players = db.collection('players');
          players.remove();
          players.insert(this.players);
        }*/
        
  
        if(this.matches.length!=0)
        {
          var matches = db.collection('matches');
          matches.remove({});
          var notIsOverMatches= new Array();
          for(var i=0;i<this.matches.length;i++)
          {
            if(!this.matches[i].isOver)
            {
              //matches.insert(this.matches[i]);  
              //matches.update({currentMatch:this.matches[i].id},this.matches[i],{upsert: true});  
              if(this.matches[i]._id==undefined)
              {
                matches.insert(this.matches[i]);  
              }
              else
              {
                matches.update({id:this.matches[i].id},this.matches[i],{upsert: true});  
              }
              
              notIsOverMatches.push(this.matches[i]);
            }
          }
          this.matches=notIsOverMatches;
        }
        
  
        //console.log("State saved.");
      }
    };
    
    /**
     * Load saved server state from database
     */
    this.restoreServer =async function () {
      if (db) {
        var self = this;
        console.log("Restoring server state...");
  
        //var players = db.collection('players');
        var matches = db.collection('matches');
        /*if (!players || !matches) {
          return;
        }*/
  
        if (!matches) {
          return;
        }

        var matchesCursor = matches.find({});
        matchesCursor.each(function(err, item) {
          if(item == null) {
            return;
          }
  
          if (item.currentGame && item.currentGame.state) {
            model.State.rebuildRefs(item.currentGame.state);
          }
          if(item.guest!=undefined)
          {
            self.matches.push(item);
          }
          
        });
  
        /*var playersCursor = players.find();
        playersCursor.each(function(err, item) {
          if(item == null) {
            return;
          }
  
          self.players.push(item);
        });
  
        var i;
        for (i = 0; i < self.matches.length; i++) {
          var match = self.matches[i];
  
          if (match.host && match.host.id) {
            match.host = self.getPlayerByID(match.host.id);
          }
  
          if (match.guest && match.guest.id) {
            match.guest = self.getPlayerByID(match.guest.id);
          }
        }*/
  
        console.log("State restored.");
      }
    };
    
    /**
     * Run server instance
     */
    this.run = function (socketIO) {
      io=socketIO;
      db=dataAccess.getDb();
      /** Reference to server instance */
  
      //setTimeout(this.removeMatchOvers,60000);
  
      console.log("Running Server ...");
      var self = this;
      
      this.loadRules();
      
      this.restoreServer();

  
      
      //app.use(express.static(path.join(__dirname, 'browser')));
      
      
    
  
  
      io.on('connection', function (socket) {
        self.handleConnect(socket);
        socket.on('disconnect', function(){
          try {
            self.handleDisconnect(socket);
          }
          catch (e) {
            console.log(e);
          }
        });
        
        // Subscribe for client requests:
        var m = comm.Message;
        var messages = [
          m.CREATE_PLAYER,
          m.GET_MATCH_LIST,
          m.PLAY_RANDOM,
          m.CREATE_MATCH,
          m.JOIN_MATCH,
          m.ROLL_DICE,
          m.MOVE_PIECE,
          m.CONFIRM_MOVES,
          m.UNDO_MOVES,
          m.RESIGN_GAME,
          m.RESIGN_MATCH,
          m.CANCEL_MATCH,
          m.OPPONENT_DISCONNECT,
          m.OPPONENT_RECONNECT,
          m.UPDATE_STATUS
        ];
  
        var createHandler = function(msg){
          return function(params) {
            try {
              self.handleRequest(msg, socket, params);
            }
            catch (e) {
              console.log(e);
            }
          };
        };
  
        var i;
        for (i = 0; i < messages.length; i++) {
          var msg = messages[i];
          socket.on(msg, createHandler(msg));
        }
  
      });
      var _this=this;
      setInterval(function(){_this.quiteMatchesWhereTurnPlayerIsDisconnected()},1000);
      setInterval(function(){_this.cleanupMatches()},60000);
      //setInterval(function(){_this.cleanupPlayers()},90000);
    };
    
    /**
     * Get match object associated with a socket
     * @param {Socket} socket - Client's socket
     * @returns {Match} - Match object associated with this socket
     */
    this.getSocketMatch = function (socket) {
      return socket.match;
    };
  
    /**
     * Get game object associated with a socket
     * @param {Socket} socket - Client's socket
     * @returns {Game} - Game object associated with this socket
     */
    this.getSocketGame = function (socket) {
      return socket.game;
    };
  
    /**
     * Get game object associated with a socket
     * @param {Socket} socket - Client's socket
     * @returns {Player} - Player object associated with this socket
     */
    this.getSocketPlayer = function (socket) {
      return socket.player;
    };
  
    /**
     * Get game object associated with a socket
     * @param {Socket} socket - Client's socket
     * @returns {Rule} - Rule object associated with this socket
     */
    this.getSocketRule = function (socket) {
      return socket.rule;
    };
    
    /**
     * Associate match object with socket
     * @param {Socket} socket - Client's socket
     * @param {Match} match - Match object to associate
     */
    this.setSocketMatch = function (socket, match) {
      socket.match = match;
    };
  
    /**
     * Associate game object with socket
     * @param {Socket} socket - Client's socket
     * @param {Game} game - Game object to associate
     */
    this.setSocketGame = function (socket, game) {
      socket.game = game;
    };
  
    /**
     * Associate player object with socket
     * @param {Socket} socket - Client's socket
     * @param {Player} player - Player object to associate
     */
    this.setSocketPlayer = function (socket, player) {
      socket.player = player;
      player.socketID=socket.id;
    };
  
    /**
     * Associate player object with socket
     * @param {Socket} socket - Client's socket
     * @param {Rule} rule - Rule object to associate
     */
    this.setSocketRule = function (socket, rule) {
      socket.rule = rule;
    };
  
    /**
     * Send message to client's socket
     * @param {Socket} socket - Client's socket to send message to
     * @param {string} msg - Message ID
     * @param {Object} params - Object map with message parameters
     */
    this.sendMessage = function (socket, msg, params) {
      //console.log('Sending message ' + msg + ' to client ' + socket.id);
      socket.emit(msg, params);
    };
  
    /**
     * Send message to player
     * @param {Player} player - Player to send message to
     * @param {string} msg - Message ID
     * @param {Object} params - Object map with message parameters
     */
    this.sendPlayerMessage = function (player, msg, params) {
      var socket = this.clients[player.socketID];
      this.sendMessage(socket, msg, params);
    };
  
    /**
     * Send message to all players in a match
     * @param {Match} match - Match, whose players to send message to
     * @param {string} msg - Message ID
     * @param {Object} params - Object map with message parameters
     */
    this.sendMatchMessage = function (match, msg, params) {
      for (var i = 0; i < match.players.length; i++) {
        var player = this.getPlayerByID(match.players[i]);
        this.sendPlayerMessage(player, msg, params);
      }
    };
  
    /**
     * Send message to other players in the match, except the specified one
     * @param {Match} match - Match, whose players to send message to
     * @param {number} exceptPlayerID - Do not send message to this player
     * @param {string} msg - Message ID
     * @param {Object} params - Object map with message parameters
     */
    this.sendOthersMessage = function (match, exceptPlayerID, msg, params) {
      for (var i = 0; i < match.players.length; i++) {
        if (match.players[i] === exceptPlayerID) {
          continue;
        }
        var player = this.getPlayerByID(match.players[i]);
        this.sendPlayerMessage(player, msg, params);
      }
    };
  
    /**
     * Handle client disconnect
     * @param {Socket} socket - Client socket
     */
    this.handleDisconnect = function (socket) {
      //console.log('Client disconnected');
      
      // DONE: remove this client from the waiting queue
      var player = this.getSocketPlayer(socket);
      if (!player) {
          return;
      }
      
  
      //remove match that player create but no body joined that
      //if disconnecteduser were in a match tell other player about disconnect the opponent for waiting
      for(var i=0;i<this.matches.length;i++)
      {
          if((this.matches[i].host.socketID==socket.id || this.matches[i].host.username==player.username) && this.matches[i].guest==null)
          {
            this.matches[i].isOver=true;
          }
          if(this.matches[i].isOver==false && (this.matches[i].host.username==player.username || (this.matches[i].guest!=undefined && this.matches[i].guest.username==player.username)))
          {
            var otherPlayer=(this.matches[i].host.username==player.username?this.matches[i].guest:this.matches[i].host);
            var player=(this.matches[i].host.username==player.username?this.matches[i].host:this.matches[i].guest);
            /*if(this.matches[i].currentGame.turnPlayer.username==player.username)
            {
              var dateTime=new Date();
              dateTime.setSeconds(dateTime.getSeconds()+120);
              this.matches[i].currentGame.turnExpire=dateTime.getTime();
            }*/
            otherPlayer=this.getPlayerByID(otherPlayer.id);
            if(otherPlayer)
            {
                this.sendPlayerMessage(otherPlayer,comm.Message.OPPONENT_DISCONNECT,{clientMsgSeq:-1,match:this.matches[i]});
            }
            
          }
      }
      this.removePlayer(player.username)
      this.updateMatchList();
  
      //this.queueManagerthis.queueManager.removeFromaAll(player);
    };
  
    this.handleConnect = function a(socket) {
      //console.log('Client connecated');
      this.clients[socket.id] = socket;
      this.updateMatchList();
    };
  
  
    
  
    /**
     * Handle client's request
     * @param {string} msg - Message ID
     * @param {Socket} socket - Client socket
     * @param {Object} params - Message parameters
     */
    this.handleRequest =async function (msg, socket, params) {
      //console.log('Request received: ' + msg);
  
      var takeSnapshot=true;
      var reply = {
        'result': false
      };
      
      // Return client's sequence number back. Client uses this number
      // to find the right callback that should be executed on message reply.
      if (params.clientMsgSeq) {
        reply.clientMsgSeq = params.clientMsgSeq;
      }
      if (msg === comm.Message.CANCEL_MATCH) {
        reply.result = this.handleCancelMatch(socket, params, reply);
        takeSnapshot=false;
      }
      else if (msg === comm.Message.UPDATE_STATUS) {
        reply.result = this.handleUpdateStatus(socket, params, reply);
        takeSnapshot=false;
      }
      else if (msg === comm.Message.CREATE_PLAYER) {
        reply.result = this.handleCreatePlayer(socket, params, reply);
      }
      else if (msg === comm.Message.GET_MATCH_LIST) {
        reply.result = this.handleGetMatchList(socket, params, reply);
        takeSnapshot=false;
      }
      else if (msg === comm.Message.PLAY_RANDOM) {
        //reply.result = this.handlePlayRandom(socket, params, reply);
        //console.log('Unknown message!');
        return;
      }
      else if (msg === comm.Message.CREATE_MATCH) {
        reply.result = await this.handleCreateMatch(socket, params, reply);
      }
      else if (msg === comm.Message.JOIN_MATCH) {
        reply.result = await this.handleJoinMatch(socket, params, reply);
      }
      else if (msg === comm.Message.ROLL_DICE) {
        reply.result = this.handleRollDice(socket, params, reply);
      }
      else if (msg === comm.Message.MOVE_PIECE) {
        reply.result = this.handleMovePiece(socket, params, reply);
      }
      else if (msg === comm.Message.CONFIRM_MOVES) {
        reply.result = this.handleConfirmMoves(socket, params, reply);
      }
      else if (msg === comm.Message.UNDO_MOVES) {
        reply.result = this.handleUndoMoves(socket, params, reply);
      }
      else if (msg === comm.Message.RESIGN_GAME) {
        reply.result = await this.handleResignGame(socket, params, reply);
      }
      else if (msg === comm.Message.RESIGN_MATCH) {
        reply.result = await this.handleResignMatch(socket, params, reply);
      }
      else {
        //console.log('Unknown message!');
        return;
      }
  
      var match = this.getSocketMatch(socket);
      if (match) {
        reply.match = match; 
      }
      if (reply.errorMessage) {
        //console.log(reply.errorMessage);
      }
      reply.serverTime=Date.now();

      var player=this.getSocketPlayer(socket);
      if(player!=undefined)
      {
        player.lastActivityTime=Date.now();
        reply.playerBalance=player.balance;
      }

      reply.onlinePlayers=this.players.length;
      var playingMatchCount=0;
      for (var i = 0; i < this.matches.length; i++) {
        if(this.matches[i].isOver==false && this.matches[i].guest!=undefined)
        {
          playingMatchCount++;
        }
      }

      reply.playingMatchCount=playingMatchCount;


      // First send reply
      this.sendMessage(socket, msg, reply);
      
      // After that execute provided sendAfter callback. The callback
      // allows any additional events to be sent after the reply
      // has been sent.
      if (reply.sendAfter)
      {
        // Execute provided callback
        reply.sendAfter();
        
        // Remove it from reply, it does not need to be sent to client
        delete reply.sendAfter;
      }
      if(takeSnapshot)
      {
        this.snapshotServer();
      }
      
    };
  
    /**
     * Handle client's request to login as guest player.
     * @param {Socket} socket - Client socket
     * @param {Object} params - Request parameters
     * @param {Object} reply - Object to be send as reply
     * @returns {boolean} - Returns true if message have been processed
     *                      successfully and a reply should be sent.
     */
    this.handleCreatePlayer = function (socket, params, reply) {
      //console.log('Creating guest player');
      //console.log(socket.handshake);
      var player = null;
      if (!this.getSocketPlayer(socket) && params && params.playerID) {
        player = this.getPlayerByID(params.playerID);
        //console.log('Player ID found in list: ' + params.playerID);
        //console.log(player);
        if (player) {
          player.socketID = socket.id;
        }
      }
      /*else if (socket.handshake.headers.cookie) {
        var cookie = socket.handshake.headers.cookie;
        //var m = cookie.match(/\bplayer_id=([0-9]+)/);
        //\bplayer_id=([0-9][a-z]+)\w+
        var m = cookie.match(/\bplayer_id=([0-9][a-z]+)\w+/);
        if(m!=null && m!=undefined)
        {
          m=m[0].split("=");
          var playerID = m ? m[1] : null;
          player = this.getPlayerByID(playerID);
          console.log('Player ID found in cookie: ' + playerID);
          //console.log(player);
        }
      }*/
      // New player will be created
       
      if(!player)
      {
         var user= userRepository.getUserFromCookie(socket.handshake.headers.cookie);  
         if(user)
         {
          player = this.getPlayerByID(user._id);
          if(!player)
          {
            player = model.Player.createNew();
            player.id = user._id;
            player.avatarIndex=user.avatarIndex;
            player.username = user.username;
            player.stats=user.stats;
            player.balance=user.balance;
            //this.removePlayer(player.username);
            this.players.push(player);
            //console.log('New player ID: ' + player.id);
          }
          else
          {
            player.balance=user.balance;
          }
         }
         else
         {
           return false;
         }
      }
  
      if (player) {
        // Player already exists, but has been disconnected
        var match = this.getMatchByID(player.currentMatch);
        if(!match)
        {
            match = this.getMatchByPlayerUsernames(player.username);
        }
        
        
        // If there is a pending match, use existing player,
        // else create a new player object
        if (match && !match.isOver)
        {
          
  
          var rule = model.Utils.loadRule(match.ruleName);
          player.socketID = socket.id;
          this.setSocketPlayer(socket, player);
          this.setSocketMatch(socket, match);
          this.setSocketRule(socket, rule);
          
          if(match.host.id==player.id)
          {
            player.currentPieceType=match.host.currentPieceType;
            match.host.socketID=socket.id;
  
            var otherPlayer=this.getPlayerByID(match.guest.id);
            try
            {
              this.sendPlayerMessage(otherPlayer,comm.Message.OPPONENT_RECONNECT,{clientMsgSeq:-1,match:match});
            }
            catch(e)
            {}
          }
          else
          {
            player.currentPieceType=match.guest.currentPieceType;
            match.guest.socketID=socket.id;
  
            var otherPlayer=this.getPlayerByID(match.host.id);
            try
            {
              this.sendPlayerMessage(otherPlayer,comm.Message.OPPONENT_RECONNECT,{clientMsgSeq:-1});
            }
            catch(e){}
            
          }
  
          
          var self = this;
          reply.sendAfter = function () {
            self.sendPlayerMessage(
              player,
              comm.Message.EVENT_MATCH_START,
              {
                'match': match
              }
            );
          };
          
          reply.player = player;
          reply.reconnected = true;
          
          //console.log('Player: ', player);
  
          return true;        
        }
      }
  
            
   
       player.socketID = socket.id;
       this.setSocketPlayer(socket, player);
  
      reply.player = player;
      this.updateMatchList();
      return true;
    };
  
    /**
     * Handle client's request to get list of active matches
     * @param {Socket} socket - Client socket
     * @param {Object} params - Request parameters
     * @param {Object} reply - Object to be send as reply
     * @returns {boolean} - Returns true if message have been processed
     *                      successfully and a reply should be sent.
     */
    this.handleGetMatchList = function (socket, params, reply) {
      //console.log('List of matches requested');
      var list = [];
  
      for (var i = 0; i < this.matches.length; i++) {
        if(this.matches[i].isOver || (this.matches[i].currentGame!=undefined && this.matches[i].currentGame.hasStarted))
        {
          continue;
        }
        list.push({
          'id': this.matches[i].id,
          'playerName': this.matches[i].host.username,
          'avatarIndex': this.matches[i].host.avatarIndex,
          'ruleName': this.matches[i].ruleName,
          'buyIn': this.matches[i].buyIn,
          'length': this.matches[i].length,
          'league': this.matches[i].leagueName
        });
      }

      reply.list = list;
  
      return true;
    };
    
    /**
     * Handle client's request to play a random match.
     * If there is another player waiting in queue, start a match
     * between the two players. If there are no other players
     * waiting, put player in queue.
     * @param {Socket} socket - Client socket
     * @param {Object} params - Request parameters
     * @param {string} params.ruleName - Name of rule that should be used for creating the match
     * @param {Object} reply - Object to be send as reply
     * @returns {boolean} - Returns true if message have been processed
     *                      successfully and a reply should be sent.
     */
    /*this.handlePlayRandom = function (socket, params, reply) {
      console.log('Play random match');
      
      var player = this.getSocketPlayer(socket);
      if (!player) {
          reply.errorMessage = 'Player not found!';
          return false;
      }
  
      var otherPlayer = null;
      if (params.ruleName === '*') {
        params.ruleName = '.*';
      }
  
      var popResult = this.queueManager.popFromRandom(params.ruleName);
      
      otherPlayer = popResult.player;
      // TODO: Make sure otherPlayer has not disconnected while waiting.
      //       If that is the case, pop another player from the queue.
      
      if (otherPlayer) {
        if (params.ruleName === '.*')
        {
          params.ruleName = popResult.ruleName;
        }
        
        if (params.ruleName === '.*')
        {
          params.ruleName = model.Utils.getRandomElement(this.config.enabledRules);
        }
        
        // Start a new match with this other player
        var rule = model.Utils.loadRule(params.ruleName);
        var match = model.Match.createNew(rule);
        
        otherPlayer.currentMatch = match.id;
        otherPlayer.currentPieceType = model.PieceType.WHITE;
        model.Match.addHostPlayer(match, otherPlayer);
        
        player.currentMatch = match.id;
        player.currentPieceType = model.PieceType.BLACK;
        model.Match.addGuestPlayer(match, player);
        
        this.matches.push(match);
        
        var game = model.Match.createNewGame(match, rule);
        game.hasStarted = true;
        game.turnPlayer = otherPlayer;
        game.turnNumber = 1;
  
        // Assign match and rule objects to sockets of both players
        this.setSocketMatch(socket, match);
        this.setSocketRule(socket, rule);
        
        var otherSocket = this.clients[otherPlayer.socketID];
        this.setSocketMatch(otherSocket, match);
        this.setSocketRule(otherSocket, rule);
        
        // Remove players from waiting queue
        this.queueManager.remove(player);
        this.queueManager.remove(otherPlayer);
  
        // Prepare reply
        reply.host = otherPlayer;
        reply.guest = player;
        reply.ruleName = params.ruleName;
        
        var self = this;
        reply.sendAfter = function () {
          self.sendMatchMessage(
            match,
            comm.Message.EVENT_MATCH_START,
            {
              'match': match
            }
          );
        };
        
        return true;
      }
      else {
        // Put player in queue, and wait for another player
        this.queueManager.addToRandom(player, params.ruleName);
        
        reply.isWaiting = true;
        return true;
      }
    };*/
  
  
    
  
  
    /**
     * Handle client's request to create a new match
     * @param {Socket} socket - Client socket
     * @param {Object} params - Request parameters
     * @param {string} params.ruleName - Name of rule that should be used for creating the match
     * @param {Object} reply - Object to be send as reply
     * @returns {boolean} - Returns true if message have been processed
     *                      successfully and a reply should be sent.
     */
    this.handleCreateMatch =async function (socket, params, reply) {
      //console.log('Creating new match', params);
  
      var tableInfo=configurations.GetLeague(params.tableID);
      if(!tableInfo)
      {
        reply.errorMessage = 'Table not found!';
        return false;
      }

      var validBuyIn=false;
      for(var i=0;i<tableInfo.buyIns.length;i++)
      {
        if(tableInfo.buyIns[i]==params.price)
        {
          validBuyIn=true;
        }
      }
      if(!validBuyIn)
      {
        reply.errorMessage = 'Invalid Price';
        return false;
      }

      var player = this.getSocketPlayer(socket);
      if (!player) {
          reply.errorMessage = 'Player not found!';
          return false;
      }

      var matchLenght=parseInt(params.matchLength);
      if(tableInfo.length.indexOf(matchLenght)<0)
      {
        reply.errorMessage = 'invalid Length!';
        return false;
      }



  
      var buyIn=parseInt(params.price);
      var user=await userRepository.select({username:player.username});
  
      if(user.balance<buyIn)
      {
        reply.errorMessage = 'Insufficent balance!';
        return false;
      }
  
      // If player has chosen `Any` as rule
      if (params.ruleName === '*') {
        // Choose random rule
        params.ruleName = model.Utils.getRandomElement(this.config.enabledRules);
      }
  
      var rule = model.Utils.loadRule(params.ruleName);
  
      var match = model.Match.createNew(rule);
      match.tableName=tableInfo.name;
      match.length=matchLenght;
      match.rakePercent=configurations.rake;
      match.leagueName=tableInfo.league;
      match.buyIn=buyIn;
  
      model.Match.addHostPlayer(match, player);
      player.currentMatch = match.id;
  
      //player.currentPieceType = model.PieceType.WHITE;
      player.currentPieceType = Math.round(Math.random() * (1 - 0) + 0);
      this.matches.push(match);
      
      var game = model.Match.createNewGame(match, rule);
  
      this.setSocketMatch(socket, match);
      this.setSocketRule(socket, rule);
  
      reply.player = player;
      reply.ruleName = params.ruleName;
      reply.matchID = match.id;
  
      this.updateMatchList();
      return true;
    };
  
    /**
     * Handle client's request to join a new match
     * @param {Socket} socket - Client socket
     * @param {Object} params - Request parameters
     * @param {string} params.matchID - ID of match to join
     * @param {Object} reply - Object to be send as reply
     * @returns {boolean} - Returns true if message have been processed
     *                      successfully and a reply should be sent.
     */
    this.handleJoinMatch =async function (socket, params, reply) {
     // console.log('Joining match', params);
  
      var rule = this.getSocketRule(socket);
  
      if (this.matches.length <= 0) {
        reply.errorMessage = 'Match with ID ' + params.matchID + ' not found!';
        return false;
      }
      
      var match = this.getMatchByID(params.matchID);
      if (!match) {
        reply.errorMessage = 'Match with ID ' + params.matchID + ' not found!';
        return false;
      }
  
      if (match.guest) {
        reply.errorMessage = 'Match with ID ' + match.id + ' is full!';
        return false;
      }
  
      var guestPlayer = this.getSocketPlayer(socket);
      if (!guestPlayer) {
        reply.errorMessage = 'Player not found!';
        return false;
      }
  
      var guestUser=await userRepository.select({username:guestPlayer.username});
      if(guestUser.balance<match.buyIn)
      {
        reply.errorMessage = 'insufficent balance!';
        return false;
      }
  
      var rule = model.Utils.loadRule(match.ruleName);
  
      model.Match.addGuestPlayer(match, guestPlayer);
  
      guestPlayer.currentMatch = match.id;
      //guestPlayer.currentPieceType = model.PieceType.BLACK;
      if(match.host.currentPieceType==model.PieceType.WHITE)
      {
        guestPlayer.currentPieceType = model.PieceType.BLACK;
      }
      else
      {
        guestPlayer.currentPieceType = model.PieceType.WHITE;
      }
      // Directly start match
      match.currentGame.hasStarted = true;
      //match.currentGame.turnPlayer = match.host;
  
      
      match.host.timeBank=parseInt(configurations.timeBank);
      match.guest.timeBank=parseInt(configurations.timeBank);
  
      while(true)
      {
        //var dice = rule.rollDice(match.currentGame);
        var dice=model.Dice.roll();
        match.turnDices.push(dice);
  
        var dateTime=new Date();
        dateTime.setSeconds(dateTime.getSeconds()+parseInt(configurations.turnTime));
        match.currentGame.turnExpire=dateTime.getTime();
  
        
        if(dice.values[0]!=dice.values[1])
        {
          if(dice.values[0]>dice.values[1])
          {
            match.currentGame.turnPlayer=match.host;
          }
          else if(dice.values[0]<dice.values[1])
          {
            match.currentGame.turnPlayer=match.guest;
          }
          break;
        }
      }
      
  
      match.currentGame.turnNumber = 1;
  
      var self = this;
      reply.sendAfter = function () {
        self.sendMatchMessage(
          match,
          comm.Message.EVENT_MATCH_START,
          {
            'match': match
          }
        );
      };
  
      this.setSocketMatch(socket, match);
      this.setSocketRule(socket, rule);
  
      reply.ruleName = match.ruleName;
      reply.host = match.host;
      reply.guest = guestPlayer;
  
      this.updateMatchList();

      return true;
    };
  
    /**
     * Handle client's request to roll dice.
     * @param {Socket} socket - Client socket
     * @param {Object} params - Request parameters
     * @param {Object} reply - Object to be send as reply
     * @returns {boolean} - Returns true if message have been processed
     *                      successfully and a reply should be sent.
     */
    this.handleRollDice = function (socket, params, reply) {
      //console.log('Rolling dice');
  
      var match = this.getSocketMatch(socket);
      var player = this.getSocketPlayer(socket);
      var rule = this.getSocketRule(socket);
      
      match.turnDices=[];
  
      var game = match.currentGame;
      
      if (!game) {
        reply.errorMessage = 'Match with ID ' + match.id + ' has no current game!';
        return false;
      }
  
      if (!game.hasStarted) {
        reply.errorMessage = 'Game with ID ' + game.id + ' is not yet started!';
        return false;
      }
  
      if ((!game.turnPlayer) || (game.turnPlayer.id !== player.id)) {
        reply.errorMessage = 'Cannot roll dice it isn\'t player ' + player.id + ' turn!';
        return false;
      }
  
      if (model.Game.diceWasRolled(game)) {
        reply.errorMessage = 'Dice was already rolled!';
        return false;
      }
  
      var dice = rule.rollDice(game);
      /*dice.moves[0]=6;
      dice.moves[1]=6;
      dice.moves[2]=6;
      dice.moves[3]=6;
      dice.movesLeft[0]=6;
      dice.movesLeft[1]=6;
      dice.movesLeft[2]=6;
      dice.movesLeft[3]=6;
      dice.values[0]=6;
      dice.values[1]=6;*/
      game.turnDice = dice;
  
      var dateTime=new Date();
      dateTime.setSeconds(dateTime.getSeconds()+parseInt(configurations.turnTime));
      game.turnExpire=dateTime.getTime();
  
      
      
  
      model.Game.snapshotState(match.currentGame);
  
      reply.player = game.turnPlayer;
      reply.dice = dice;
  
      this.sendOthersMessage(
        match,
        player.id,
        comm.Message.EVENT_DICE_ROLL,
        {
          'match': match
        }
      );
  
      return true;
    };
  
    /**
     * Handle client's request to move a piece.
     * @param {Socket} socket - Client socket
     * @param {Object} params - Request parameters
     * @param {number} params.piece - Piece to move
     * @param {number} params.steps - Number of steps to move
     * @param {PieceType} params.type - Type of piece
     * @param {Object} reply - Object to be send as reply
     * @returns {boolean} - Returns true if message have been processed
     *                      successfully and a reply should be sent.
     */
    this.handleMovePiece = function (socket, params, reply) {
      //console.log('Moving a piece', params);
  
      var match = this.getSocketMatch(socket);
      var player = this.getSocketPlayer(socket);
      var rule = this.getSocketRule(socket);
      
      //console.log('Piece:', params.piece);
      
      if (!params.piece) {
        reply.errorMessage = 'No piece selected!';
        return false;
      }
      
      if (!match.currentGame) {
        reply.errorMessage = 'Match created, but current game is null!';
        return false;
      }
  
      if (params.moveSequence < match.currentGame.moveSequence) {
        reply.errorMessage = 'This move has already been played!';
        return false;
      }
  
      // First, check status of the game: if game was started, if it is player's turn, etc.
      if (!rule.validateMove(match.currentGame, player, params.piece, params.steps)) {
        reply.errorMessage = 'Requested move is not valid!';
        return false;
      }
  
      var actionList = rule.getMoveActions(match.currentGame.state, params.piece, params.steps);
      if (actionList.length === 0) {
        reply.errorMessage = 'Requested move is not allowed!';
        return false;
      }
  
      try {
        rule.applyMoveActions(match.currentGame.state, actionList);
        rule.markAsPlayed(match.currentGame, params.steps);
        
        match.currentGame.moveSequence++;
        
        reply.piece = params.piece;
        reply.type = params.type;
        reply.steps = params.steps;
        reply.moveActionList = actionList;
  
        this.sendMatchMessage(
          match,
          comm.Message.EVENT_PIECE_MOVE,
          {
            'match': match,
            'piece': params.piece,
            'type': params.type,
            'steps': params.steps,
            'moveActionList': actionList
          }
        );
  
        return true;      
      }
      catch (e) {
        reply.piece = params.piece;
        reply.type = params.type;
        reply.steps = params.steps;
        reply.moveActionList = [];
  
        if (process.env.DEBUG) {
          throw e;
        }
        
        return false;
      }
    };
  
    /**
     * Handle client's request to confirm moves made in current turn
     * @param {Socket} socket - Client socket
     * @param {Object} params - Request parameters
     * @param {Object} reply - Object to be send as reply
     * @returns {boolean} - Returns true if message have been processed
     *                      successfully and a reply should be sent.
     */
    this.handleConfirmMoves = function (socket, params, reply) {
      //console.log('Confirming piece movement', params);
      
      var self = this;
  
      var match = this.getSocketMatch(socket);
      var player = this.getSocketPlayer(socket);
      var rule = this.getSocketRule(socket);
  
      if (!rule.validateConfirm(match.currentGame, player)) {
        reply.errorMessage = 'Confirming moves is not allowed!';
        return false;
      }
      
      var otherPlayer = (model.Match.isHost(match, player)) ? match.guest : match.host;
      
      //console.log('CONFIRM MOVES');
      // Check if player has won
      if (rule.hasWon(match.currentGame.state, player)) {
  
        // TODO: Move ending game logic to rule. Keep only calls
        //       sending messages to client.
        this.endGame(socket, player, false, reply);
      }
      else {
        rule.nextTurn(match);
  
        this.sendMatchMessage(
          match,
          comm.Message.EVENT_TURN_START,
          {
            'match': match
          }
        );
      }
  
      return true;
    };
  
    /**
     * Handle client's request to undo moves made
     * @param {Socket} socket - Client socket
     * @param {Object} params - Request parameters
     * @param {Object} reply - Object to be send as reply
     * @returns {boolean} - Returns true if message have been processed
     *                      successfully and a reply should be sent.
     */
    this.handleUndoMoves = function (socket, params, reply) {
      //console.log('Undo moves', params);
  
      var match = this.getSocketMatch(socket);
      var player = this.getSocketPlayer(socket);
      var rule = this.getSocketRule(socket);
  
      if (!rule.validateUndo(match.currentGame, player)) {
        reply.errorMessage = 'Undo moves is not allowed!';
        return false;
      }
  
      var otherPlayer = (model.Match.isHost(match, player)) ? match.guest : match.host;
  
      model.Game.restoreState(match.currentGame);
  
      this.sendMatchMessage(
        match,
        comm.Message.EVENT_UNDO_MOVES,
        {
          'match': match
        }
      );
  
      return true;
    };
    
    /**
     * Handle client's request to resign from current game (game only, not whole match)
     * @param {Socket} socket - Client socket
     * @param {Object} params - Request parameters
     * @param {Object} reply - Object to be send as reply
     * @returns {boolean} - Returns true if message have been processed
     *                      successfully and a reply should be sent.
     */
    this.handleResignGame = async function (socket, params, reply) {
      //console.log('Resign game', params);
  
      var match = this.getSocketMatch(socket);
      var player = this.getSocketPlayer(socket);
      var rule = this.getSocketRule(socket);
      var otherPlayer = (model.Match.isHost(match, player)) ? match.guest : match.host;
      
      this.endGame(socket, otherPlayer, true, reply);
      
      return true;
    };
    
    /**
     * Handle client's request to resign from whole match
     * @param {Socket} socket - Client socket
     * @param {Object} params - Request parameters
     * @param {Object} reply - Object to be send as reply
     * @returns {boolean} - Returns true if message have been processed
     *                      successfully and a reply should be sent.
     */
    this.handleResignMatch =async function (socket, params, reply) {
      //console.log('Resign match', params);
  
      var match = this.getSocketMatch(socket);
      var player = this.getSocketPlayer(socket);
      var rule = this.getSocketRule(socket);
      var otherPlayer = (model.Match.isHost(match, player)) ? match.guest : match.host;
      
      var self = this;
      match.isOver=true;
      await matchHistoryRepository.saveMatchResult(match,otherPlayer.username);
      for(var i=0;i<this.players.length;i++)
      {
        if(this.players[i].username==match.host.username || this.players[i].username==match.guest.username)
        {
          var instance=await userRepository.select({username:this.players[i].username});
          this.players[i].balance=instance.balance;
        }
      }

      reply.sendAfter = function () {
        self.sendMatchMessage(
          match,
          comm.Message.EVENT_MATCH_OVER,
          {
            'match': match,
            'winner': otherPlayer,
            'resigned': true
          }
        );
      };
  
      
      this.updateMatchList();
      return true;
    };
    
    /**
     * End game
     * @param {Socket} socket - Client socket
     * @param {Object} params - Request parameters
     * @param {Object} reply - Object to be send as reply
     * @returns {boolean} - Returns true if message have been processed
     *                      successfully and a reply should be sent.
     */
    this.endGame = async function (socket, winner, resigned, reply) {
      var self = this;
  
      var match = this.getSocketMatch(socket);
      var player = this.getSocketPlayer(socket);
      var rule = this.getSocketRule(socket);
      var otherPlayer = (model.Match.isHost(match, player)) ? match.guest : match.host;
      
      // 1. Update score
      var score = rule.getGameScore(match.currentGame.state, winner);
      
      match.score[winner.currentPieceType] += score;
  
      if (match.score[winner.currentPieceType] >= match.length) {
        match.isOver = true;
      }
  
      if (match.isOver) {
        // 3. End match
        await matchHistoryRepository.saveMatchResult(match,winner.username);
        for(var i=0;i<this.players.length;i++)
        {
          if(this.players[i].username==match.host.username || this.players[i].username==match.guest.username)
          {
            var instance=await userRepository.select({username:this.players[i].username});
            this.players[i].balance=instance.balance;
          }
        }
  
        self.sendMatchMessage(
          match,
          comm.Message.EVENT_MATCH_OVER,
          {
            'match': match,
            'winner': winner,
            'resigned': resigned
          }
        );
      }
      else {
        // 2. Start a new game
        // NEXT: Start a new game
        var game = model.Match.createNewGame(match, rule);
        game.hasStarted = true;
        game.turnPlayer = winner;
        game.turnNumber = 1;
  
        var dateTime=new Date();
        dateTime.setSeconds(dateTime.getSeconds()+parseInt(configurations.turnTime));
        game.turnExpire=dateTime.getTime();
  
        
        self.sendMatchMessage(
          match,
          comm.Message.EVENT_GAME_OVER,
          {
            'match': match,
            'winner': winner,
            'resigned': resigned
          }
        );

        self.sendMatchMessage(
          match,
          comm.Message.EVENT_GAME_RESTART,
          {
            'match': match,
            'game': match.currentGame,
            'resigned': resigned
          }
        );
        /*reply.sendAfter = function () {
          self.sendMatchMessage(
            match,
            comm.Message.EVENT_GAME_OVER,
            {
              'match': match,
              'winner': winner,
              'resigned': resigned
            }
          );
  
          self.sendMatchMessage(
            match,
            comm.Message.EVENT_GAME_RESTART,
            {
              'match': match,
              'game': match.currentGame,
              'resigned': resigned
            }
          );
        };*/
      }
      this.updateMatchList();
      return true;
    };
  
    /**
     * Get player by ID
     * @param {number} id - Player's ID
     * @returns {Player} - Returns player or null if not found.
     */
    this.getPlayerByID = function (id) {
      //console.log('Length:' + this.players.length);
      for (var i = 0; i < this.players.length; i++) {
        //console.log(this.players[i]);
        if (this.players[i].id == id) {
          //console.log('Found', this.players[i]);
          return this.players[i];
        }
      }
      return null;
    };
  
    /**
     * Get match by ID
     * @param {number} id - Match ID
     * @returns {Match} - Returns match or null if not found.
     */
    this.getMatchByID = function (id) {
      for (var i = 0; i < this.matches.length; i++) {
        if (this.matches[i].id == id) {
          return this.matches[i];
        }
      }
      return null;
    };


    this.getMatchByPlayerUsernames = function (username) {
      for (var i = 0; i < this.matches.length; i++) {
        if ((this.matches[i].host!=undefined && this.matches[i].host.username == username) || (this.matches[i].guest!=undefined && this.matches[i].guest.username == username)) {
          return this.matches[i];
        }
      }
      return null;
    };
  
  
  
  /*Aliz Develop */
  
  this.handleCancelMatch = function (socket, params, reply) {
    //console.log('Cancel match', params);
  
    var match = this.getSocketMatch(socket);
    var player = this.getSocketPlayer(socket);
  
    for(var i=0;i<this.matches.length;i++)
    {
        if(this.matches[i].id==match.id && this.matches[i].host.id==player.id && this.matches[i].guest==null)
        {
          this.matches[i].isOver=true;
        }
    }
    this.updateMatchList();
    
    
    return true;
  };
  
  
  this.updateMatchList = function () {
    this.removeMatchOvers();
    for (var i = 0; i < this.players.length; i++) {
      //this.handleRequest = function (msg, socket, params) {
      if(this.clients[this.players[i].socketID]==undefined)
      {
        continue;
      }
      this.handleRequest(comm.Message.GET_MATCH_LIST,this.clients[this.players[i].socketID],{});
    }
  
    //return true;
  };
  
  this.removeMatchOvers = function () {
    var newMatchList=new Array();
    for (var i = 0; i < this.matches.length; i++) {
      if(!this.matches[i].isOver)
      {
        newMatchList.push(this.matches[i]);
      }
    }
    //this.matches=newMatchList;
    
  
    //return true;
  };
  
  this.opponentLeave =async function (winnerSocket,looserSocket) {
    //console.log('opponentLeave');
  
    
    var match = this.getSocketMatch(winnerSocket);
    var player = this.getSocketPlayer(winnerSocket);
    var rule = this.getSocketRule(winnerSocket);
    var otherPlayer = (model.Match.isHost(match, player)) ? match.guest : match.host;
    
    match.isOver=true;
    await matchHistoryRepository.saveMatchResult(match,player.username);
    this.updateMatchList();
    
    this.sendMessage(winnerSocket,comm.Message.EVENT_MATCH_OVER, {
      'match': match,
      'winner': player,
      'resigned': true
    });
    if(looserSocket!=undefined)
    {
      this.sendMessage(looserSocket,comm.Message.EVENT_MATCH_OVER, {
        'match': match,
        'winner': player,
        'resigned': true
      });
    }
    this.snapshotServer();
  };
  
  this.handleUpdateStatus=function(socket, params, reply) {
    //console.log("handleUpdateStatus");
  }




  this.cleanupPlayers= function ()
  {
    var currentPlayers=new Array();
    for(var i=0;i<this.players.length;i++)
    {
      var dateTime=new Date();
      dateTime.setSeconds(dateTime.getSeconds()-configurations.idleTimoutforPlayers);
      if(this.players[i].lastActivityTime<=dateTime)
      {
        currentPlayers.push(this.players[i]);
      }
    }
    if(currentPlayers.length!=0)
    {
      this.players=currentPlayers;
    }
    this.updateMatchList();
    
  }

  this.removePlayer= function (username)
  {
    var currentPlayers=new Array();
    for(var i=0;i<this.players.length;i++)
    {
      if(this.players[i].username!=username)
      {
        currentPlayers.push(this.players[i]);
      }
    }
    this.players=currentPlayers;
  }

  this.cleanupMatches= function ()
  {
    var currentMatches=new Array();
    for(var i=0;i<this.matches.length;i++)
    {
      if(!this.matches[i].isOver)
      {
        currentMatches.push(this.matches[i]);
      }
    }
    if(currentMatches.length!=0)
    {
      this.matches=currentMatches;
    }
    
  }

  this.quiteMatchesWhereTurnPlayerIsDisconnected=async function ()
  {
    
    for(var i=0;i<this.matches.length;i++)
    {
      if(this.matches[i].isOver==false && this.matches[i].guest!=null)
      {
        if(Date.now()>this.matches[i].currentGame.turnExpire && this.matches[i].currentGame.turnPlayer.timeBank<=0)
        {

          var winner=this.matches[i].currentGame.turnPlayer.username==this.matches[i].host.username?this.matches[i].guest:this.matches[i].host;
          winner=this.getPlayerByID(winner.id);

          var looser=this.matches[i].currentGame.turnPlayer.username==this.matches[i].host.username?this.matches[i].host:this.matches[i].guest;
          looser=this.getPlayerByID(looser.id);

          var winnerSocket = this.clients[winner.socketID];
          var looserSocket = this.clients[looser.socketID];
          await this.opponentLeave(winnerSocket,looserSocket);
        }
        if(Date.now()>this.matches[i].currentGame.turnExpire && this.matches[i].currentGame.turnPlayer.timeBank>0)
        {
          var dateTime=new Date();
          dateTime.setSeconds(dateTime.getSeconds()+parseInt(configurations.turnTime));
          this.matches[i].currentGame.turnExpire=dateTime.getTime();
          this.matches[i].currentGame.turnPlayer.timeBank-=parseInt(configurations.turnTime);

          var socket = this.clients[this.matches[i].host.socketID];
          if(socket)
          {
            this.handleRequest(comm.Message.UPDATE_STATUS,socket,{});
          }
          socket = this.clients[this.matches[i].guest.socketID];
          if(socket)
          {
            this.handleRequest(comm.Message.UPDATE_STATUS,socket,{});
          }
        }
        
      }
    }
  }
  
  /*End Of Aliz Develop */
  
  }


  

  module.exports = backgammonGameServer;