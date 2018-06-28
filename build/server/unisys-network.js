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
  var   NetMessage        = require('../app/system/object/netmessage-class');

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

/**	API MAIN METHODS *********************************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	creates web socket server and listeners
/*/	UNET.CreateNetwork = ( options ) => {
      // save configuration options
      mu_opt_network = options || {};
      let { port=DEFAULT_UNET_PORT } = mu_opt_network;
      if (mu_wss !== undefined) throw Error(ERR_SS_EXISTS);
      // create listener.
      mu_wss = new WSS(mu_opt_network);
      mu_wss.on('connection',f_NewSocket);

  /** new socket handler *****************************************************/
      function f_NewSocket( socket ) {
        socket.on('message', ( json )=>{
          let obj = JSON.parse(json);
          // var msg = new NetMessage(msg);
        });
      }
    };


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNET;
