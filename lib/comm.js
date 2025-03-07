/**
 * Protocol options
 * @type {{Port: number}}
 */
/*var Protocol = {
    BindAddress: '0.0.0.0',
    Port: 8080
};
module.exports.Protocol = Protocol;*/

/**
 * Message IDs
 * @readonly
 * @enum {string}
 */
var Message = {
  CONNECT: 'connect',
  RECONNECT: 'reconnect',
  DISCONNECT: 'disconnect',
  CREATE_PLAYER: 'createPlayer',
  GET_MATCH_LIST: 'getMatchList',
  PLAY_RANDOM: 'playRandom',
  CREATE_MATCH: 'createMatch',
  JOIN_MATCH: 'joinMatch',
  ROLL_DICE: 'rollDice',
  MOVE_PIECE: 'movePiece',
  CONFIRM_MOVES: 'confirmMoves',
  UNDO_MOVES: 'undoMoves',
  RESIGN_GAME: 'resignGame',
  RESIGN_MATCH: 'resignMatch',
  EVENT_PLAYER_JOINED: 'eventPlayerJoined',
  EVENT_TURN_START: 'eventTurnStart',
  EVENT_DICE_ROLL: 'eventDiceRoll',
  EVENT_PIECE_MOVE: 'eventPieceMove',
  EVENT_MATCH_START: 'eventMatchStart',
  EVENT_MATCH_OVER: 'eventMatchOver',
  EVENT_GAME_OVER: 'eventGameOver',
  EVENT_GAME_RESTART: 'eventGameRestart',
  EVENT_UNDO_MOVES: 'eventUndoMoves',
  CANCEL_MATCH: 'cancelMatch',
  OPPONENT_DISCONNECT: 'opponentDisconnect',
  OPPONENT_RECONNECT: 'opponentReconnect',
  UPDATE_STATUS: 'updateStatus',
};

module.exports.Message = Message;
