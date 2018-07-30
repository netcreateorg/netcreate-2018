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
const DBG_SOCK_BADCLOSE = "closing socket is not in mu_sockets";
const DEFAULT_NET_PORT  = 2929;
const DEFAULT_NET_ADDR  = '127.0.0.1';
const SERVER_UADDR      = m_GetNewUADDR('SVADDR');

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var mu_wss;                       // websocket server
var mu_options;                   // websocket options
var mu_sockets     = new Map();   // sockets mapped by socket id
var mu_sid_counter = 0;           // for generating  unique socket ids

/// API MEHTHODS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var UNET = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Initialize() is called by brunch-server.js to define the default UNISYS
    network values, so it can embed them in the index.ejs file for webapps
/*/ UNET.InitializeNetwork = ( options ) => {
      options = options || {};
      options.port = options.port || DEFAULT_NET_PORT;
      options.uaddr = options.uaddr || SERVER_UADDR;
      if (mu_wss !== undefined) throw Error(ERR_SS_EXISTS);
      NetMessage.GlobalSetUADDR(options.uaddr);
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
      if (DBG) console.log(PR,'socket connected');

      m_SocketAdd(socket);
      m_SocketClientAck(socket);
      // subscribe socket to handlers
      socket.on('message', ( json ) => {
        m_SocketMessage(socket,json);
      });
      socket.on('close', () => {
        m_SocketDelete(socket);
      });
    }

    function m_SocketClientAck( socket ) {
      let data = {
        HELLO : 'Welcome to UNISYS',
        UADDR : socket.UADDR
      }
      socket.send(JSON.stringify(data));
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ function m_SocketMessage( socket, json ) {
        let pkt = new NetMessage(json);
        if (DBG) console.log(PR,'recv',pkt.Message(),'data',pkt.Data());
        // Dispatch packet
        // m_SocketMessage()
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
/*/ function m_SocketAdd( socket ) {
      // save socket by socket_id
      let sid = m_GetNewUADDR();
      // store additional props in socket
      socket.UADDR = sid;
      // save socket
      mu_sockets.set(sid,socket);
      if (DBG) console.log(PR,`saving ${socket.UADDR} to mu_sockets`);
      if (DBG) m_ListSockets();
    }
    function m_GetNewUADDR( prefix='UADDR' ) {
      let cstr = (mu_sid_counter++).toString().padStart(4,'0');
      return `${prefix}_${cstr}`;
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ function m_SocketDelete( socket ) {
      if (!mu_sockets.has(socket.UADDR)) throw Error(DBG_SOCK_BADCLOSE);
      if (DBG) console.log(PR,`deleting ${socket.UADDR} from mu_sockets`);
      mu_sockets.delete(socket.UADDR);
      if (DBG) m_ListSockets();
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ function m_ListSockets() {
      console.log(PR,'RegisteredSocketIds');
      // let's use iterators! for..of
      let values = mu_sockets.values();
      for (let socket of values) {
       console.log(PR,'>',socket.UADDR);
      }
    }


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNET;
