console.log(`included ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS NETWORK implements network controls and synchronization.
    It initializes a network connection on the CONNECT lifecycle.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG           = { connect:false, handle:false };

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
const ERR_BAD_UDATA = "An instance of 'client-datalink-class' is required";

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
var   m_options     = {};

/// API METHODS ///////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var NETWORK   = {};
var UDATA     = null; // assigned during NETWORK.Connect()

/// CONNECT ///////////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Establish connection to UNISYS server. This is called by client.js during
    NetworkInitialize(), which itself fires after the application has rendered
    completely.
/*/ NETWORK.Connect = function ( datalink, opt ) {
      // if multiple network connections occur, emit warning
      // warning: don't modify this unless you have a deep knowledge of how
      // the webapp system works or you might break something
      if (m_status>0) {
        let err = 'called twice...other views may be calling UNISYS outside of lifecycle';
        console.error(WARN,err);
        return;
      }
      m_status = M1_CONNECTING;

      // check and save parms
      if (datalink.constructor.name!=='UnisysDataLink') throw Error(ERR_BAD_UDATA);
      if (!UDATA) UDATA = datalink;
      m_options = opt || {};

      // create websocket
      // uses values that were embedded in index.ejs on load
      let wsURI = `ws://${NETSOCK.uaddr}:${NETSOCK.uport}`;
      NETSOCK.ws = new WebSocket(wsURI);
      if (DBG.connect) console.log(PR,'OPEN SOCKET TO',wsURI);

      // create listeners
      NETWORK.AddListener('open', function( event ) {
        if (DBG.connect) console.log(PR,'..OPEN',event.target.url);
        m_status = M2_CONNECTED;
        // message handling continues in 'message' handler
        // the first message is assumed to be registration data
      });
      NETWORK.AddListener('close', function( event ) {
        if (DBG.connect) console.log(PR,'..CLOSE',event.target.url);
        m_status = M0_INIT;
      });
      // handle socket errors
      NETWORK.AddListener('error', function( event ) {
        console.warn(WARN,'ERROR opening command socket',event);
        throw ("error with command socket");
      });
      // handle incoming messages
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
        if (DBG.connect) console.log(PR,'GlobalSetup got network socket');
        TEST.Pass('netMessageInit');
      }
      // (3) connect regular message handler
      NETWORK.AddListener('message', m_HandleMessage);
      m_status = M4_READY;
      // (4) network is initialized
      if (typeof m_options.success==='function') m_options.success();
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function m_HandleMessage( msgEvent ) {
      let pkt = new NetMessage(msgEvent.data);
      let msg = pkt.Message();
      if (pkt.IsOwnResponse()) {
          if (DBG.handle) console.log(PR,'completing transaction',msg);
          pkt.CompleteTransaction();
          return;
      }
      let data = pkt.Data();
      let type = pkt.Type();
      let dbgout = DBG.handle && !msg.startsWith('SRV_');
      /// otherwise, incoming invocation from network
      switch (type) {
        case 'state':
          if (dbgout) console.log(PR,'received state change',msg);
          break;
        case 'msig':
          if (dbgout) console.warn(PR,`ME_${NetMessage.SocketUADDR()} received msig '${msg}' from ${pkt.SourceAddress()}`,data);
          UDATA.LocalSignal(msg,data);
          pkt.ReturnTransaction();
          break;
        case 'msend':
          if (dbgout) console.warn(PR,`ME_${NetMessage.SocketUADDR()} received msend '${msg}' from ${pkt.SourceAddress()}`,data);
          UDATA.LocalSend(msg,data);
          pkt.ReturnTransaction();
          break;
        case 'mcall':
          if (dbgout) console.warn(PR,`ME_${NetMessage.SocketUADDR()} received mcall '${msg}' from ${pkt.SourceAddress()}`);
          UDATA.LocalCall(msg,data)
          .then((result)=>{
            if (dbgout) console.log(`ME_${NetMessage.SocketUADDR()} forwarded '${msg}', returning ${JSON.stringify(result)}`);
            // now return the packet
            pkt.SetData(result);
            pkt.ReturnTransaction();
          });
          break;
        default:
          throw Error('unknown packet type',type);
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
    NETWORK.ServerSocketInfo = function () {
      return NETSOCK;
    };
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    NETWORK.SocketUADDR = function () {
      return NetMessage.SocketUADDR();
    };

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NETWORK;
