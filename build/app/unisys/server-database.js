/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

DATABASE SERVER

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = true;

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const Loki              = require('lokijs');
const PATH              = require('path');
const FS                = require('fs-extra');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const PROMPTS           = require('../system/util/prompts');
const PR                = PROMPTS.Pad('SRV-DB');
const DB_FILE           = './runtime/netcreate.json';

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
let   m_options;    // saved initialization options
let   m_db;         // loki database
let   m_max_edgeID;
let   m_max_nodeID;
let   NODES;        // loki "nodes" collection
let   EDGES;        // loki "edges" collection

/// API METHODS ///////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
let DB = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Initialize the database
/*/ DB.InitializeDatabase = function( options={} ) {
      console.log(PR,`InitializeDatabase`);
      FS.ensureDir(PATH.dirname(DB_FILE));
      if (!FS.existsSync(DB_FILE)) {
        console.log(PR,`No ${DB_FILE} yet, so filling from sample.data.json...`);
        FS.copySync('./runtime/sample.data.json',DB_FILE);
        console.log(PR,`...success!`);
      }
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

      // callback on load
      function f_DatabaseInitialize() {
        // on the first load of (non-existent database), we will have no
        // collections so we can detect the absence of our collections and
        // add (and configure) them now.
        NODES = m_db.getCollection("nodes");
        if (NODES===null) NODES = m_db.addCollection("nodes");
        EDGES = m_db.getCollection("edges");
        if (EDGES===null) EDGES = m_db.addCollection("edges");
        // find highest NODE ID
        if (NODES.count()>0) {
          m_max_nodeID = NODES.mapReduce(
            (obj) => { return parseInt(obj.id,10) },
            (arr) => {
              return Math.max(...arr);
            }
          ) // end mapReduce node ids
        } else {
          m_max_nodeID = 0;
        }
        // find highest EDGE ID
        if (EDGES.count()>0) {
          m_max_edgeID = EDGES.mapReduce(
            (obj) => { return parseInt(obj.id,10) },
            (arr) => {
              return Math.max(...arr);
            }
          ); // end mapReduce edge ids
        } else {
          m_max_edgeID = 0;
        }
        console.log(PR,`highest ids: NODE.id='${m_max_nodeID}', EDGE.id='${m_max_edgeID}'`);
      } // end f_DatabaseInitialize


      // UTILITY FUNCTION
      function f_AutosaveStatus( ) {
        let nodeCount = NODES.count();
        let edgeCount = EDGES.count();
        console.log(PR,`autosaving ${nodeCount} nodes and ${edgeCount} edges...`);
      }
    }; // InitializeDatabase()
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: load database
    note: InitializeDatabase() was already called on system initialization
    to populate the NODES and EDGES structures.
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
      m_db.close();
      DB.InitializeDatabase();
      return { OK:true };
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    DB.PKT_GetNewNodeID = function ( pkt ) {
      m_max_nodeID += 1;
      console.log(PR,`PKT_GetNewNodeID allocating nodeID ${m_max_nodeID} to ${pkt.SourceAddress()}`);
      return { nodeID : m_max_nodeID };
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    DB.PKT_GetNewEdgeID = function ( pkt ) {
      m_max_edgeID += 1;
      console.log(PR,`PKT_GetNewEdgeID allocating edgeID ${m_max_edgeID} to ${pkt.SourceAddress()}`);
      return { edgeID : m_max_edgeID };
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    DB.PKT_Update = function ( pkt ) {
      console.log(PR,`PKT_Update`,JSON.stringify(pkt.Data()));
      let { op, node, newNode, edge, newEdge, edgeID } = pkt.Data();
      switch (op) {
        case 'insert':
          if (newNode) {
            if (NODES.find({id:newNode.id}).length===0) {
              console.log(PR,`insert node ${JSON.stringify(newNode)}`);
              NODES.insert(newNode);
            } else {
              console.log(PR,'ignoring duplicate node id',newNode.id);
            }
          }
          if (newEdge) {
            console.log(PR,'Checking edge id',newEdge.id,'...');
            if (EDGES.find({id:newEdge.id}).length===0) {
              console.log(PR,`insert edge ${JSON.stringify(newEdge)}`);
              EDGES.insert(newEdge);
            } else {
              console.log(PR,'ignoring duplicate edge id',newEdge.id);
            }
          }
          break;
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
