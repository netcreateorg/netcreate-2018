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

const DBG = false;

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var   WSS               = require('ws').Server;
var   FSE               = require('fs-extra');
var   NetMessage        = require('../unisys/common-netmessage-class');
const LOGGER            = require('../unisys/server-logger');
var   DB                = require('../unisys/server-database');

/// CONSTANTS /////////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS           = require('../system/util/prompts');
const PR                = PROMPTS.Pad('SRV-NET');
const ERR               = PROMPTS.Pad('!!!');
const ERR_SS_EXISTS     = "socket server already created";
const ERR_NULL_SOCKET   = "require valid socket";
const DBG_SOCK_BADCLOSE = "closing socket is not in mu_sockets";
const ERR_INVALID_DEST  = "couldn't find socket with provided address";
const ERR_UNKNOWN_PKT   = "unrecognized netmessage packet type";
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
var m_socket_msgs_list = new Map(); // message map by uaddr


/// API MEHTHODS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var   UNET = {};
const SERVER_UADDR      = NetMessage.DefaultServerUADDR(); // is 'SVR_01'
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
/*/ Call remote handler, with possible return value
/*/ UNET.NetCall = async function ( mesgName, data ) {
      let pkt = new NetMessage(mesgName,data);
      let promises = m_PromiseRemoteHandlers(pkt);
      if (DBG) console.log(PR,`${pkt.Info()} NETCALL ${pkt.Message()} to ${promises.length} remotes`);
      /// MAGICAL ASYNC/AWAIT BLOCK ///////
      let resArray = await Promise.all(promises);
      /// END MAGICAL ASYNC/AWAIT BLOCK ///
      let resObj = Object.assign({},...resArray);
      return resObj;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Send data to remote handler, no expected return value
/*/ UNET.NetSend = function ( mesgName, data ) {
      let pkt = new NetMessage(mesgName,data);
      let promises = m_PromiseRemoteHandlers(pkt);
      // we don't care about waiting for the promise to complete
      if (DBG) console.log(PR,`${pkt.Info()} NETSEND ${pkt.Message()} to ${promises.length} remotes`);
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Send signal to remote handler, no expected return value
/*/ UNET.NetSignal = function ( mesgName, data ) {
      console.warn(PR,'NOTE: Use NetSend(), not NetSignal() since the server doesnt care.');
      UNET.NetSend(mesgName,data);
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ RegisterRemoteHandlers() accepts a RegistrationPacket with data = { messages }
    and writes to the two main maps for handling incoming messages
/*/ UNET.RegisterRemoteHandlers = function( pkt ) {
      if (pkt.Message()!=='SRV_REG_HANDLERS') throw Error('not a registration packet');
      let uaddr = pkt.SourceAddress();
      let { messages=[] } = pkt.Data();
      let regd=[];
      // save message list, for later when having to delete
      m_socket_msgs_list.set(uaddr,messages);
      // add uaddr for each message in the list
      // m_message_map[mesg] contains a Set
      messages.forEach((msg)=>{
        let entry = m_message_map.get(msg);
        if (!entry) {
          entry = new Set();
          m_message_map.set(msg,entry);
        }
        if (DBG) console.log(PR,`adding '${msg}' reference to ${uaddr}`);
        entry.add(uaddr);
        regd.push(msg);
      });
      return { registered: regd };
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
          case 'msig':
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
        // is this a returning packet that was forwarded?
        if (pkt.IsOwnResponse()) {
          // console.log(PR,`-- ${pkt.Message()} completing transaction ${pkt.seqlog.join(':')}`);
          pkt.CompleteTransaction();
          return;
        }
        // console.log(PR,`packet source incoming ${pkt.SourceAddress()}-${pkt.Message()}`);
        // (1) first check if this is a server handler
        let promises = m_PromiseServerHandlers(pkt);

        // (2) if it wasn't, then see if we have remote handlers defined
        if (promises.length===0) promises = m_PromiseRemoteHandlers(pkt);

        // (3) FAIL if no promises were returned, because there were no eligible
        // UADDR targets, possibly because the sources are not allowed to call itself
        // except in the case of the SIGNAL type
        if (promises.length===0) {
          console.log(PR,`info: '${pkt.Message()}' no eligible UADDR targets`);
          // return transaction to resolve callee
          pkt.SetData({NOP:`no handler found for '${pkt.Message()}'`});
          if (pkt.IsType('mcall')) pkt.ReturnTransaction(socket);
          return;
        }
        // got this far? let's skip all server messages for debugging purposes
        let notsrv = !pkt.Message().startsWith('SRV_');
        let json = JSON.stringify(pkt.Data());
        /* MAGICAL ASYNC/AWAIT BLOCK *****************************/
        if (DBG) console.log(PR,`${pkt.Info()} FORWARD ${pkt.Message()} to ${promises.length} remotes`);
        // if (notsrv) console.log(PR,`>> '${pkt.Message()}' queuing ${promises.length} Promises w/ data ${json}'`);
        let pktArray = await Promise.all(promises);
        // if (notsrv) console.log(PR,`<< '${pkt.Message()}' resolved`);
        if (DBG) console.log(PR,`${pkt.Info()} RETURN ${pkt.Message()} from ${promises.length} remotes`);
        /* END MAGICAL ASYNC/AWAIT BLOCK *************************/

        // (4) only mcall packets need to receive the data back return
        if (!pkt.IsType('mcall')) return;

        // (5) got this far? this is a call, so gather data and return it
        let data = pktArray.reduce((d,p) => {
          let pdata = (p instanceof NetMessage) ? p.Data() : p;
          let retval = Object.assign(d,pdata);
          // if (notsrv) console.log(PR,`'${pkt.Message()}' reduce`,JSON.stringify(retval));
          return retval;
        },{});
        // json = JSON.stringify(data);
        // if (notsrv) console.log(PR,`'${pkt.Message()}' returning transaction data ${json}`);
        pkt.SetData(data);
        pkt.ReturnTransaction(socket);
    } // m_HandleMessage()
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ m_PromiseServerHandlers() returns an array of promises, which should be used
     by Promises.all() inside an async/await function (m_SocketMessage above)
    Logic is similar to client-datalink-class.js Call()
/*/ function m_PromiseServerHandlers( pkt ) {
      let mesgName = pkt.Message();
      const handlers = m_server_handlers.get(mesgName);
      /// create promises for all registered handlers
      let promises = [];
      if (handlers) for (let handlerFunc of handlers) {
        // handlerFunc signature: (data,dataReturn) => {}
        let p = f_make_resolver_func(pkt,handlerFunc);
        promises.push(p);
      }
      /// return all queued promises
      return promises;

      /// inline utility function /////////////////////////////////////////////
      function f_make_resolver_func( srcPkt, handlerFunc ) {
        return new Promise(( resolve, reject ) => {
          let retval = handlerFunc(srcPkt);
          if (retval===undefined) throw `'${mesgName}' message handler MUST return object or error string`;
          if (typeof retval!=='object') reject(retval);
          else resolve(retval);
        });
      }
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ If a handler is registered elsewhere on UNET, then dispatch to them for
    eventual reflection back through server aggregation of data.
/*/ function m_PromiseRemoteHandlers( pkt ) {
      // debugging values
      let s_uaddr = pkt.SourceAddress();
      // logic values
      let promises = [];
      let mesgName = pkt.Message();
      let type = pkt.Type();
      // iterate!
      let handlers = m_message_map.get(mesgName);
      if (handlers) handlers.forEach((d_uaddr)=>{
        // don't send packet to originating UADDR because it already has handled it
        // locally
        switch (type) {
          case 'msig':
            promises.push(f_make_remote_resolver_func(pkt,d_uaddr));
            break;
          case 'msend':
          case 'mcall':
            if (s_uaddr!==d_uaddr) {
              promises.push(f_make_remote_resolver_func(pkt,d_uaddr));
            } else {
              // console.log(PR,`${type} '${pkt.Message()}' -NO ECHO- ${d_uaddr}`);
            }
            break;
          default:
            throw Error(`{ERR_UNKNOWN_PKT} ${type}`);
        }
      });
      /// return all queued promises
      return promises;
      /// f_make_remote_resolver_function returns the promise created by QueueTransaction()
      /// made on a new netmessage.
      function f_make_remote_resolver_func(srcPkt ,d_uaddr,opt={}) {
        let {verbose} = opt;
        // get the address of the destination implementor of MESSAGE
        let d_sock = mu_sockets.get(d_uaddr);
        if (d_sock===undefined) throw Error(ERR_INVALID_DEST+` ${d_uaddr}`);
        // Queue transaction from server
        // sends to destination socket d_sock
        // console.log(PR,`++ '${pkt.Message()}' FWD from ${pkt.SourceAddress()} to ${d_uaddr}`);
        let newpkt = new NetMessage(srcPkt);
        newpkt.MakeNewID();
        newpkt.CopySourceAddress(srcPkt);
        if (verbose) {
          console.log('make_resolver_func:',`PKT: ${srcPkt.Type()} '${srcPkt.Message()}' from ${srcPkt.Info()} to d_uaddr:${d_uaddr} dispatch to d_sock.UADDR:${d_sock.UADDR}`);
        }
        return newpkt.QueueTransaction(d_sock);
      }
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
      if (DBG) console.log(PR,`socket ADD ${socket.UADDR} to network`);
      LOGGER.Write(socket.UADDR,'joined network');
      if (DBG) m_ListSockets(`add ${sid}`);
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ function m_GetNewUADDR( prefix='UADDR' ) {
      ++mu_sid_counter;
      let cstr = mu_sid_counter.toString(10).padStart(2,'0');
      return `${prefix}_${cstr}`;
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ function m_SocketDelete( socket ) {
      let uaddr = socket.UADDR;
      if (!mu_sockets.has(uaddr)) throw Error(DBG_SOCK_BADCLOSE);
      if (DBG) console.log(PR,`socket DEL ${uaddr} from network`);
      LOGGER.Write(socket.UADDR,'left network');
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
