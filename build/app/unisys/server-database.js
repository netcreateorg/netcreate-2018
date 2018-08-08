/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

DATABASE SERVER

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = true;

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const Loki              = require('lokijs');
const NetMessage        = require('../unisys/common-netmessage-class');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const PROMPTS           = require('../system/util/prompts');
const PR                = PROMPTS.Pad('SRV-DB');
const ERR               = PROMPTS.Pad('!!!');
const DB_FILE           = './runtime/netcreate.json';

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
var   m_options;    // saved initialization options
var   m_db;         // loki database
var   NODES;        // loki "nodes" collection
var   EDGES;        // loki "edges" collection

/// API METHODS ///////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
var DB = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Initialize the database
/*/ DB.InitializeDatabase = function( options={} ) {
      console.log(PR,`InitializeDatabase`);
      let ropt = {
        autoload         : true,
        autoloadCallback : f_DatabaseInitialize,
        autosave         : true,
        autosaveCallback : f_AutosaveStatus,
        autosaveInterval : 4000  // save every four seconds
      };
      ropt = Object.assign(ropt,options);
      m_db = new Loki(DB_FILE,ropt);
      m_options = ropt;
      console.log(PR,`Initialized LokiJS Database '${DB_FILE}'`);
      //
      function f_DatabaseInitialize() {
        // on the first load of (non-existent database), we will have no
        // collections so we can detect the absence of our collections and
        // add (and configure) them now.
        NODES = m_db.getCollection("nodes");
        if (NODES===null) NODES = m_db.addCollection("nodes");
        EDGES = m_db.getCollection("edges");
        if (EDGES===null) EDGES = m_db.addCollection("edges");
      }
      //
      function f_AutosaveStatus( ) {
        let nodeCount = NODES.count();
        let edgeCount = EDGES.count();
        console.log(PR,`autosaving ${nodeCount} nodes and ${edgeCount} edges...`);
      }
    }; // InitializeDatabase()
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: load database
/*/ DB.PKT_GetDatabase = function ( pkt ) {
      console.log(PR,`PKT_GetDatabase`);
      let nodes = NODES.chain().data({removeMeta:true});
      let edges = EDGES.chain().data({removeMeta:true});
      console.log(PR,`nodes ${nodes.length} edges ${edges.length}`);
      return { nodes, edges };
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: reset database from scratch
/*/ DB.PKT_SetDatabase = function ( pkt ) {
      console.log(PR,`PKT_SetDatabase`);
      let { nodes=[], edges=[] } = pkt.Data();
      if (!nodes.length) console.log(PR,'WARNING: empty nodes array');
      else console.log(PR,`setting ${nodes.length} nodes...`);
      if (!edges.length) console.log(PR,'WARNING: empty edges array');
      else console.log(PR,`setting ${edges.length} edges...`);
      NODES.clear(); NODES.insert(nodes);
      EDGES.clear(); EDGES.insert(edges);
      console.log(PR,`PKT_SetDatabase complete. Data available on next get.`);
      return { OK:true };
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    DB.PKT_Update = function ( pkt ) {
      console.log(PR,`PKT_Update`,JSON.stringify(pkt.Data()));
      let { op, node, edge, edgeID } = pkt.Data();
      switch (op) {
        case 'update':
          if (node) {
            console.log(PR,`node ${JSON.stringify(node)} matching`);
            NODES.findAndUpdate({id:node.id},(n)=>{
              console.log(PR,`updating node ${node.id} ${JSON.stringify(node)}`);
              Object.assign(n,node);
            });
          }
          if (edge) {
            console.log(PR,`edge ${JSON.stringify(edge)} matching`);
            EDGES.findAndUpdate({id:edge.id},(e)=>{
              console.log(PR,`updating edge ${edge.id} ${JSON.stringify(edge)}`);
              Object.assign(e,edge);
            });
          }
          break;
        case 'delete':
          if (edgeID!==undefined) {
            console.log(PR,`removing edge ${edgeID}`);
            EDGES.findAndRemove({id:edgeID});
          }
          break;
        default:
          throw new Error(`Unexpected UPDATE op: '${op}'`);
      }
      return { OK:true };
    }

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
module.exports = DB;
