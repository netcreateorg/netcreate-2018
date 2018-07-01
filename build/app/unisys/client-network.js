/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS NETWORK implements network controls and synchronization.
    It initializes a network connection on the CONNECT lifecycle.

    2045
    we need to provide a connection method to connect to server
    where do we get the port options from?
    we want to read them from a javascript thingy.
    so we want to inject it on the server side.
    solution is to add template engine to expressjs
    2330
    can we now connect to the socket?
    2345
    dispatcher function
    cmd_port, cmd_uri, status, local_ip, server_ip
    status:
      init, gotip, error, linked, ready, closed
    cmd_socket handlers
      onerror
      onmessage
      onopen
    cmd_socket.new WebSocket(NDEF.Set('cmd_uri'))
    cmd_socket also stores socket-related info like:
      U_ADDR server unisys string (special server sockid)
      U_GRP group (same as server special sockid)
      U_STAT status

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG   = true;

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS     = require('system/util/prompts');
const PR          = PROMPTS.Pad('NETWORK');
const WARN        = PROMPTS.Pad('!!!');

/// GLOBAL NETWORK INFO (INJECTED ON INDEX) ///////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var NETINFO   = window.NC_UNISYS;
var NETSOCK   = NETINFO.socket;
var NETCLIENT = NETINFO.client;
var NETSERVER = NETINFO.server;

/// API METHODS ///////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var NETWORK   = {};
var called = false;
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Establish connection to UNISYS sever.
/*/ NETWORK.Connect = function ( opt ) {
      if (called) {
        let err = 'called twice...other views may be calling UNISYS outside of lifecycle';
        console.error(WARN,err);
        return;
      }
      called = true;
      // double-check that required parameters are set
      // currently there are no options
      opt = opt || {};
      // create websocket
      let wsURI = `ws://${NETSOCK.uaddr}:${NETSOCK.uport}`;
      NETSOCK.ws = new WebSocket(wsURI);
      if (DBG) console.log(PR,'OPEN SOCKET TO',wsURI);
      // handle open connection
      NETSOCK.ws.addEventListener('open', function( event ) {
        let out = '';
        switch (event.currentTarget.readyState) {
          case 0: out += 'CONNECTING TO';
            break;
          case 1: out += 'CONNECTED';
            break;
          case 2: out += 'CLOSING';
            break;
          case 3: out += 'CLOSED';
            break;
          default: out += '<UNKNOWN>'
        }
        if (DBG) console.log(PR,'SOCKET',out,event.target.url);
        /*/
        send registration message
        /*/
        if (typeof (opt.success)==='function') opt.success();
      });
      // handle errors
      NETSOCK.ws.addEventListener('error', function( event ) {
        console.warn(WARN,'ERROR opening command socket',event);
        throw ("error with command socket");
      });
      // handle messages
      NETSOCK.ws.addEventListener('message', function( event ) {
        if (DBG) console.log(PR,'MESSAGE',event);
      });
    }; // Connect()

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Force close of connection, for example if UNISYS.AppReady() fails
/*/ NETWORK.Close = function ( code, reason ) {
      code = code || 1000;
      reason = reason || 'unisys forced close';
      NETINFO.socket.ws.close(code,reason);
  };
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    NETWORK.LocalInfo = function () {
      return NETINFO.client;
    };
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    NETWORK.ServerInfo = function () {
      return NETINFO.server;
    };
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    NETWORK.SocketInfo = function () {
      return NETINFO.socket;
    };


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NETWORK;
