/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

DATABASE SERVER

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const Loki = require("lokijs");
const PATH = require("path");
const FS = require("fs-extra");

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const SESSION = require("../unisys/common-session");
const LOGGER = require("../unisys/server-logger");
const PROMPTS = require("../system/util/prompts");
const PR = PROMPTS.Pad("ServerDB");
const DB_FILE = "./runtime/netcreate.loki";
const DB_CLONEMASTER = "blank.loki";

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
let m_options; // saved initialization options
let m_db; // loki database
let m_max_edgeID;
let m_max_nodeID;
let m_dupe_set; // set of nodeIDs for determine whether there are duplicates
let NODES; // loki "nodes" collection
let EDGES; // loki "edges" collection

/// API METHODS ///////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
let DB = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Initialize the database
/*/
DB.InitializeDatabase = function(options = {}) {
  FS.ensureDirSync(PATH.dirname(DB_FILE));
  if (!FS.existsSync(DB_FILE)) {
    console.log(PR, `NO EXISTING DATABASE ${DB_FILE}, so creating BLANK DATABASE...`);
  }
  let ropt = {
    autoload: true,
    autoloadCallback: f_DatabaseInitialize,
    autosave: true,
    autosaveCallback: f_AutosaveStatus,
    autosaveInterval: 4000 // save every four seconds
  };
  ropt = Object.assign(ropt, options);
  m_db = new Loki(DB_FILE, ropt);
  m_options = ropt;

  // callback on load
  function f_DatabaseInitialize() {
    // on the first load of (non-existent database), we will have no
    // collections so we can detect the absence of our collections and
    // add (and configure) them now.
    NODES = m_db.getCollection("nodes");
    if (NODES === null) NODES = m_db.addCollection("nodes");
    EDGES = m_db.getCollection("edges");
    if (EDGES === null) EDGES = m_db.addCollection("edges");

    // initialize unique set manager
    m_dupe_set = new Set();
    let dupeNodes = [];

    // find highest NODE ID
    if (NODES.count() > 0) {
      m_max_nodeID = NODES.mapReduce(
        (obj) => {
          // side-effect: make sure ids are numbers
          m_CleanObjID('node.id',obj);
          // side-effect: check for duplicate ids
          if (m_dupe_set.has(obj.id)) {
            dupeNodes.push(obj);
          } else {
            m_dupe_set.add(obj.id);
          }
          // return value
          return obj.id;
        },
        (arr) => {
          return Math.max(...arr);
        }
      )
    } else {
      m_max_nodeID = 0;
    }
    // remap duplicate NODE IDs
    dupeNodes.forEach( (obj) => {
      m_max_nodeID+=1;
      LOGGER.Write(PR,`# rewriting duplicate nodeID ${obj.id} to ${m_max_nodeID}`);
      obj.id += m_max_nodeID;
    });

    // find highest EDGE ID
    if (EDGES.count() > 0) {
      m_max_edgeID = EDGES.mapReduce(
        (obj) => {
          m_CleanObjID('edge.id',obj);
          m_CleanEdgeEndpoints(obj.id,obj);
          return obj.id;
        },
        (arr) => {
          return Math.max(...arr);
        }
      ); // end mapReduce edge ids
    } else {
      m_max_edgeID = 0;
    }
    console.log(PR,`DATABASE LOADED! m_max_nodeID '${m_max_nodeID}', m_max_edgeID '${m_max_edgeID}'`);
    m_db.saveDatabase();

    if (typeof m_options.onLoadComplete==='function') {
      m_options.onLoadComplete();
    }
  } // end f_DatabaseInitialize

  // UTILITY FUNCTION
  function f_AutosaveStatus() {
    let nodeCount = NODES.count();
    let edgeCount = EDGES.count();
    console.log(PR,`AUTOSAVING! ${nodeCount} NODES / ${edgeCount} EDGES <3`);
  }
}; // InitializeDatabase()
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: load database
    note: InitializeDatabase() was already called on system initialization
    to populate the NODES and EDGES structures.
/*/
DB.PKT_GetDatabase = function(pkt) {
  let nodes = NODES.chain().data({ removeMeta: true });
  let edges = EDGES.chain().data({ removeMeta: true });
  if (DBG) console.log(PR,`PKT_GetDatabase ${pkt.Info()} (loaded ${nodes.length} nodes, ${edges.length} edges)`);
  LOGGER.Write(pkt.Info(), `getdatabase`);
  return { nodes, edges };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: reset database from scratch
/*/
DB.PKT_SetDatabase = function(pkt) {
  if (DBG) console.log(PR, `PKT_SetDatabase`);
  let { nodes = [], edges = [] } = pkt.Data();
  if (!nodes.length) console.log(PR, "WARNING: empty nodes array");
  else console.log(PR, `setting ${nodes.length} nodes...`);
  if (!edges.length) console.log(PR, "WARNING: empty edges array");
  else console.log(PR, `setting ${edges.length} edges...`);
  NODES.clear();
  NODES.insert(nodes);
  EDGES.clear();
  EDGES.insert(edges);
  console.log(PR, `PKT_SetDatabase complete. Data available on next get.`);
  m_db.close();
  DB.InitializeDatabase();
  LOGGER.Write(pkt.Info(), `setdatabase`);
  return { OK: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_GetNewNodeID = function(pkt) {
  m_max_nodeID += 1;
  if (DBG) console.log(PR, `PKT_GetNewNodeID ${pkt.Info()} nodeID ${m_max_nodeID}`);
  return { nodeID: m_max_nodeID };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_GetNewEdgeID = function(pkt) {
  m_max_edgeID += 1;
  if (DBG) console.log(PR, `PKT_GetNewEdgeID ${pkt.Info()} edgeID ${m_max_edgeID}`);
  return { edgeID: m_max_edgeID };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_Update = function(pkt) {
  let { node, edge, nodeID, replacementNodeID, edgeID } = pkt.Data();
  let retval = {};
  // PROCESS NODE INSERT/UPDATE
  if (node) {
    m_CleanObjID('node.id',node);
    let matches = NODES.find({ id: node.id });
    if (matches.length === 0) {
      // if there was no node, then this is an insert new operation
      if (DBG) console.log(PR,`PKT_Update ${pkt.Info()} INSERT nodeID ${JSON.stringify(node)}`);
      LOGGER.Write(pkt.Info(), `insert node`, node.id, JSON.stringify(node));
      DB.AppendNodeLog(node, pkt); // log GroupId to node stored in database
      NODES.insert(node);
      retval = { op: "insert", node };
    } else if (matches.length === 1) {
      // there was one match to update
      NODES.findAndUpdate({ id: node.id }, n => {
        if (DBG) console.log(PR,`PKT_Update ${pkt.Info()} UPDATE nodeID ${node.id} ${JSON.stringify(node)}`);
        LOGGER.Write(pkt.Info(), `update node`, node.id, JSON.stringify(node));
        DB.AppendNodeLog(n, pkt); // log GroupId to node stored in database
        Object.assign(n, node);
      });
      retval = { op: "update", node };
    } else {
      if (DBG) console.log(PR,`WARNING: multiple nodeID ${node.id} x${matches.length}`);
      LOGGER.Write(pkt.Info(), `ERROR`, node.id, "duplicate node id");
      retval = { op: "error-multinodeid" };
    }
    return retval;
  } // if node

  // PROCESS EDGE INSERT/UPDATE
  if (edge) {
    m_CleanObjID('edge.id',edge);
    let matches = EDGES.find({ id: edge.id });
    if (matches.length === 0) {
      // this is a new edge
      if (DBG) console.log(PR,`PKT_Update ${pkt.Info()} INSERT edgeID ${edge.id} ${JSON.stringify(edge)}`);
      LOGGER.Write(pkt.Info(), `insert edge`, edge.id, JSON.stringify(edge));
      DB.AppendEdgeLog(edge, pkt); // log GroupId to edge stored in database
      EDGES.insert(edge);
      retval = { op: "insert", edge };
    } else if (matches.length === 1) {
      // update this edge
      EDGES.findAndUpdate({ id: edge.id }, e => {
        if (DBG) console.log(PR,`PKT_Update ${pkt.SourceGroupID()} UPDATE edgeID ${edge.id} ${JSON.stringify(edge)}`);
        LOGGER.Write(pkt.Info(), `update edge`, edge.id, JSON.stringify(edge));
        DB.AppendEdgeLog(e, pkt); // log GroupId to edge stored in database
        Object.assign(e, edge);
      });
      retval = { op: "update", edge };
    } else {
      console.log(PR, `WARNING: multiple edgeID ${edge.id} x${matches.length}`);
      LOGGER.Write(pkt.Info(), `ERROR`, node.id, "duplicate edge id");
      retval = { op: "error-multiedgeid" };
    }
    return retval;
  } // if edge

  // DELETE NODE
  if (nodeID !== undefined) {
    nodeID = m_CleanID('nodeID',nodeID);
    if (DBG) console.log(PR, `PKT_Update ${pkt.Info()} DELETE nodeID ${nodeID}`);
    // Log first so it's apparent what is triggering the edge changes
    LOGGER.Write(pkt.Info(), `delete node`, nodeID);

    // handle edges
    let edgesToProcess = EDGES.where(e => {
      return e.source === nodeID || e.target === nodeID;
    });

    // handle linked nodes
    replacementNodeID = m_CleanID('replacementNodeID',replacementNodeID);
    if (replacementNodeID !== -1) {
      // re-link edges to replacementNodeID...
      EDGES.findAndUpdate({ source: nodeID }, e => {
        LOGGER.Write(pkt.Info(),`relinking edge`,e.id,`to`,replacementNodeID);
        e.source = replacementNodeID;
      });
      EDGES.findAndUpdate({ target: nodeID }, e => {
        LOGGER.Write(pkt.Info(),`relinking edge`,e.id,`to`,replacementNodeID);
        e.target = replacementNodeID;
      });
    } else {
      // ... or delete edges completely
      let sourceEdges = EDGES.find({ source: nodeID });
      EDGES.findAndRemove({ source: nodeID });
      if (sourceEdges.length) LOGGER.Write(pkt.Info(), `deleting ${sourceEdges.length} sources matching ${nodeID}`);
      let targetEdges = EDGES.find({ target: nodeID });
      EDGES.findAndRemove({ target: nodeID });
      if (targetEdges.length) LOGGER.Write(pkt.Info(), `deleting ${targetEdges.length} targets matching ${nodeID}`);
    }
    // ...finally remove the node itself
    NODES.findAndRemove({ id: nodeID });
    return { op: "delete", nodeID, replacementNodeID };
  }

  // DELETE EDGES
  if (edgeID !== undefined) {
    edgeID = m_CleanID('edgeID',edgeID);
    if (DBG) console.log(PR, `PKT_Update ${pkt.Info()} DELETE edgeID ${edgeID}`);
    LOGGER.Write(pkt.Info(), `delete edge`, edgeID);
    EDGES.findAndRemove({ id: edgeID });
    return { op: "delete", edgeID };
  }

  // return update value
  return { op: "error-noaction" };
};

/// NODE ANNOTATION ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ write/remove packet SourceGroupID() information into the node before writing
    the first entry is the insert, subsequent operations are updates
/*/
DB.AppendNodeLog = function(node, pkt) {
  if (!node._nlog) node._nlog = [];
  let gid = pkt.SourceGroupID() || pkt.SourceAddress();
  node._nlog.push(gid);
  if (DBG) {
    let out = "";
    node._nlog.forEach(el => {
      out += `[${el}] `;
    });
    console.log(PR, "nodelog", out);
  }
};
DB.FilterNodeLog = function(node) {
  let newNode = Object.assign({}, node);
  Reflect.deleteProperty(newNode, "_nlog");
  return newNode;
};
/// EDGE ANNOTATION ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ write/remove packet SourceGroupID() information into the node before writing
    the first entry is the insert, subsequent operations are updates
/*/
DB.AppendEdgeLog = function(edge, pkt) {
  if (!edge._elog) edge._elog = [];
  let gid = pkt.SourceGroupID() || pkt.SourceAddress();
  edge._elog.push(gid);
  if (DBG) {
    let out = "";
    edge._elog.forEach(el => {
      out += `[${el}] `;
    });
    console.log(PR, "edgelog", out);
  }
};
DB.FilterEdgeLog = function(edge) {
  let newEdge = Object.assign({}, edge);
  Reflect.deleteProperty(newEdge, "_elog");
  return newEdge;
};

/// JSON EXPORT ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ called by brunch to generate an up-to-date JSON file to path.
    creates the path if it doesn't exist
/*/
DB.WriteJSON = function( filePath ) {
  let db = new Loki(DB_FILE,{
      autoload: true,
      autoloadCallback: () => {
        if (typeof filePath==='string') {
          if (DBG) console.log(PR,`writing { nodes, edges } to '${filePath}'`);
          let nodes = db.getCollection("nodes").chain()
            .data({ removeMeta: true });
          let edges = db.getCollection("edges").chain()
            .data({ removeMeta: true });
          let data = { nodes, edges };
          let json = JSON.stringify(data);
          if (DBG) console.log(PR,`ensuring DIR ${PATH.dirname(filePath)}`);
          FS.ensureDirSync(PATH.dirname( filePath ));
          if (DBG) console.log(PR,`writing file ${filePath}`);
          FS.writeFileSync( filePath, json );
          console.log(PR,`*** WROTE JSON DATABASE`);
        } else {
          console.log(PR,`ERR path ${filePath} must be a pathname`);
        }
      }
    }
  );
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// utility function for cleaning nodes with numeric id property
function m_CleanObjID(prompt, obj) {
  if (typeof obj.id==='string') {
    let int = parseInt(obj.id,10);
    LOGGER.Write(PR,`! ${prompt} "${obj.id}" is string; converting to ${int}`);
    obj.id=int;
  }
  return obj;
}
function  m_CleanEdgeEndpoints(prompt, edge) {
  if (typeof edge.source==='string') {
    let int = parseInt(edge.source,10);
    LOGGER.Write(PR,`  edge ${prompt} source "${edge.source}" is string; converting to ${int}`);
    edge.source = int;
  }
  if (typeof edge.target==='string') {
    let int = parseInt(edge.target,10);
    LOGGER.Write(PR,`  edge ${prompt} target "${edge.target}" is string; converting to ${int}`);
    edge.target = int;
  }
  return edge;
}
function m_CleanID(prompt, id) {
  if (typeof id==='string') {
    let int = parseInt(id,10);
    LOGGER.Write(PR,`! ${prompt} "${id}" is string; converting to number ${int}`);
    id = int;
  }
  return id;
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
module.exports = DB;
