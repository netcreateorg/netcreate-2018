/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS NETWORK implements network controls and synchronization.
    It initializes a network connection on the CONNECT lifecycle.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG           = true;

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SETTINGS      = require('settings');
const TEST          = require('test');
const NetMessage    = require('unisys/common-netmessage-class');
const PROMPTS       = require('system/util/prompts');
const PR            = PROMPTS.Pad('NETWORK');
const WARN          = PROMPTS.Pad('!!!');
const ERR_NM_REQ    = "arg1 must be NetMessage instance";
const ERR_NO_SOCKET = "Network socket has not been established yet";

/// GLOBAL NETWORK INFO (INJECTED ON INDEX) ///////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var NETSOCK         = SETTINGS.EJSProp('socket');
var NETCLIENT       = SETTINGS.EJSProp('client');
var NETSERVER       = SETTINGS.EJSProp('server');

/// NETWORK ID VALUES /////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const M0_INIT       = 0;
const M1_CONNECTING = 1;
const M2_CONNECTED  = 2;
const M3_REGISTERED = 3;
const M4_READY      = 4;
var   m_status      = M0_INIT;

/// API METHODS ///////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var NETWORK   = {};

/// CONNECT ///////////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Establish connection to UNISYS server. This is called by client.js during
    NetworkInitialize(), which itself fires after the application has rendered
    completely.
/*/ NETWORK.Connect = function ( opt ) {
      /** warn **/
      // if multiple network connections occur, emit warning
      // warning: don't modify this unless you have a deep knowledge of how
      // the webapp system works or you might break something
      if (m_status>0) {
        let err = 'called twice...other views may be calling UNISYS outside of lifecycle';
        console.error(WARN,err);
        return;
      }
      m_status = M1_CONNECTING;

      /** check parms **/
      opt = opt || {};

      /** create websocket **/
      // uses values that were embedded in index.ejs on load
      let wsURI = `ws://${NETSOCK.uaddr}:${NETSOCK.uport}`;
      NETSOCK.ws = new WebSocket(wsURI);
      if (DBG) console.log(PR,'OPEN SOCKET TO',wsURI);

      /** create listeners **/
      NETWORK.AddListener('open', function( event ) {
        if (DBG) console.log(PR,'..OPEN',event.target.url);
        m_status = M2_CONNECTED;
        // message handling continues in 'message' handler
        // the first message is assumed to be registration data
      });
      NETWORK.AddListener('close', function( event ) {
        if (DBG) console.log(PR,'..CLOSE',event.target.url);
        m_status = M0_INIT;
      });
      /** handle socket errors **/
      NETWORK.AddListener('error', function( event ) {
        console.warn(WARN,'ERROR opening command socket',event);
        throw ("error with command socket");
      });
      /** handle incoming messages **/
      NETWORK.AddListener('message', m_HandleRegistrationMessage);
    }; // Connect()
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ After 'open' event, we expect the first message on the socket to contain
    network session-related messages
/*/ function m_HandleRegistrationMessage( msgEvent ) {
      let regData = JSON.parse(msgEvent.data);
      let { HELLO, UADDR } = regData;
      // (1) after receiving the initial message, switch over to regular
      // message handler
      NETWORK.RemoveListener('message', m_HandleRegistrationMessage);
      m_status = M3_REGISTERED;
      // (2) initialize global settings for netmessage
      NetMessage.GlobalSetup({ uaddr : UADDR, netsocket : NETSOCK.ws});
      if (TEST('net')) {
        console.log(PR,'GlobalSetup got network socket');
        TEST.Pass('netMessageInit');
      }
      // (3) connect regular message handler
      NETWORK.AddListener('message', m_HandleMessage);
      m_status = M4_READY;
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function m_HandleMessage( msgEvent ) {
      let pkt = new NetMessage(msgEvent.data);
      if (DBG) console.log(PR,'received packet w/seqnum',pkt.seqnum,JSON.stringify(pkt.seqlog));
      if (pkt.IsTransaction()) {
        console.log(PR,'receiving transaction',pkt.Data());
        pkt.CompleteTransaction();
      }
    }

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Send a packet on socket connection, assuming it is valid
/*/ NETWORK.Send = function ( pkt ) {
      if (!(pkt instanceof NetMessage)) throw Error(ERR_NM_REQ);
      if (NETSOCK.ws.readyState===1) {
        let json = pkt.JSON();
        if (DBG) console.log('SENDING',pkt.Message(),pkt.Data(),pkt.SeqNum());
        NETSOCK.ws.send(json);
      } else {
        console.log('Socket not ReadyState 1, is',NETSOCK.ws.readyState);
      }
    };
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Send a packet on socket connection, return Promise
/*/ NETWORK.Call = function ( pkt ) {
      if (!(pkt instanceof NetMessage)) throw Error(ERR_NM_REQ);
      if (NETSOCK.ws.readyState===1) {
        let json = pkt.JSON();
        if (DBG) console.log('CALLING',pkt.Message(),json);
        NETSOCK.ws.send(json);
      } else {
        console.log('Socket not ReadyState 1, is',NETSOCK.ws.readyState);
      }
    };
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Force close of connection, for example if UNISYS.AppReady() fails
/*/ NETWORK.Close = function ( code, reason ) {
      code = code || 1000;
      reason = reason || 'unisys forced close';
      NETSOCK.ws.close(code,reason);
  };
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    NETWORK.AddListener = function ( event, handlerFunction ) {
      if (NETSOCK.ws instanceof WebSocket) {
        NETSOCK.ws.addEventListener(event, handlerFunction);
      } else {
        throw Error(ERR_NO_SOCKET);
      }
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    NETWORK.RemoveListener = function ( event, handlerFunction ) {
      if (NETSOCK.ws instanceof WebSocket) {
        NETSOCK.ws.removeEventListener(event, handlerFunction);
      } else {
        throw Error(ERR_NO_SOCKET);
      }
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    NETWORK.LocalInfo = function () {
      return NETCLIENT;
    };
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    NETWORK.ServerInfo = function () {
      return NETSERVER;
    };
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    NETWORK.SocketInfo = function () {
      return NETSOCK;
    };

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NETWORK;
