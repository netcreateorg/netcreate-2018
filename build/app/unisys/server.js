/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UNISYS server loader

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNET      = require('./server-network');
const UDB       = require('./server-database');
const LOGGER    = require('./server-logger');

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
        let data = UNET.RegisterRemoteHandlers(pkt);
        // or return a new data object that will replace pkt.data
        return data;
      });

      UNET.HandleMessage('SRV_DBGET',function(pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        return UDB.PKT_GetDatabase(pkt);
      });

      UNET.HandleMessage('SRV_DBSET',function(pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        return UDB.PKT_SetDatabase(pkt);
      });

      UNET.HandleMessage('SRV_DBUPDATE',function(pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        let data = UDB.PKT_Update(pkt);
        // add src attribute for client SOURCE_UPDATE to know
        // this is a remote update
        data.src = 'remote';
        // fire update messages
        if (data.node) UNET.NetSend('SOURCE_UPDATE',data);
        if (data.edge) UNET.NetSend('EDGE_UPDATE', data);
        if (data.nodeID!==undefined) UNET.NetSend('NODE_DELETE', data);
        if (data.edgeID!==undefined) UNET.NetSend('EDGE_DELETE',data);
        // return SRV_DBUPDATE value (required)
        return { OK:true, info:'SRC_DBUPDATE' };
      });

      UNET.HandleMessage('SRV_DBGETNODEID',function(pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        return UDB.PKT_GetNewNodeID(pkt);
      });

      UNET.HandleMessage('SRV_DBGETEDGEID',function(pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        return UDB.PKT_GetNewEdgeID(pkt);
      });

      UNET.HandleMessage('SRV_LOG_EVENT',function(pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        return LOGGER.PKT_LogEvent(pkt);
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
