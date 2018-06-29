/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WebSocketServer and Network Management for UNISYS

  1. create a websocket server on port
  2. define handlers

  socket listener
  socket dictionary
  message dictionary
  dispatcher
  subscribed to
  subscribers

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/**	LOAD LIBRARIES ***********************************************************/

  // required utility libraries
  var   WSS               = require('ws').Server;
  var   FSE               = require('fs-extra');
  var   PATH              = require('path');
  var   NetMessage        = require('./common-netmessage-class');

  // websocket data structures
  const DEFAULT_UNET_PORT = 2929;
  var   mu_wss;         // unisys socket server
  var   mu_opt_network; // match WebSocketServer options

  // constants: prompts
  const PR                = "UNET:";
  const ERR               = "ERR:";
  // constants: error strings
  const ERR_SS_EXISTS = ERR+PR+"socket server already created";

  var   UNET = {};

  var   DBG = true;

/**	API MAIN METHODS *********************************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	creates web socket server and listeners
/*/	UNET.CreateNetwork = ( options ) => {
      options = options || {};
      options.port = options.port || DEFAULT_UNET_PORT;
      if (mu_wss !== undefined) throw Error(ERR_SS_EXISTS);
      // create listener.
      if (DBG) console.log(PR,`CreateNetwork on port ${options.port}`);
      mu_wss = new WSS(options);
      mu_wss.on('connection',f_NewSocket);
      // save configuration options
      mu_opt_network = options;

  /** new socket handler *****************************************************/
      function f_NewSocket( socket ) {
        socket.on('message', ( json )=>{
          let obj = JSON.parse(json);
          var msg = new NetMessage(msg);
          if (DBG) console.log(PR,'Socket Connected');
        });
      }
    };


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNET;
