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

const DBG = true;

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var   WSS           = require('ws').Server;
var   FSE           = require('fs-extra');
var   NetMessage    = require('../unisys/common-netmessage-class');

/// CONSTANTS /////////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS       = require('../system/util/prompts');
const PR            = PROMPTS.Pad('USERVE');
const ERR           = PROMPTS.Pad('!!!');
const ERR_SS_EXISTS = ERR+"socket server already created";
const DEFAULT_UNET_PORT = 2929;
const DEFAULT_UNET_ADDR = '127.0.0.1';

/// API CREATE NETWORK ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var mu_wss; // websocket server
var mu_options; // websocket options
var UNET = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ initialize parameters
/*/ UNET.Initialize = ( options ) => {
      options = options || {};
      options.port = options.port || DEFAULT_UNET_PORT;
      if (mu_wss !== undefined) throw Error(ERR_SS_EXISTS);
      mu_options = options;
      return mu_options;
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	creates web socket server and listeners
/*/	UNET.CreateNetwork = () => {
      // create listener.
      if (DBG) console.log(PR,`UNISYS NETWORK initialized on port ${mu_options.port}`);
      mu_wss = new WSS(mu_options);
      mu_wss.on('listening',function() {
        if (DBG) console.log(PR,`listening on port ${mu_options.port}`);
        mu_wss.on('connection',m_SaveSocket);
      });
    };

/// MODULE HELPER FUNCTIONS ///////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The socket has connected, so let's save this to our connection list
/*/ function m_SaveSocket( socket, req ) {
      if (DBG) console.log(PR,'Socket Connected');
      socket.on('message', ( json )=>{
        let obj = JSON.parse(json);
        var msg = new NetMessage(obj);
        console.log(PR,'got',json);
        /*/
        DO A BUNCH OF STUFF HERE!!!
        /*/
      });
    }

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNET;
