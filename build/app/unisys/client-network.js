/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS NETWORK implements network controls and synchronization.
    It initializes a network connection on the CONNECT lifecycle.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG         = true;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CLASSES ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// INITIALIZE MAIN MODULE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var   NETWORK = {};

/// API METHODS ///////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Establish connection to UNISYS sever.
/*/ NETWORK.Connect = function ( opt ) {
      // double-check that required parameters are set
      opt = opt || {};
      if (typeof opt.cb_connect!=='function') {
        opt.cb_connect = function () {
          console.warn('no callback defined');
        };
      }
      if (typeof opt.dispatcher!=='function') {
        opt.dispatcher = function () {
          console.warn('no message dispatcher defined');
        };
      }

      // save dispatcher function for incoming messages
      // handled by UNISYS
      f_Dispatcher 	= opt.dispatcher;

      // save default connection data
      NDEF.Set('cmd_port',opt.cmd_port || NDEF.DEFAULT.CMD_PORT);
      NDEF.Set('cmd_uri','ws://'+document.domain+':'+NDEF.Set('cmd_port'));

      // INITIATE REQUEST FOR IP ADDRESS
      var xmlHttp = new XMLHttpRequest();
      NDEF.Set('status', NDEF.CTYPE.INIT);
      xmlHttp.open( "GET", XSETTINGS.WebAddress('ip'), true );
      xmlHttp.send( null );	// response in onreadystatechange

      // RESPONSE HANDLER FOR 'GET' IP ADDRESS FROM OUR WEBSERVICE
      xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
          // save ip address in webservice response
          var ip4 = JSON.parse(xmlHttp.responseText);
          NDEF.Set('local_ip', ip4.local);
          console.log(PP,"My IP4 is", NDEF.Get('local_ip'));
          var server = ip4.server;
          NDEF.Set('server_ip', ip4.server);

          // next, connect to socket
          // the command socket receives server commands and should
          // be dispatched to the appropriate handler
          NDEF.Set('cmd_socket', new WebSocket(NDEF.Set('cmd_uri')));
          NDEF.Set('status', NDEF.CTYPE.GOTIP);

          // if there is an error, it is probably critical
          NDEF.Get('cmd_socket').onerror = function ( event ) {
            console.warn('!!!','ERROR opening command socket',event);
            NDEF.Set('status', NDEF.CTYPE.ERROR);
            throw ("error with command socket");
          };

          // DEFINE EVENT HANDLER /////////////////////////////////////////
          // when socket is open, then the connection is officially
          // established
          NDEF.Get('cmd_socket').onopen = function ( event ) {
            if (DBGOUT) console.log(PP,'CONNECTED',event.target.url);
            // save socket url
            NDEF.Set('cmd_socket_url', event.target.url);
            NDEF.Set('status', NDEF.CTYPE.LINKED);
            // adorn socket with address of connecting server
            var cs = NDEF.Get('cmd_socket');
            cs.U_ADDR 	= NDEF.ADR_TYPE.SERVER;
            cs.U_GRP 	= NDEF.ADR_TYPE.SERVER;
            cs.U_STAT 	= NDEF.Get('status');
            // send REGISTER message
            var regpkt = new NetMessage('_REGISTER',{
              app: 	m_app_name,
              ip: 	NDEF.Get('local_ip')
            });
            NETWORK.Send( regpkt );
            // SERVER responds to a REGISTER message by reflecting
            // it back to the sender
          };

        // DEFINE EVENT HANDLER /////////////////////////////////////////
        // message handler receives all messages from UNISYS that should
        // be acted upon!
        NDEF.Get('cmd_socket').onmessage = function ( event ) {
          // cast JSON into NetMessage object
          var pkt = new NetMessage( JSON.parse(event.data) );

          // normal case: process messages through NETWORK.Receive()
          if (NDEF.Get('status') == NDEF.CTYPE.READY) {
            NETWORK.Receive( pkt );
            return;
          }
          // special case: still connecting to unisys, which is
          // finalized by receipt of REGISTER message
          if (NDEF.Get('status') == NDEF.CTYPE.LINKED) {
            if (pkt.Is( MSG.UNI.RegisterConnection )) {
              // save any information sent by server
              NETWORK.SaveRegistration( pkt );
              // let LOAD_ASSETS complete
              opt.cb_connect( pkt );
              NDEF.Set('status', NDEF.CTYPE.READY);
              // we are official connected to UNISYS!
              document.title += ' ' + NDEF.Get('local_ip')+':'+NDEF.Get('u_addr')+' -> Server '+server;
              m_network_ready = true;
            } else {
              console.error('OOPS! Received non-registration packet');
            }
            return;
          }
          // if get here, there's a bug in the network code
          console.error('OOPS! Net Status is',NDEF.Get('status'));
        };

        // DEFINE EVENT HANDLER /////////////////////////////////////////
        // if the connection closes, handled it
        NDEF.Get('cmd_socket').onclose = function ( event ) {
                 if (DBGOUT) console.log('>>>','CLOSED',event.target.url);
          NDEF.Set('status', NDEF.CTYPE.CLOSED);
        };
      } // if xmlHttp...
    }; // onreadystatechange
  }; // Connect()

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Force close of connection, for example if UNISYS.AppReady() fails
/*/ NETWORK.Close = function ( code, reason ) {
    code = code || 1000;
    reason = reason || 'unisys forced close';
    NDEF.Get('cmd_socket').close( code, reason );
  };


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NETWORK;
