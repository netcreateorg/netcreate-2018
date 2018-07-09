/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WebSocketServer and Network Management for UNISYS
  WORK IN PROGRESS

  [x] - socket listener
  [ ] - socket dictionary
  [ ] - socket metadata for UNISYS defined, stored in sockets
  [ ] - message dictionary
  [ ] - message dispatching
  [ ] - system message declaration

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = true;

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var   WSS               = require('ws').Server;
var   FSE               = require('fs-extra');
var   NetMessage        = require('../unisys/common-netmessage-class');

/// CONSTANTS /////////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS           = require('../system/util/prompts');
const PR                = PROMPTS.Pad('UNET');
const ERR               = PROMPTS.Pad('!!!');
const ERR_SS_EXISTS     = "socket server already created";
const ERR_NULL_SOCKET   = "require valid socket";
const DEFAULT_UNET_PORT = 2929;
const DEFAULT_UNET_ADDR = '127.0.0.1';

/// API CREATE NETWORK ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var mu_wss; // websocket server
var mu_options; // websocket options
var UNET = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Initialize() is called by brunch-server.js to define the default UNISYS
    network values, so it can embed them in the index.ejs file for webapps
/*/ UNET.InitializeNetwork = ( options ) => {
      options = options || {};
      options.port = options.port || DEFAULT_UNET_PORT;
      if (mu_wss !== undefined) throw Error(ERR_SS_EXISTS);
      mu_options = options;
      return mu_options;
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	CreateNetwork() is called by brunch-server after the Express webserver
    has started listening, initializing the UNISYS NETWORK socket listener.
/*/	UNET.StartNetwork = () => {
      // create listener.
      if (DBG) console.log(PR,`UNISYS NETWORK initialized on port ${mu_options.port}`);
      mu_wss = new WSS(mu_options);
      mu_wss.on('listening',function() {
        if (DBG) console.log(PR,`listening on port ${mu_options.port}`);
        mu_wss.on('connection',m_NewSocketConnected);
      });
    };

/// MODULE HELPER FUNCTIONS ///////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The socket has connected, so let's save this to our connection list
/*/ function m_NewSocketConnected( socket ) {
      if (DBG) console.log(PR,'Socket Connected');
      // subscribe socket to handlers
      /*** temporary code ***/
      socket.on('message', (json) => {
        let pkt = new NetMessage(json);
        // TEMPORARY TESTING
        console.log(PR,'recv',pkt.Data(),pkt.SeqNum());
        pkt.Data().serverSays = "hi";
        m_SendMessage(socket,pkt);
      });
      socket.on('close', () => {
        m_SocketClose(socket);
      });
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ function m_SendMessage( socket, pkt ) {
      if (DBG) console.log(PR,'send',pkt.Data(),pkt.SeqNum());
      if (socket) socket.send(pkt.JSON());
      else throw Error(ERR_NULL_SOCKET);
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ function m_SocketClose() {
      if (DBG) console.log(PR,'Socket Closing');
    }



/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNET;
