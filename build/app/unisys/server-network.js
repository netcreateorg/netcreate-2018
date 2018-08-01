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
const PR                = PROMPTS.Pad('SRV-NET');
const ERR               = PROMPTS.Pad('!!!');
const ERR_SS_EXISTS     = "socket server already created";
const ERR_NULL_SOCKET   = "require valid socket";
const DBG_SOCK_BADCLOSE = "closing socket is not in mu_sockets";
const DEFAULT_NET_PORT  = 2929;
const DEFAULT_NET_ADDR  = '127.0.0.1';

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// sockets
var mu_wss;                         // websocket server
var mu_options;                     // websocket options
var mu_sockets = new Map();         // sockets mapped by socket id
var mu_sid_counter = 0;             // for generating  unique socket ids
// storage
var m_server_handlers = new Map();  // message map storing sets of functions
var m_message_map     = new Map();  // message map storing other handlers
var m_socket_msgs_list = new Map();  // message map by uaddr


/// API MEHTHODS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var   UNET = {};
const SERVER_UADDR      = m_GetNewUADDR('SVR'); // special server UADDR prefix
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Initialize() is called by brunch-server.js to define the default UNISYS
    network values, so it can embed them in the index.ejs file for webapps
/*/ UNET.InitializeNetwork = ( options ) => {
      options = options || {};
      options.port = options.port || DEFAULT_NET_PORT;
      options.uaddr = options.uaddr || SERVER_UADDR;
      if (mu_wss !== undefined) throw Error(ERR_SS_EXISTS);
      NetMessage.GlobalSetup({ uaddr: options.uaddr });
      mu_options = options;
      return mu_options;
    }; // end InitializeNetwork()
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
    }; // end CreateNetwork()
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ HandleMessage() registers a server-implemented handler.
    The handlerFunc receives a NetMessage and should return one as well.
    It can also return a non-object if there is an error.
    Logic is similar to client-datalink-class.js equivalent
/*/ UNET.HandleMessage = function( mesgName, handlerFunc ) {
      if (typeof handlerFunc !== 'function') {
        throw "arg2 must be a function";
      }
      let handlers = m_server_handlers.get(mesgName);
      if (!handlers) {
        handlers = new Set();
        m_server_handlers.set( mesgName, handlers );
      }
      handlers.add(handlerFunc);
      return this;
    }; // end HandleMessage()
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UnhandleMessage() de-registers a server-implemented handler, in case you
    ever want to do that.
    Logic is similar to client-datalink-class.js equivalent
/*/ UNET.UnhandleMessage = function( mesgName, handlerFunc ) {
      if (!arguments.length) {
        m_server_handlers.clear();
      } else if (arguments.length===1) {
        m_server_handlers.delete(mesgName);
      } else {
        const handlers = m_server_handlers.get(mesgName);
        if (handlers) {
          handlers.delete(handlerFunc);
        }
      }
      return this;
    }; // end UnhandleMessage()
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ RegisterRemoteHandlers() accepts a RegistrationPacket with data = { all }
    and writes to the two main maps for handling incoming messages
/*/ UNET.RegisterRemoteHandlers = function( pkt ) {
      if (pkt.Message()!=='SRV_REG_HANDLERS') throw Error('not a registration packet');
      let uaddr = pkt.SourceAddress();
      let { all=[] } = pkt.Data();
      // save message list, for later when having to delete
      m_socket_msgs_list.set(uaddr,all);
      // add uaddr for each message in the list
      // m_message_map[mesg] contains a Set
      all.forEach((msg)=>{
        let entry = m_message_map.get(msg);
        if (!entry) {
          entry = new Set();
          m_message_map.set(msg,entry);
        }
        console.log(PR,`adding '${msg}' reference to ${uaddr}`);
        entry.add(uaddr);
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
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ When a new socket connection happens, send back the special registration
    packet (WIP)
/*/ function m_SocketClientAck( socket ) {
      let data = {
        HELLO : 'Welcome to UNISYS',
        UADDR : socket.UADDR
      }
      socket.send(JSON.stringify(data));
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Handle all incoming socket messages asynchronously through Promises
/*/ function m_SocketMessage( socket, json ) {
        let pkt = new NetMessage(json);
        // figure out what to do
        switch (pkt.Type()) {
          case 'state':
            m_HandleState(socket,pkt);
            break;
          case 'msend':
          case 'mcall':
            m_HandleMessage(socket,pkt);
            break;
          default:
            throw new Error(`${PR} unknown packet type '${pkt.Type()}'`);
        } // end switch
    } // end m_SocketMessage()
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ handle global state and rebroadcast
/*/ function m_HandleState( socket, pkt ) {
      //
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ handle messages that are a Send(), Signal(), or Call()
/*/ async function m_HandleMessage( socket, pkt ) {
        // first check if this is a server handler
        let promises = m_CheckServerHandlers(pkt);
        // if it wasn't, then see if we have remote handlers defined
        if (promises.length===0) promises = m_CheckRemoteHandlers(pkt);
        if (promises.length===0) {
          console.log(PR,`'${pkt.Message()}' no valid UADDR targets`);
          return;
        }
        let dbgout = !pkt.Message().startsWith('SRV_');
        let json = JSON.stringify(pkt.Data());
        if (dbgout) console.log(PR,`'${pkt.Message()}' queuing ${promises.length} Promises w/ data ${json}'`);
        //
        // ASYNC/AWAIT BLOCK
        let pktArray = await Promise.all(promises);
        // END ASYNC/AWAIT BLOCK
        //
        if (dbgout) console.log(PR,`'${pkt.Message()}' resolved`);
        // check packet type to see if return transaction is needed
        if (!pkt.IsType('mcall')) return;
        // this is a call, so gather data and return it
        let data = pktArray.reduce((d,p) => {
          let pdata = (p instanceof NetMessage) ? p.Data() : p;
          let retval = Object.assign(d,pdata);
          if (dbgout) console.log(PR,`'${pkt.Message()}' reduce`,JSON.stringify(retval));
          return retval;
        },{});
        json = JSON.stringify(data);
        if (dbgout) console.log(PR,`'${pkt.Message()}' returning transaction data ${json}`);
        pkt.SetData(data);
        pkt.ReturnTransaction(socket);
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ m_CheckServerHandlers() returns an array of promises, which should be used
     by Promises.all() inside an async/await function (m_SocketMessage above)
    Logic is similar to client-datalink-class.js Call()
/*/ function m_CheckServerHandlers( pkt ) {
      let mesgName = pkt.Message();
      const handlers = m_server_handlers.get(mesgName);
      /// create promises for all registered handlers
      let promises = [];
      if (handlers) for (let handlerFunc of handlers) {
        // handlerFunc signature: (data,dataReturn) => {}
        let p = f_make_resolver_func(handlerFunc);
        promises.push(p);
      }
      /// return all queued promises
      return promises;

      /// inline utility function /////////////////////////////////////////////
      function f_make_resolver_func( handlerFunc ) {
        return new Promise(( resolve, reject ) => {
          let retval = handlerFunc(pkt);
          if (retval===undefined) throw `[${mesgName} message handler MUST return object or error string`;
          if (typeof retval!=='object') reject(retval);
          else resolve(retval);
        });
      }
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ If a handler is registered elsewhere on UNET, then dispatch to them for
    eventual reflection back through server aggregation of data.
/*/ function m_CheckRemoteHandlers( pkt ) {
      let promises = [];
      let mesgName = pkt.Message();
      // m_message_map contains Sets
      let handlers = m_message_map.get(mesgName);
      let src_uaddr = pkt.SourceAddress();
      let type = pkt.Type();
      if (handlers) handlers.forEach((uaddr)=>{
        // don't send packet to originating UADDR because it already has handled it
        // locally
        if (src_uaddr!==uaddr) {
          let p = f_make_remote_resolver_func(uaddr);
          promises.push(p);
        }
      });
      /// return all queued promises
      return promises;
      /// inline utility
      function f_make_remote_resolver_func() {
        return Promise.resolve(1);
      }
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
      if (DBG) m_ListSockets(`add ${sid}`);
    }
    function m_GetNewUADDR( prefix='UADDR' ) {
      ++mu_sid_counter;
      let cstr = mu_sid_counter.toString(10).padStart(2,'0');
      return `${prefix}_${cstr}`;
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ function m_SocketDelete( socket ) {
      let uaddr = socket.UADDR;
      if (!mu_sockets.has(uaddr)) throw Error(DBG_SOCK_BADCLOSE);
      if (DBG) console.log(PR,`deleting ${uaddr} from mu_sockets`);
      mu_sockets.delete(uaddr);
      // delete socket reference from previously registered handlers
      let rmesgs = m_socket_msgs_list.get(uaddr);
      if (Array.isArray(rmesgs)) {
        rmesgs.forEach( (msg) => {
          let handlers = m_message_map.get(msg);
          if (DBG) console.log(PR,`deleting '${msg}' reference to ${uaddr}`);
          if (handlers) handlers.delete(uaddr);
        });
      }
      if (DBG) m_ListSockets(`del ${socket.UADDR}`);
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ function m_ListSockets( change ) {
      console.log(PR,'SocketList change:',change);
      // let's use iterators! for..of
      let values = mu_sockets.values();
      let count = 1;
      for (let socket of values) {
       console.log(PR,`${count} - ${socket.UADDR}`);
      }
    }


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNET;
