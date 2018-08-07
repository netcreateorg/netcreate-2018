/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UNISYS server loader

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNET      = require('./server-network');
const UDB       = require('./server-database');

/// CONSTANTS /////////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS    = require('../system/util/prompts');
const PR         = PROMPTS.Pad('SRV');

/// MODULE VARS ///////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


/// API CREATE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var UNISYS = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Initialize() is called by brunch-server.js to define the default UNISYS
    network values, so it can embed them in the index.ejs file for webapps
    override = { port }
/*/ UNISYS.InitializeNetwork = ( override ) => {
      UDB.InitializeDatabase(override);
      return UNET.InitializeNetwork(override);
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ RegisterHandlers() is called before network is started, so they're
    ready to run. These are server-implemented reserved messages.
/*/ UNISYS.RegisterHandlers = () => {

      UNET.HandleMessage('SRV_REFLECT',function(pkt) {
        pkt.Data().serverSays='REFLECTING';
        pkt.Data().stack.push('SRV_01');
        if (DBG) console.log(PR,sprint_message(pkt));
        // return the original packet
        return pkt;
      });

      UNET.HandleMessage('SRV_REG_HANDLERS',function(pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        // now need to store the handlers somehow.
        UNET.RegisterRemoteHandlers(pkt);
        // or return a new data object that will replace pkt.data
        return { info:'registered handlers' };
      });

      UNET.HandleMessage('SRV_DATABASE_INIT',function(pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        UDB.PKT_SetDatabase(pkt);
        return { info:'Database Set' };
      });

      // utility function //
      function sprint_message(pkt) {
        return `got '${pkt.Message()}' data=${JSON.stringify(pkt.Data())}`;
      }
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	StartNetwork() is called by brunch-server after the Express webserver
/*/	UNISYS.StartNetwork = () => {
      UNET.StartNetwork();
    };


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNISYS;
