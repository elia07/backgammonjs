'use strict';
/*jslint browser: true */
/*global fitText: false */
/*global ohSnap: false */

var $ = require('jquery'); 
var model = require('../../../lib/model.js');
require('../../bower_components/oh-snap/ohsnap.js');
//var BootstrapDialog = require('../../bower_components/bootstrap3-dialog/dist/js/bootstrap-dialog.min.js');

/**
 * Contains graphical user interface and functionality for moving pieces
 * @constructor
 * @param client - Client object in control of this UI
 */
function SimpleBoardUI(client) {
  /**
   * @type {Client}
   */
  this.client = client;
  
  /**
   * @type {Match}
   */
  this.match = null;

  /**
   * @type {Rule}
   */
  this.rule = null;

  this.init = function () {
    this.container = $('#' + this.client.config.containerID);
    this.container.append($('#tmpl-board').html());
    this.container.append($('<div id="ohsnap"></div>'));


    this.board = $('#board');
    this.fields = [];
    for (var i = 0; i < 4; i++) {
      this.fields[i] = $('#field' + i);
    }

    this.assignActions();
  };

  /**
   * Rounds down floating point value to specified number of digits
   * after decimal point
   * @param {Number} number - float number to round
   * @param {Number} digits - number of digits after decimal point
   * @returns {Number} rounded number as float
   */
  this.toFixedDown = function(number, digits) {
    if(number === 0) {
      return 0;
    }
    var n = number - Math.pow(10, -digits)/2;
    n += n / Math.pow(2, 53); // added 1360765523: 17.56.toFixedDown(2) === "17.56"
    return n.toFixed(digits);
  };
  
  this.notifyOhSnap = function (message, params) {
    if (!params.duration) {
      params.duration = 1500;
    }
    ohSnap(message, params);
  };
  
  this.notifyInfo = function (message, timeout) {
    this.notifyOhSnap(message, {color: 'blue', duration: timeout});
  };
  
  this.notifyPositive = function (message, timeout) {
    this.notifyOhSnap(message, {color: 'green', duration: timeout});
  };
  
  this.notifyNegative = function (message, timeout) {
    this.notifyOhSnap(message, {color: 'red', duration: timeout});
  };
  
  this.notifySuccess = function (message, timeout) {
    this.notifyOhSnap(message, {color: 'green', duration: timeout});
  };
  
  this.notifyError = function (message, timeout) {
    this.notifyOhSnap(message, {color: 'red', duration: timeout});
  };

  this.getPointElem = function (pos) {
    return $('#point' + pos);
  };
  
  this.getPieceElem = function (piece) {
    return $('#piece' + piece.id);
  };

  this.getTopPieceElem = function (pos) {
    var pointElem = $('#point' + pos);
    if (pointElem) {
      return pointElem.find('div.piece').last();
    }
    return null;
  };

  this.getTopPiece = function (pos) {
    var pieceElem = this.getTopPieceElem(pos);
    if (pieceElem) {
      return pieceElem.data('piece');
    }
    return null;
  };
  
  this.getBarElem = function (type) {
    var barID = (type === this.client.player.currentPieceType) ? 'top-bar' : 'bottom-bar';
    var bar = $('#' + barID);
    return bar;
  };

  this.getBarTopPieceElem = function (type) {
    var barElem = this.getBarElem(type);
    var pieceElem = barElem.find('div.piece').last();
    
    return pieceElem;
  };
  
  this.getBarTopPiece = function (type) {
    var pieceElem = this.getBarTopPieceElem(type);
    if (pieceElem) {
      return pieceElem.data('piece');
    }
    return null;
  };

  this.getPieceByID = function (id) {
    return $('#piece' + id);
  };
  
  /**
   * Handles clicking on a point (position)
   */
  this.handlePointClick = function (e) {
    var self = e.data;
    var game = self.match.currentGame;
        
    console.log('mousedown click', game);
    if (!model.Game.hasMoreMoves(game)) {
      return;
    }

    var movesLeft = game.turnDice.movesLeft;
    var steps;
    // If right mouse button was pressed, play last die value
    if (e.which === 3) {
      steps = movesLeft[movesLeft.length - 1];
    }
    // If left mouse button was pressed, play first die value
    else {
      steps = movesLeft[0];
    }
    var position = $(e.currentTarget).data('position');
    var piece = self.getTopPiece(position);
    if (piece) {
      self.client.reqMove(piece, steps);
    }
    e.preventDefault();
  };
  
  /**
   * Handles clicking on a point (position)
   */
  this.handleBarClick = function (e) {
    var self = e.data;
    var game = self.match.currentGame;

    if (!model.Game.hasMoreMoves(game)) {
      return;
    }

    var movesLeft = game.turnDice.movesLeft;
    var steps;
    // If right mouse button was pressed, play last die value
    if (e.which === 3) {
      steps = movesLeft[movesLeft.length - 1];
    }
    // If left mouse button was pressed, play first die value
    else {
      steps = movesLeft[0];
    }
    var pieceElem = $(e.currentTarget).find('div.piece').last();
    var piece = pieceElem.data('piece');
    if (piece) {
      self.client.reqMove(piece, steps);  
    }
    e.preventDefault();
  };
  
  /**
   * Assign actions to DOM elements
   */
  this.assignActions = function () {
    var self = this;
    
    // Game actions
    $('#btn-roll').unbind('click');
    $('#btn-roll').click(function (e) {
      self.client.reqRollDice();
      console.log('roll1', e);
      console.log('roll2', this);
    });

    $('#btn-confirm').unbind('click');
    $('#btn-confirm').click(function (e) {
      self.client.reqConfirmMoves();
    });
    
    $('#btn-undo').unbind('click');
    $('#btn-undo').click(function (e) {
      self.client.reqUndoMoves();
    });
    
    $('#menu-undo').unbind('click');
    $('#menu-undo').click(function (e) {
      self.client.reqUndoMoves();
    });
    
    $('#menu-resignMatch').unbind('click');
    $('#menu-resignMatch').click(function (e) {
      // Ask player if they want to resign from current game only
      // or abandon the whole match
      $('.navbar').collapse('hide');
      $("#game-view").hide();
      Swal.fire({
        title: 'تاییدیه واگذاری',
        text: "آیا مطمئن هستید؟",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'بله',
        cancelButtonText: 'خیر'
      }).then((result) => {
        if (result.value) {
          //self.client.reqResignGame();
          self.client.reqResignMatch();
        }
        $("#game-view").show();
      })
    });


    $('#menu-resignGame').unbind('click');
    $('#menu-resignGame').click(function (e) {
      // Ask player if they want to resign from current game only
      // or abandon the whole match
      $('.navbar').collapse('hide');
      $("#game-view").hide();
      Swal.fire({
        title: 'تاییدیه واگذاری',
        text: "آیا مطمئن هستید؟",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'بله',
        cancelButtonText: 'خیر'
      }).then((result) => {
        if (result.value) {
          self.client.reqResignGame();
         
        }
        $("#game-view").show();
      })
    });
    
    if ((!this.match) || (!this.match.currentGame) || (!this.client.player)) {
      return;
    }
    
    // Actions for points
    for (var pos = 0; pos < 24; pos++) {
      var pointElem = this.getPointElem(pos);

      $(document).on('contextmenu', pointElem, function(e){
        // Block browser menu
        return false;
      });
      pointElem.unbind('mousedown');
      pointElem.mousedown(self, self.handlePointClick);
    }
    
    // Actions for bar
    for (var pieceType = 0; pieceType <= model.PieceType.BLACK; pieceType++) {
      console.log('pieceType', pieceType);
      var barElem = this.getBarElem(pieceType);
      console.log(barElem);
      
      $(document).on('contextmenu', barElem, function(e){
        // Block browser menu
        return false;
      });
      
      barElem.unbind('mousedown');
      barElem.mousedown(self, self.handleBarClick);
    }
  };

  this.createPoint = function (field, pos, type) {
    var pointElem = $('<div id="point' + pos + '" class="point ' + type + '"></div>');
    pointElem.data('position', pos);
    field.append(pointElem);
  };

  this.createPoints = function () {
    /*
      Fields are numbered in the following way,
      no matter what pieces the user is playing with:
      - Field 0 - top left
      - Field 1 - bottom left
      - Field 2 - top right
      - Field 3 - bottom right
      
      Fields are arrange on the board in the following way:
      
      +12-13-14-15-16-17------18-19-20-21-22-23-+
      |                  |   |                  |
      |      Field 0     |   |      Field 2     |
      |                  |   |                  |
      |                  |   |                  |
      |                  |   |                  |
      |                  |   |                  |
      |                  |   |                  |
      |                  |   |                  |
      |                  |   |                  |
      |      Field 1     |   |      Field 3     |
      |                  |   |                  |
      +11-10--9--8--7--6-------5--4--3--2--1--0-+ -1
      
    */
    
    var pieceType = this.client.player.currentPieceType;
    var i;
    var k;
    var typeClass;
    
    for (i = 12; i < 18; i++) {
      typeClass = i % 2 === 0 ? 'even' : 'odd';
      
      k = (pieceType === model.PieceType.BLACK) ? i - 12 : i;
      this.createPoint(this.fields[0], k, typeClass);
    }

    for (i = 11; i >= 6; i--) {
      typeClass = i % 2 === 0 ? 'even' : 'odd';
      
      k = (pieceType === model.PieceType.BLACK) ? i + 12 : i;
      this.createPoint(this.fields[1], k, typeClass);
    }

    for (i = 18; i < 24; i++) {
      typeClass = i % 2 === 0 ? 'even' : 'odd';
      
      k = (pieceType === model.PieceType.BLACK) ? i - 12 : i;
      this.createPoint(this.fields[2], k, typeClass);
    }

    for (i = 5; i >= 0; i--) {
      typeClass = i % 2 === 0 ? 'even' : 'odd';
      
      k = (pieceType === model.PieceType.BLACK) ? i + 12 : i;
      this.createPoint(this.fields[3], k, typeClass);
    }
  };

  this.createPiece = function (parentElem, piece, count) {
    var pieceTypeClass = piece.type === model.PieceType.WHITE ? 'white' : 'black';

    var pieceElem = $('<div id="piece' + piece.id + '" class="piece ' + pieceTypeClass + '"><div class="image">&nbsp;</div></div>');
    pieceElem.data('piece', piece);

    parentElem.append(pieceElem);
  };
  
  /**
   * Compact pieces in all positions
   */
  this.compactAllPositions = function () {
    for (var i = 0; i < 24; i++) {
      this.compactPosition(i);
    }
    this.compactElement(this.getBarElem(model.PieceType.WHITE), this.client.player.currentPieceType === model.PieceType.WHITE ? 'top' : 'bottom');
    this.compactElement(this.getBarElem(model.PieceType.BLACK), this.client.player.currentPieceType === model.PieceType.BLACK ? 'top' : 'bottom');
  };
  
  /**
   * Compact pieces in specific DOM element to make them fit vertically.
   * @param {number} pos - Position of point
   * @param {string} alignment - Alignment of pieces - 'top' or 'bottom', depending on within which side of the board the piece is
   */
  this.compactElement = function (element, alignment) {
    var elementHeight = element.height();
    var itemCount = element.children().length;

    if (itemCount > 0) {
      var firstItem = element.children().first();
      var itemHeight = firstItem.width();
      var ratio = 100;
      var overflow = (itemHeight * itemCount) - elementHeight;

      if ((overflow > 0) && (itemHeight > 0) && (itemCount > 1))
      {
        // Example:
        // itemHeight = 88
        // offset per item = 8
        // margin in percent = 100 - ((8 / 88) * 100)
        ratio = 100 - (((overflow / (itemCount - 1)) / itemHeight) * 100);
      }
      
      if (ratio > 100) {
        ratio = 100;
      }
      if (ratio <= 0) {
        ratio = 1;
      }
      
      var self = this;
      element.children().each(function(i) {
        var marginPercent = ratio * i;
        var negAlignment = (alignment === 'top') ? 'bottom' : 'top';
        
        $(this).css(alignment, "0");
        $(this).css("margin-" + alignment, self.toFixedDown(marginPercent, 2) + "%");

        $(this).css(negAlignment, "inherit");
        $(this).css("margin-" + negAlignment, "inherit");
      });
    }
  };

  /**
   * Compact pieces in specific position to make them fit on screen vertically.
   * @param {Number} pos - Position of point
   */
  this.compactPosition = function (pos) {
    var pointElement = this.getPointElem(pos);
    var alignment;
    
    if (this.client.player.currentPieceType === model.PieceType.BLACK) {
      alignment = ((pos >= 0) && (pos <= 11)) ? 'top' : 'bottom';
    }
    else {
      alignment = ((pos >= 12) && (pos <= 23)) ? 'top' : 'bottom';
    }
    
    this.compactElement(pointElement, alignment);
  };

  this.createPieces = function () {
    var game = this.match.currentGame;
    var i, pos;
    var b;
    
    for (pos = 0; pos < game.state.points.length; pos++) {
      var point = game.state.points[pos];
      for (i = 0; i < point.length; i++) {
        var pointElem = this.getPointElem(pos);
        this.createPiece(pointElem, point[i], 0);
      }
      this.compactPosition(pos);
    }
    
    
    for (b = 0; b < game.state.bar.length; b++) {
      var bar = game.state.bar[b];
      for (i = 0; i < bar.length; i++) {
        var piece = bar[i];
        var barElem = this.getBarElem(piece.type);
        this.createPiece(barElem, piece, 0);
      }
    }
  };

  this.removePoints = function () {
    for (var i = 0; i < 4; i++) {
      this.fields[i].empty();
    }
  };

  this.removePieces = function () {
    var game = this.match.currentGame;
    
    for (var pos = 0; pos < game.state.points.length; pos++) {
      var point = game.state.points[pos];
      var pointElem = this.getPointElem(pos);
      pointElem.empty();
    }
    
    this.getBarElem(model.PieceType.BLACK).empty();
    this.getBarElem(model.PieceType.WHITE).empty();
  };

  /**
   * Reset board UI
   * @param {Match} match - Match
   * @param {Rule} rule - Rule
   */
  this.resetBoard = function (match, rule) {
    this.match = match;
    this.rule = rule;

    

    this.removePieces();
    this.removePoints();

    this.createPoints();
    this.createPieces();
    
    this.randomizeDiceRotation();
    
    this.assignActions();
    this.updateControls();
    this.updateScoreboard();
    
    this.compactAllPositions();
    this.resizeUI();
  };
  
  this.handleTurnStart = function () {
    this.randomizeDiceRotation();
  };
  
  this.handleEventUndoMoves = function () {
    this.notifyInfo('Player undid last move.');
  };
  
  this.handleEventGameRestart = function () {
    var yourscore = this.match.score[this.client.player.currentPieceType];
    var oppscore = this.match.score[this.client.otherPlayer.currentPieceType];
    var message = 'Match result: <b>You ' + yourscore + '</b> / ' + oppscore + ' Opponent';
    var timeout = 5000;
    if (yourscore > oppscore) {
      this.notifyPositive(message, timeout);
    }
    else if (yourscore < oppscore) {
      this.notifyNegative(message, timeout);
    }
    else {
      this.notifyInfo(message, timeout);
    }
  };

  this.randomizeDiceRotation = function () {
    this.rotationAngle = [];
    for (var i = 0; i < 10; i++) {
      this.rotationAngle[i] = Math.random() * 30 - 15;  
    }
  };

  this.updateControls = function () {

    if ((!this.match) || (!this.match.currentGame)) {
      $('#btn-roll').hide();
      $('#btn-confirm').hide();
      $('#btn-undo').hide();
      $('#menu-resignMatch').hide();
      $('#menu-resignGame').hide();
      $('#menu-undo').hide();
      return;
    }

    
    
    
    var game = this.match.currentGame;

    var showRollDice=game.hasStarted &&
    (!game.isOver) &&
    model.Game.isPlayerTurn(game, this.client.player) &&
    (!model.Game.diceWasRolled(game)) &&
    (!game.turnConfirmed);

    if(showRollDice && this.match.turnDices.length==0)
    {
      
      this.client.reqRollDice();
    }
    /*$('#btn-roll').toggle(
      
    );*/
    
    var canConfirmMove =
      game.hasStarted &&
      (!game.isOver) &&
      model.Game.isPlayerTurn(game, this.client.player) &&
      model.Game.diceWasRolled(game) &&
      (!model.Game.hasMoreMoves(game)) &&
      (!game.turnConfirmed);

    var canUndoMove =
      game.hasStarted &&
      (!game.isOver) &&
      model.Game.isPlayerTurn(game, this.client.player) &&
      model.Game.diceWasRolled(game) &&
      (!game.turnConfirmed);
    
    $('#btn-confirm').toggle(canConfirmMove);
    $('#btn-undo').toggle(canConfirmMove);
    
    $('#menu-resignMatch').toggle(game.hasStarted && (!game.isOver));
    $('#menu-resignGame').toggle(game.hasStarted && (!game.isOver));
    $('#menu-undo').toggle(canUndoMove);

    var showDice = game.hasStarted &&
      (!game.isOver) &&
      model.Game.diceWasRolled(game) &&
      (!game.turnConfirmed);
      $('.dice-panel').toggle(showDice);
      
    if (showDice) {
      this.updateDice(game.turnDice, game.turnPlayer.currentPieceType);
      
      
    }


    if(game.hasStarted)
    {

      //console.log(game);

      var self=this;
      clearInterval(window.intervalID);
      window.turnExpire=this.client.match.currentGame.turnExpire;
    
      
      if(this.client.match.host.username==this.client.player.username)
      {
        $("#playerTimeBank").text(this.client.match.host.timeBank+"");
        $("#oponentTimeBank").text(this.client.match.guest.timeBank+"");
      }
      else
      {
        $("#playerTimeBank").text(this.client.match.guest.timeBank+"");
        $("#oponentTimeBank").text(this.client.match.host.timeBank+"");
      }
      

      if(this.client.match.currentGame.turnPlayer.username==this.client.player.username)
      {
          window.intervalID=setInterval(function(){self.updateTurnTime("#playerTimeLeft","#oponentTimeLeft")},1000);  
      }
      else
      {
          window.intervalID=setInterval(function(){self.updateTurnTime("#oponentTimeLeft","#playerTimeLeft")},1000);   
      }


      var blackOutside=0;
      var whiteOutside=0;
      for(var i=0;i<game.state.blackOutside.length;i++)
      {
          if(game.state.blackOutside[i].type==1)
          {
            blackOutside++;
          }
      }
      for(var i=0;i<game.state.whiteOutside.length;i++)
      {
          if(game.state.whiteOutside[i].type==0)
          {
            whiteOutside++;
          }
      }
      $("#playerBear").html('');
      $("#oponnentBear").html('');
      if(this.client.otherPlayer.currentPieceType==0)
      {
        for(var i=0;i<whiteOutside;i++)
        {
          $("#oponnentBear").append('<div class="outsidePiece outsidePieceWhite"><img src="/public/images/piece-white-2.png" /></div>');
        }
        for(var i=0;i<blackOutside;i++)
        {
          $("#playerBear").append('<div class="outsidePiece outsidePieceBlack"><img src="/public/images/piece-black-2.png" /></div>');
          
        }
        //$("#oponentBear").text(whiteOutside);
        //$("#playerBear").text(blackOutside);
      }
      else
      {
        for(var i=0;i<blackOutside;i++)
        {
          $("#oponnentBear").append('<div class="outsidePiece outsidePieceBlack"><img src="/public/images/piece-black-2.png" /></div>');
        }
        for(var i=0;i<whiteOutside;i++)
        {
          $("#playerBear").append('<div class="outsidePiece outsidePieceWhite"><img src="/public/images/piece-white-2.png" /></div>');
          
        }
        //$("#oponentBear").text(blackOutside);
        //$("#playerBear").text(whiteOutside);
      }
      

      $("#boardOpponentName").text(this.client.otherPlayer.username);
      $("#oponentPiece").parent().css('background-color' ,(this.client.otherPlayer.currentPieceType==0?"#fff":"#000"));
      $("#oponentPiece").parent().css('border' ,"solid 4px #0f0");
      $("#oponentPiece").parent().attr('title' ,this.client.otherPlayer.username);
      $("#oAvatar").attr("style","background-size: cover; background-position: "+(this.client.otherPlayer.avatarIndex*-32)+"px 0px;background-image: url('/public/images/avatars.png')")

      

      $("#boardPlayerName").text(this.client.player.username);
      $("#playerPiece").parent().css('background-color' ,(this.client.player.currentPieceType==0?"#fff":"#000"));
      $("#playerPiece").parent().css('border' ,"solid 4px #0f0");
      $("#playerPiece").parent().attr('title' ,this.client.player.username);
      $("#pAvatar").attr("style","background-size: cover; background-position: "+(this.client.player.avatarIndex*-32)+"px 0px;background-image: url('/public/images/avatars.png')")
    }
    
    
    if(model.Game.isPlayerTurn(game, this.client.player))
    {
      
      $("#playerTurn").css("border-color","#0f0");
      $("#oponentTurn").css("border-color","transparent");
    }
    else{
      
      $("#playerTurn").css("border-color","transparent");
      $("#oponentTurn").css("border-color","#0f0");
    }



    this.resizeUI();
  };
  
  this.updateScoreboard = function () {
    if ((!this.match) || (!this.match.currentGame)) {
      return;
    }
  


    var isInMatch = (this.match.currentGame);

    var matchText ="";
    if(isInMatch)
    {
      var matchType="";
      if(this.match.ruleName=="RuleBgCasual")
      {
        matchType="معمولی";
      }
      else if(this.match.ruleName=="RuleBgGulbara")
      {
        matchType="گل بهار";
      }
      else if(this.match.rule=="RuleBgTapa")
      {
        matchType="تاپا";
      }
      matchText="نوع بازی : "+matchType + " - "+this.match.length+" دسته - "+this.match.buyIn;
    }
  $('#match-state').text(matchText);
  
  if(this.match.length==1)
  {
    $("#menu-resignGame").hide()
  }
  else
  {
    $("#menu-resignGame").show()
  }


    /*var matchText = (isInMatch) ?
      'Match "' + this.rule.title + '", ' + this.match.length + '/' + this.match.length
      :
      'Not in match';
    var matchTextTitle = (isInMatch) ?
      'Playing match with length of ' + this.match.length + ' games and rule "' + this.rule.title + '"'
      :
      'Match has not been started';
    $('#match-state').text(matchText);
    $('#match-state').attr('title', matchTextTitle);*/
    
    var yourscore = this.match.score[this.client.player.currentPieceType];
    $('#yourscore').text(yourscore);

    if (this.client.otherPlayer) {
      var oppscore = this.match.score[this.client.otherPlayer.currentPieceType];
      $('#oppscore').text(oppscore);
    }
    else {
      $('#oppscore').text('');
    }


    if(this.match.length==1 || yourscore+oppscore+1==this.match.length)
    {
      $("#menu-resignGame").hide()
    }
    else
    {
      $("#menu-resignGame").show()
    }

    this.resizeUI();
  };
  
  this.showGameEndMessage = function (winner, resigned) {
    $('#game-result-overlay').show();
    
    var result = winner.id === this.client.player.id;
    var message;
    var matchState;
    
    if (resigned) {
      message = (result) ? 'حریف انصراف داد :)' : 'شما انصراف دادید';
    }
    else {
      message = (result) ? 'شما بردید :)' : 'شما باختید';
    }
    
    matchState = 'وضعیت برد و باخت - ';
    if (this.match.isOver) {
      message += message = ' مسابقه تمام شد';
      matchState = 'نتیجه مسابقه - ';
    }
    
    var color = (result) ? 'green' : 'red';
    
    $('.game-result').css('color', color);
    $('.game-result .message').html(message);
    $('.game-result .state').html(matchState);
    
    var yourscore = this.match.score[this.client.player.currentPieceType];
    var oppscore = this.match.score[this.client.otherPlayer.currentPieceType];
    $('.game-result .yourscore').text(yourscore);
    $('.game-result .oppscore').text(oppscore);
    
    /*$('.game-result .text').each(function () {
      fitText($(this));
    });*/
    
    if (resigned) {
      this.notifyInfo('Other player resigned from game');
    }
  };

  /**
   * Updates the DOM element representing the specified die (specified by index).
   * Changes CSS styles of the element.
   * @param {Dice} dice - Dice to render
   * @param {number} index - Index of dice value in array
   * @param {PieceType} type - Player's type
   */
  this.updateDie = function (dice, index, type) {
    var color = (type === model.PieceType.BLACK) ? 'black' : 'white';
    var id = '#die' + index;
    
    // Set text
    $(id).text(dice.values[index]);
    
    // Change image
    $(id).removeClass('digit-1-white digit-2-white digit-3-white digit-4-white digit-5-white digit-6-white digit-1-black digit-2-black digit-3-black digit-4-black digit-5-black digit-6-black played semiPlayed');
    $(id).addClass('digit-' + dice.values[index] + '-' + color);



    if(dice.moves.length==2)
    {
      if(dice.movesPlayed.length==2)
      {
        $(id).addClass('played');
      }
      else if(dice.movesPlayed.length==1 && dice.movesPlayed[0]==dice.values[index])
      {
        $(id).addClass('played');
      }
    }
    else
    {
      if(index==0)
      {
        if(dice.movesPlayed.length==0)
        {
          //do nothing
        }
        else if(dice.movesPlayed.length==1)
        {
          $(id).addClass('semiPlayed');
        }
        else if(dice.movesPlayed.length==2)
        {
          $(id).addClass('played');
        }
        else if(dice.movesPlayed.length==3)
        {
          $(id).addClass('played');
        }
        else if(dice.movesPlayed.length==4)
        {
          $(id).addClass('played');
        }
      }
      else
      {
        if(dice.movesPlayed.length==0)
        {
          //do nothing
        }
        else if(dice.movesPlayed.length==1)
        {
          //do nothing
        }
        else if(dice.movesPlayed.length==2)
        {
          //do nothing
        }
        else if(dice.movesPlayed.length==3)
        {
          $(id).addClass('semiPlayed');
        }
        else if(dice.movesPlayed.length==4)
        {
          $(id).addClass('played');
        }
      }

      
    }
    
    var angle = this.rotationAngle[index];
    $(id).css('transform', 'rotate(' + angle + 'deg)');
    this.resizeUI();
  };

  this.updateTurnTime=function(containertToSet,containerToZero){
    $(containerToZero).text('0');
    var leftTime=Math.round((window.turnExpire-Date.now()+window.timeOffset)/1000);
    if(leftTime>0)
    {
      $(containertToSet).text(leftTime+"");
    }
    else
    {
      $(containertToSet).text("0");
    }

    
  };

  this.showTurnDice = function (dices) {
    console.log("showTurnDice");

    var currentPieceType= this.client.player.currentPieceType;
    var isHostPlayer=(this.client.player==this.match.host);

    $('.dice').each(function() {
      $(this).empty();
    });

    $('#btn-roll').hide();
    $('#btn-confirm').hide();
    $('#btn-undo').hide();
    $('.dice-panel').show();
    
    if(isHostPlayer)
    {
      $('#dice-left').append('<span id="die1" class="die"></span>');
      $('#dice-right').append('<span id="die2" class="die"></span>');
    }
    else
    {
      $('#dice-right').append('<span id="die1" class="die"></span>');
      $('#dice-left').append('<span id="die2" class="die"></span>');
    }
    
    
    

    var dice=dices.shift();
    if(dice)
    {
     
      $("#die1").text(dice.values[0]);
      $("#die2").text(dice.values[1]);
      
      $("#die1").removeClass('digit-1-white digit-2-white digit-3-white digit-4-white digit-5-white digit-6-white digit-1-black digit-2-black digit-3-black digit-4-black digit-5-black digit-6-black played semiPlayed');
      $("#die2").removeClass('digit-1-white digit-2-white digit-3-white digit-4-white digit-5-white digit-6-white digit-1-black digit-2-black digit-3-black digit-4-black digit-5-black digit-6-black played semiPlayed');
      if(currentPieceType==0)
      {
        $("#die1").addClass('digit-' + dice.values[0] + '-white');
        $("#die2").addClass('digit-' + dice.values[1] + '-black');
      }
      else
      {
        $("#die1").addClass('digit-' + dice.values[0] + '-black');
        $("#die2").addClass('digit-' + dice.values[1] + '-white');
      }

      $("#die1").css('transform', 'rotate(' + this.rotationAngle[0] + 'deg)');
      $("#die2").css('transform', 'rotate(' + this.rotationAngle[1] + 'deg)');

      var _this=this;
      setTimeout(function(){_this.showTurnDice(dices)},2000);
    }
    else{
      var _this=this;
      setTimeout(function(){_this.updateControls()},2000);
      setTimeout(function(){_this.updateScoreboard()},2000);
    }

  };

  /**
   * Recreate DOM elements representing dice and render them in dice container.
   * Player's dice are shown in right pane. Other player's dice are shown in 
   * left pane.
   * @param {Dice} dice - Dice to render
   * @param {number} index - Index of dice value in array
   * @param {PieceType} type - Player's type
   */
  this.updateDice = function (dice, type) {
    $('.dice').each(function() {
      $(this).empty();
    });

    // Player's dice are shown in right pane.
    // Other player's dice are shown in left pane.
    var diceElem;
    /*if (type === this.client.player.currentPieceType) {
      diceElem = $('#dice-left');
    }
    else {
      diceElem = $('#dice-right');
    }*/
    
    if(this.client.match.currentGame!=undefined && this.client.match.currentGame.turnPlayer!=null)
    {

      if (this.client.match.currentGame.turnPlayer.username==this.client.player.username) {
        diceElem = $('#dice-right');
      }
      else {
        diceElem = $('#dice-left');
      }

      for (var i = 0; i < dice.values.length; i++) {
        diceElem.append('<span id="die' + i + '" class="die"></span>');
        this.updateDie(dice, i, type);
      }
      
      var self = this;
      $('.dice .die').unbind('click');
      $('.dice .die').click(function (e) {
        if (dice.movesLeft.length > 0) {
          console.log('Values:', dice.values);
          console.log('Moves left:', dice.movesLeft);
          model.Utils.rotateLeft(dice.values);
          model.Utils.rotateLeft(dice.movesLeft);
        }
        self.updateControls();
      });
    }
    



    
  };

  this.playActions = function (actionList) {
    for (var i = 0; i < actionList.length; i++) {
      var action = actionList[i];
      if (action.type === model.MoveActionType.MOVE) {
        this.playMoveAction(action);
      }
      else if (action.type === model.MoveActionType.RECOVER) {
        this.playRecoverAction(action);
      }
      else if (action.type === model.MoveActionType.HIT) {
        this.playHitAction(action);
      }
      else if (action.type === model.MoveActionType.BEAR) {
        this.playBearAction(action);
      }

      // TODO: Make sure actions are played back slow enough for player to see
      // all of them comfortly
    }
  };
  
  this.playMoveAction = function (action) {
    if (!action.piece) {
      throw new Error('No piece!');
    }

    var pieceElem = this.getPieceElem(action.piece);
    var srcPointElem = pieceElem.parent();
    var dstPointElem = this.getPointElem(action.to);

    pieceElem.detach();
    dstPointElem.append(pieceElem);

    this.compactPosition(srcPointElem.data('position'));
    this.compactPosition(dstPointElem.data('position'));
  };
  
  this.playRecoverAction = function (action) {
    if (!action.piece) {
      throw new Error('No piece!');
    }

    var pieceElem = this.getPieceElem(action.piece);
    var srcPointElem = pieceElem.parent();
    var dstPointElem = this.getPointElem(action.position);

    pieceElem.detach();
    dstPointElem.append(pieceElem);

    this.compactElement(srcPointElem, action.piece.type === this.client.player.currentPieceType ? 'top' : 'bottom');
    this.compactPosition(dstPointElem.data('position'));
  };
  
  this.playHitAction = function (action) {
    if (!action.piece) {
      throw new Error('No piece!');
    }

    var pieceElem = this.getPieceElem(action.piece);
    var srcPointElem = pieceElem.parent();
    var dstPointElem = this.getBarElem(action.piece.type);

    pieceElem.detach();
    dstPointElem.append(pieceElem);

    this.compactPosition(srcPointElem.data('position'));
    this.compactElement(dstPointElem, action.piece.type === this.client.player.currentPieceType ? 'top' : 'bottom');
  };
  
  this.playBearAction = function (action) {
    if (!action.piece) {
      throw new Error('No piece!');
    }

    var pieceElem = this.getPieceElem(action.piece);
    var srcPointElem = pieceElem.parent();

    pieceElem.detach();

    this.compactPosition(srcPointElem.data('position'));
  };
  
  /**
   * Compact pieces after UI was resized
   */
  this.resizeUI = function () {
    if(this.match!=undefined && this.match!=null)
    {
      this.compactAllPositions();

      var pieceWidth=$($(".piece")[0]).width();
  
      $(".outsidePiece img").each(function(){
        $(this).width(pieceWidth);
      });
      if($("#oponnentBear .outsidePiece").length*pieceWidth> $("#oponnentBear").width())
      {
        var offset=(pieceWidth/(($("#oponnentBear .outsidePiece").length*pieceWidth)/$("#oponnentBear").width()))-5;
        var index=0;
        $("#oponnentBear .outsidePiece").each(function(){
          $(this).css("right",(index*offset)+"px");
          index++;
        });
      }
      else
      {
        var index=0;
        $("#oponnentBear .outsidePiece").each(function(){
          $(this).css("right",(index*pieceWidth)+"px");
          index++;
        });
      }
  
      if($("#playerBear .outsidePiece").length*pieceWidth> $("#playerBear").width())
      {
        var offset=(pieceWidth/(($("#playerBear .outsidePiece").length*pieceWidth)/$("#playerBear").width()))-5;
        var index=0;
        $("#playerBear .outsidePiece").each(function(){
          $(this).css("right",$("#playerBear").width()+(index*offset)+"px");
          index++;
        });
      }
      else{
        var index=0;
        $("#playerBear .outsidePiece").each(function(){
          $(this).css("right",$("#playerBear").width()+(index*pieceWidth)+"px");
          index++;
        });
      }
      
      $("#bearPiece").height($($(".piece")[0]).height());
      $(".bearSection").css("max-height",$($(".piece")[0]).height())
      this.compactAllPositions();
    }
    
  };


  this.autoConfirm = function () {
    
    if(!model.Game.hasMoreMoves(this.match.currentGame))
      {
        this.notifyNegative("No Moves",2000);
        var _this = this;
        setTimeout(function() { _this.client.reqConfirmMoves(); }, 2000);
      }
    /*if(this.match!=null && this.match.currentGame!=undefined && this.match.currentGame.hasStarted)
    {
      
    }*/
    
  };
  this.confirmMove=function(self)
  {
    
  }
}

module.exports = SimpleBoardUI;
