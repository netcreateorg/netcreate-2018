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
const SESSION           = require('../unisys/common-session');
const PROMPTS           = require('../system/util/prompts');
const PR                = PROMPTS.Pad('SRV-DB');
const DB_FILE           = './runtime/netcreate.loki';
const DB_CLONEMASTER    = 'alexander.loki';

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
        console.log(PR,`No ${DB_FILE} yet, so filling from ${DB_CLONEMASTER}...`);
        FS.copySync(`./runtime/${DB_CLONEMASTER}`,DB_FILE);
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
      let nodes = NODES.chain().data({removeMeta:true});
      let edges = EDGES.chain().data({removeMeta:true});
      if (DBG) console.log(PR,`PKT_GetDatabase ${pkt.Info()} (loaded ${nodes.length} nodes, ${edges.length} edges)`);
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
      if (DBG) console.log(PR,`PKT_GetNewNodeID ${pkt.Info()} nodeID ${m_max_nodeID}`);
      return { nodeID : m_max_nodeID };
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    DB.PKT_GetNewEdgeID = function ( pkt ) {
      m_max_edgeID += 1;
      if (DBG) console.log(PR,`PKT_GetNewEdgeID ${pkt.Info()} edgeID ${m_max_edgeID}`);
      return { edgeID : m_max_edgeID };
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    DB.PKT_Update = function ( pkt ) {
      let { node, edge, edgeID } = pkt.Data();
      let retval = {};

      // PROCESS NODE INSERT/UPDATE
      if (node) {
        let matches = NODES.find({id:node.id});
        if (matches.length===0) {
          // if there was no node, then this is an insert new operation
          console.log(PR,`PKT_Update ${pkt.Info()} INSERT nodeID ${JSON.stringify(node)}`);
          NODES.insert(node);
          retval = { op:'insert', node };
        } else if (matches.length===1) {
          // there was one match to update
          NODES.findAndUpdate({id:node.id},(n)=>{
            console.log(PR,`PKT_Update ${pkt.Info()} UPDATE nodeID ${node.id} ${JSON.stringify(node)}`);
            Object.assign(n,node);
          });
          retval = { op:'update', node };
        } else {
          console.log(PR,`WARNING: multiple nodeID ${node.id} x${matches.length}`);
          retval = { op:'error-multinodeid' };
        }
        return retval;
      } // if node

      // PROCESS EDGE INSERT/UPDATE
      if (edge) {
        let matches = EDGES.find({id:edge.id});
        if (matches.length===0) {
          // this is a new edge
          console.log(PR,`PKT_Update ${pkt.Info()} INSERT edgeID ${edge.id} ${JSON.stringify(edge)}`);
          EDGES.insert(edge);
          retval = { op:'insert', edge };
        } else if (matches.length===1) {
          // update this edge
          EDGES.findAndUpdate({id:edge.id},(e)=>{
            console.log(PR,`PKT_Update ${pkt.SourceGroupID()} UPDATE edgeID ${edge.id} ${JSON.stringify(edge)}`);
            Object.assign(e,edge);
          });
          retval = { op:'update', edge };
        } else {
          console.log(PR,`WARNING: multiple edgeID ${edge.id} x${matches.length}`);
          retval = { op:'error-multiedgeid' };
        }
        return retval;
      } // if edge

      // DELETE EDGES
      if (edgeID!==undefined) {
        console.log(PR,`PKT_Update ${pkt.Info()} DELETE edgeID ${edgeID}`);
        EDGES.findAndRemove({id:edgeID});
        return { op:'delete',edgeID };
      }

      // return update value
      return { op:'error-noaction' };
    }

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
module.exports = DB;
