'use strict';
/*jslint browser: true */
/*global fitText: false */
/*global ohSnap: false */

var $ = require('jquery');
var fittext = require('jquery-fittext');
var cookie = require('js-cookie');
// TODO: Fix this hack. Makes bootstrap happy, but this should not be needed.
window.jQuery = window.$ = $;

var clipboard = require('clipboard');
var cl = require('../../../lib/client');
var comm = require('../../../lib/comm.js');
var model = require('../../../lib/model.js');
require('../../../lib/rules/rule.js');
require('../../../lib/rules/RuleBgCasual.js');
require('../../../lib/rules/RuleBgGulbara.js');
require('../../../lib/rules/RuleBgTapa.js');

function App() {
  this._config = {};
  this._isWaiting = false;
  this._isChallenging = false;
  this._currentView = 'index';
  
  this.setIsWaiting = function (value) {
    this._isWaiting = value;
  };
  
  this.setIsChallenging = function (value) {
    this._isChallenging = value;
  };

  this.setCurrentView = function (name) {
    this._currentView = name;
  };

  
  this.updateView = function () {
    if (this._isChallenging) {
      $('#waiting-overlay .challenge').show();
    } else {
      $('#waiting-overlay .challenge').hide();
    }

    if (this._isWaiting) {
      $('#waiting-overlay').show();
    } else {
      $('#waiting-overlay').hide();
    }

    $('#game-view').hide();
    $("body header").show();
    $('.main-content').show();
    if (this._currentView === 'index') {
      $("body header").show();
    $('.main-content').show();
    }
    else if (this._currentView === 'game') {
      $('#game-view').show();
      $("body header").hide();
      $('.main-content').hide();
    }
  };

  /**
   * Get name of rule selected by player
   * @returns {string} - Name of selected rule.
   */
  this.getSelectedRuleName = function () {
    var selected = $('#cm-ruleFilter').val();
    return selected;
  };
  

  this.getSelectedMatchLength = function () {
    var selected = $('#cm-matchCount').val();
    return selected;
  };

  this.getSelectedTableID = function () {
    var selected =$("#leagueSelect li a.active:first").attr("leagueName");
    return selected;
  };

  this.getSelectedPrice = function () {
    var selected =$("#cm-matchPrice").val();
    return selected;
  };

  /**
   * Load rule module
   * @param {string} ruleName - Rule's name, equal to rule's class name (eg. RuleBgCasual)
   * @returns {Rule} - Corresponding rule object
   */
  this.loadRule = function (ruleName) {
    var rulePath = '../../../lib/rules/';
    var fileName = model.Utils.sanitizeName(ruleName);
    var file = rulePath + fileName + '.js';
    var rule = require(file);
    rule.name = fileName;
    return rule;
  };
  
  /**
   * Initialize selector of game rule
   */
  this.initRuleSelector = function () {
    // Init rule selector
    var selector = $('#rule-selector');
    var i;
    for (i = 0; i < this._config.selectableRules.length; i++) {
      var ruleName = this._config.selectableRules[i];
      var rule = this.loadRule(ruleName);
      var isSelected = false;
      var isActive = isSelected ? 'active' : '';
      var isChecked = isSelected ? 'checked' : '';

      var item = $('#tmpl-rule-selector-item').html();
      item = item.replace('^^name^^', rule.name);
      item = item.replace('^^title^^', rule.title);
      item = item.replace('^^active^^', isActive);
      item = item.replace('^^checked^^', isChecked);

      selector.append($(item));
    }
  };
  
  /**
   * Initialize application. Must be called after DOM is ready.
   * @param {Object} config - Configuration object
   */
  this.init = function (config) {
    var self = this;
    this._config = config;
    
    this.initRuleSelector();
    
    

    // Initialize game client
    var client = new cl.Client(this._config);

    // Subscribe to events used on landing page
    client.subscribe(comm.Message.EVENT_MATCH_START, function (msg, params) {
      self.setIsWaiting(false);
      self.setCurrentView('game');
      self.updateView();
      client.resizeUI();
    });

    client.subscribe(comm.Message.EVENT_MATCH_OVER, function (msg, params) {
      self.setIsWaiting(false);
      self.setCurrentView('index');
      self.updateView();
    });

    client.subscribe(comm.Message.EVENT_PLAYER_JOINED, function (msg, params) {
      self.setIsWaiting(false);
      self.setCurrentView('game');
      self.updateView();
      client.resizeUI();
    });

    client.subscribe(comm.Message.JOIN_MATCH, function (msg, params) {
      console.log("subscribe JOIN_MATCH");
      if (!params.result) {
        return;
      }
      self.setIsWaiting(false);
      self.setCurrentView('game');
      self.updateView();
      client.resizeUI();
    });

    client.subscribe(comm.Message.CREATE_GUEST, function (msg, params) {
      
      if (!params.reconnected) {
        // Get matchID from query string (?join=123456)
        var matchID = parseInt((location.search.split('join=')[1] || '').split('&')[0], 10);
        // Join game
        if(!isNaN(matchID))
        {
          client.reqJoinMatch(matchID);

          // Remove query string from URL
          if (history.pushState) {
            history.pushState(null, '', '/');
          }
        }
        
      }
    });

    client.reqGetMatchList();

    /*$('#btn-play-random').click(function (e) {
      self.setIsChallenging(false);
      self.setIsWaiting(true);
      self.updateView();
      // TODO: Store selected rule in cookie
      client.reqPlayRandom(self.getSelectedRuleName());
    });*/

    // Initialize the overlay showing game results
    $('#game-result-overlay').click(function () {
      $('#game-result-overlay').hide();
      client.resizeUI();
    });

    this.JoinMatch=function(matchID)
    {
      console.log("MatchID To Join : "+matchID);
      client.reqJoinMatch(matchID);
    }
    
    this.reloadMathLength=function(lenghtes)
    {
      console.log(lenghtes);
    }

    this.updateMatchView=function()
    {
      client.updateMatchView();
    }


    $("#CancelMatch").click(function(){
        client.reqCancelMatch();
        self.setIsChallenging(false);
        self.setIsWaiting(false);
        self.updateView();
    });

    $('#btn-challenge-friend').click(function (e) {
      self.setIsChallenging(false);
      self.setIsWaiting(true);
      self.updateView();

      // TODO: Store selected rule in cookie
      client.reqCreateMatch(self.getSelectedRuleName(),self.getSelectedMatchLength(),self.getSelectedTableID(),self.getSelectedPrice(), function (msg, clientMsgSeq, reply) {
        if (!reply.result) {
          self.setIsChallenging(false);
          self.setIsWaiting(false);
          self.updateView();
          return;
        }
        $("#CreateTableModal").modal("toggle");
        var serverURL = self._config.serverURL;
        if (!serverURL) {
          serverURL = window.location.protocol + '//' + window.location.host + '/';
        }
        $('#challenge-link').val(serverURL + '?join=' + reply.matchID);
        self.setIsChallenging(true);
        self.updateView();
      });
    });

    $(window).resize(function () {
      client.resizeUI();
    });


  };
}

var app = new App();

$(document).ready(function() {
  $("#leagueSelect li:first a").addClass("active");
  // Initialize bootstrap and helpers
  new clipboard('.btn-copy');

  // Prepare client config
  var config = require('./config');
  
  app.init(config);

  $(document).on("click", ".btn-joinMatch" , function() {
    Swal.fire({
      title: 'تاییدیه شروع بازی',
      text: "آیا مطمئن هستید؟",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'بله',
      cancelButtonText: 'خیر'
    }).then((result) => {
      if (result.value) {
        app.JoinMatch($(this).attr('matchID'));   
      }
    })
    
  });

  $("#leagueSelect li a").click(function(){
    $("#leagueSelect li a").each(function(){
      $(this).removeClass("active");
    });
    $(this).addClass("active");
    app.updateMatchView();
  });
  
  $(document).on("change", "#ruleFilter" , function() {

    

    app.updateMatchView();
  });

  /*$("#table-selector label").click(function()
  {
    
    var lengthes=$($(this).children()[0]).attr("matchLength").split(",");
    console.log(lengthes);
    $(".matchLength").each(function(){
      $(this).hide();
    });
    for(var i=0;i<lengthes.length;i++)
    {
      $($(".matchLength")[i]).show();
    }
  });*/
});

