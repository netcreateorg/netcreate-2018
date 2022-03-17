/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

DATABASE SERVER

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const Loki = require("lokijs");
const PATH = require("path");
const FS = require("fs-extra");
const TOML = require("@iarna/toml");

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const SESSION = require("../unisys/common-session");
const LOGGER = require("../unisys/server-logger");
const PROMPTS = require("../system/util/prompts");
const TEMPLATE_SCHEMA = require("../view/netcreate/template-schema");

const PR = PROMPTS.Pad("ServerDB");
const RUNTIMEPATH = './runtime/';
const TEMPLATEPATH = './app/assets/templates/';
const TEMPLATE_EXT = '.template.toml'
const DB_CLONEMASTER = "blank.loki";
const NC_CONFIG = require("../assets/netcreate-config");

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
let m_options; // saved initialization options
let m_db; // loki database
let m_max_edgeID;
let m_max_nodeID;
let m_dupe_set; // set of nodeIDs for determine whether there are duplicates
let NODES; // loki "nodes" collection
let EDGES; // loki "edges" collection
let m_locked_nodes; // map key = nodeID, value = uaddr initiating the lock
let m_locked_edges; // map key = nodeID, value = uaddr initiating the lock
let TEMPLATE;
let m_open_editors = []; // array of template, node, or edge editors

/// API METHODS ///////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
let DB = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Initialize the database
/*/
DB.InitializeDatabase = function (options = {}) {

  let dataset = NC_CONFIG.dataset;
  let db_file = m_GetValidDBFilePath(dataset);
  FS.ensureDirSync(PATH.dirname(db_file));
  if (!FS.existsSync(db_file)) {
    console.log(PR, `NO EXISTING DATABASE ${db_file}, so creating BLANK DATABASE...`);
  }
  console.log(PR, `LOADING DATABASE ${db_file}`);
  let ropt = {
    autoload: true,
    autoloadCallback: f_DatabaseInitialize,
    autosave: true,
    autosaveCallback: f_AutosaveStatus,
    autosaveInterval: 4000, // save every four seconds
  };
  ropt = Object.assign(ropt, options);
  m_db = new Loki(db_file, ropt);
  m_options = ropt;
  m_options.db_file = db_file;        // store for use by DB.WriteJSON

  // callback on load
  function f_DatabaseInitialize() {
    // on the first load of (non-existent database), we will have no
    // collections so we can detect the absence of our collections and
    // add (and configure) them now.
    NODES = m_db.getCollection("nodes");
    if (NODES === null) NODES = m_db.addCollection("nodes");
    m_locked_nodes = new Map();
    EDGES = m_db.getCollection("edges");
    if (EDGES === null) EDGES = m_db.addCollection("edges");
    m_locked_edges = new Map();

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
      obj.id = m_max_nodeID;
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

    m_LoadTemplate();

  } // end f_DatabaseInitialize

  // UTILITY FUNCTION
  function f_AutosaveStatus() {
    let nodeCount = NODES.count();
    let edgeCount = EDGES.count();
    console.log(PR,`AUTOSAVING! ${nodeCount} NODES / ${edgeCount} EDGES <3`);
  }
}; // InitializeDatabase()
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// utility function for loading template
/*/ Converts a version 1.3 JSON template to a version 1.4 TOML template
/*/
// eslint-disable-next-line complexity
function m_MigrateJSONtoTOML(JSONtemplate) {
  console.log(PR, 'Converting JSON to TOML...');
  const jt = JSONtemplate;
  const SCHEMA = TEMPLATE_SCHEMA.TEMPLATE.properties;
  const TOMLtemplate = {
    name: jt.name,
    description: jt.description,
    requireLogin: jt.requireLogin || SCHEMA.requireLogin.default,
    hideDeleteNodeButton: (jt.nodePrompts && jt.nodePrompts.delete && jt.nodePrompts.delete.hidden) || SCHEMA.hideDeleteNodeButton.default,
    allowLoggedInUserToImport: SCHEMA.allowLoggedInUserToImport.default, // new parameter not in old json template
    duplicateWarning: (jt.nodePrompts && jt.nodePrompts.label && jt.nodePrompts.label.duplicateWarning) || SCHEMA.duplicateWarning.default,
    nodeIsLockedMessage: (jt.nodePrompts && jt.nodePrompts.label && jt.nodePrompts.label.sourceNodeIsLockedMessage) || SCHEMA.nodeIsLockedMessage.default,
    edgeIsLockedMessage: (jt.edgePrompts && jt.edgePrompts.edgeIsLockedMessage) || SCHEMA.edgeIsLockedMessage.default,
    templateIsLockedMessage: SCHEMA.templateIsLockedMessage.default,
    nodeDefaultTransparency: (jt.nodePrompts && jt.nodePrompts.defaultTransparency) || SCHEMA.nodeDefaultTransparency.default,
    edgeDefaultTransparency: (jt.edgePrompts && jt.edgePrompts.defaultTransparency) || SCHEMA.edgeDefaultTransparency.default,
    searchColor: jt.searchColor || SCHEMA.searchColor.default,
    sourceColor: jt.sourceColor || SCHEMA.sourceColor.default,
    citation: {
      text: (jt.citationPrompts && jt.citationPrompts.citation) || jt.name,
      hidden: (jt.citationPrompts && jt.citationPrompts.hidden) || SCHEMA.citation.properties.hidden.default
    }
  }
  // convert nodePrompts
  const nodeDefs = {};
  // 1. Add fields
  Object.keys(JSONtemplate.nodePrompts).forEach(k => {
    const field = JSONtemplate.nodePrompts[k];
    nodeDefs[k] = {
      type: field.type || 'string', // default to 'string'
      displayLabel: field.label,
      exportLabel: field.label,
      help: field.help,
      includeInGraphTooltip: field.includeInGraphTooltip || true, // default to show tool tip
      hidden: field.hidden || false // default to not hidden
    }
    if (k === 'type') {
      // special handling for type options
      const options = field.options.map(o => {
        return {
          label: o.label,
          color: o.color
        }
      });
      // make sure field type is set to "select" -- older templates do not set type
      nodeDefs[k].type = 'select';
      console.log(PR,'...migrating nodeDefs field', k,'with options, forcing type to "select"')
      nodeDefs[k].options = options;
    }
  })
  // 2. Add id -- clobbers any existing id
  nodeDefs.id = {
    type: 'number',
    displayLabel: 'id',
    exportLabel: 'ID',
    help: 'System-generated unique id number'
  };
  // 3. remove deprecated fields
  Reflect.deleteProperty(nodeDefs, 'delete'); // `delete` -- mapped to hideDeleteNodeButton
  Reflect.deleteProperty(nodeDefs, 'defaultTransparency'); // `nodeDefaultTransparency` -- moved to root

  // 4. Add other built-ins
  nodeDefs.updated = {
    displayLabel: 'Last Updated',
    exportLabel: 'Last Updated',
    help: 'Date and time of last update',
    includeInGraphTooltip: true // default to show tool tip
  }
  nodeDefs.created = {
    displayLabel: 'Created',
    exportLabel: 'Created',
    help: 'Date and time node was created',
    includeInGraphTooltip: true // default to show tool tip
  }

  // convert edgePrompts
  const edgeDefs = {};
  // 1. Add fields
  Object.keys(JSONtemplate.edgePrompts).forEach(k => {
    const field = JSONtemplate.edgePrompts[k];
    edgeDefs[k] = {
      type: field.type || 'string', // default to 'string'
      displayLabel: field.label,
      exportLabel: field.label,
      help: field.help,
      hidden: field.hidden || false // default to not hidden
      // If necessary, user can edit template to hide it again.
      // We want it visible by default, because of migrations
      // the original field may not be defined.
      // e.g. orig template uses "Relationship" not "type"
    }
    if (k === 'type') {
      // special handling for type options
      const options = field.options.map(o => {
        return {
          label: o.label,
          color: o.color
        }
      })
      // make sure field type is set to "select" -- older templates do not set type
      edgeDefs[k].type = 'select';
      console.log(PR,'...migrating edgeDefs field', k,'with options, forcing type to "select"')
      edgeDefs[k].options = options;
    }
  })
  // 2. Add id
  edgeDefs.id = { // will clobber any existing id
    type: 'number',
    displayLabel: 'id',
    exportLabel: 'ID',
    help: 'System-generated unique id number'
  };
  // 3. remove deprecated fields
  Reflect.deleteProperty(edgeDefs, 'edgeIsLockedMessage'); // `edgeIsLockedMessage` -- moved to root
  Reflect.deleteProperty(edgeDefs, 'defaultTransparency'); // `edgeDefaultTransparency` -- moved to root

  TOMLtemplate.nodeDefs = nodeDefs;
  TOMLtemplate.edgeDefs = edgeDefs;
  if (DBG) console.log(PR, 'Imported TOML TEMPLATE', TOMLtemplate)

  return TOMLtemplate;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Loads an original circa version 1.3 JSON template
    and converts it to a TOML template
/*/
function m_LoadJSONTemplate(templatePath) {
  // 1. Load JSON
  console.log(PR, `LOADING JSON TEMPLATE ${templatePath}`);
  const JSONTEMPLATE = FS.readJsonSync(templatePath);
  // 2. Convert to TOML
  TEMPLATE = m_MigrateJSONtoTOML(JSONTEMPLATE);
  // 3. Save it (and load)
  DB.WriteTemplateTOML({ data: { template: TEMPLATE } })
    .then(() => {
      console.log(PR, '...converted JSON template saved!');
    });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Loads a *.template.toml file from the server.
/*/
function m_LoadTOMLTemplate(templateFilePath) {
  const templateFile = FS.readFile(templateFilePath, 'utf8', (err, data) => {
    if (err) throw err;
    // Read TOML
    const json = TOML.parse(data);
    // Ensure key fields are present, else default to schema
    const SCHEMA = TEMPLATE_SCHEMA.TEMPLATE.properties;
    json.duplicateWarning = json.duplicateWarning || SCHEMA.duplicateWarning.default;
    json.nodeIsLockedMessage = json.nodeIsLockedMessage || SCHEMA.nodeIsLockedMessage.default;
    json.edgeIsLockedMessage = json.edgeIsLockedMessage || SCHEMA.edgeIsLockedMessage.default;
    json.templateIsLockedMessage = json.templateIsLockedMessage || SCHEMA.templateIsLockedMessage.default;
    TEMPLATE = json;
    console.log(PR, 'Template loaded', templateFilePath);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Load Template
    1. Tries to load a TOML template
    2. If it can't be found, tries to load the JSON template and convert it
    3. If that fails, clone the default TOML template and load it
    Called by
    * DB.InitializeDatabase
    * DB.WriteTemplateTOML
/*/
function m_LoadTemplate() {
  const TOMLtemplateFilePath = m_GetTemplateTOMLFilePath();
  FS.ensureDirSync(PATH.dirname(TOMLtemplateFilePath));
  // Does the TOML template exist?
  if (FS.existsSync(TOMLtemplateFilePath)) {
    // 1. If TOML exists, load it
    m_LoadTOMLTemplate(TOMLtemplateFilePath);
  } else {
    // 2/ Try falling back to JSON template
    const JSONTemplatePath = RUNTIMEPATH + NC_CONFIG.dataset + ".template";
    // Does the JSON template exist?
    if (FS.existsSync(JSONTemplatePath)) {
      m_LoadJSONTemplate(JSONTemplatePath);
    } else {
      // 3. Else, no existing template, clone _default.template.toml
      console.log(PR, `NO EXISTING TEMPLATE ${TOMLtemplateFilePath}, so cloning default template...`);
      FS.copySync(TEMPLATEPATH + '_default' + TEMPLATE_EXT, TOMLtemplateFilePath);
      // then load it
      m_LoadTOMLTemplate(TOMLtemplateFilePath);
    }
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: load database
    note: InitializeDatabase() was already called on system initialization
    to populate the NODES and EDGES structures.
/*/
DB.PKT_GetDatabase = function(pkt) {
  let nodes = NODES.chain().data({ removeMeta: false });
  let edges = EDGES.chain().data({ removeMeta: false });
  if (DBG) console.log(PR,`PKT_GetDatabase ${pkt.Info()} (loaded ${nodes.length} nodes, ${edges.length} edges)`);
  LOGGER.Write(pkt.Info(), `getdatabase`);
  return { d3data: { nodes, edges }, template: TEMPLATE };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: reset database from scratch
/*/
DB.PKT_SetDatabase = function (pkt) {
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
/*/ API: Add nodes/edges to an existing db
/*/
DB.PKT_InsertDatabase = function (pkt) {
  if (DBG) console.log(PR, `PKT_InsertDatabase`);
  let { nodes = [], edges = [] } = pkt.Data();
  if (!nodes.length) console.log(PR, "WARNING: empty nodes array");
  else console.log(PR, `setting ${nodes.length} nodes...`);
  if (!edges.length) console.log(PR, "WARNING: empty edges array");
  else console.log(PR, `setting ${edges.length} edges...`);
  NODES.insert(nodes);
  EDGES.insert(edges);
  console.log(PR, `PKT_InsertDatabase complete. Data available on next get.`);
  m_db.close();
  DB.InitializeDatabase();
  LOGGER.Write(pkt.Info(), `setdatabase`);
  return { OK: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Update or add nodes/edges to an existing db
    If the node/edge exists, update it.
    Otherwise, insert it.
    This walks down the node and edge arrays one by one,
    using PKT_Update to decide whether to insert or update the data.
    REVIEW: Consider batch operations ala `NODES.insert(nodes)`?
/*/
DB.PKT_MergeDatabase = function (pkt) {
  if (DBG) console.log(PR, `PKT_InsertDatabase`);
  let { nodes = [], edges = [] } = pkt.Data();

  // insert nodes one by one
  nodes.forEach(n => {
    pkt.data.node = n;
    DB.PKT_Update(pkt);
  });
  pkt.data.node = undefined; // clear, no longer needed

  edges.forEach(e => {
    pkt.data.edge = e;
    DB.PKT_Update(pkt);
  });
  pkt.data.edge = undefined; // clear, no longer needed

  return new Promise((resolve, reject) => m_db.saveDatabase(err => {
    if (err) reject(new Error('rejected'));
    DB.InitializeDatabase();
    LOGGER.Write(pkt.Info(), `mergedatabase`);
    resolve({ OK: true });
  }));
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Update all data in existing database.
    Used to update node/edge types after template edit
/*/
DB.PKT_UpdateDatabase = function (pkt) {
  if (DBG) console.log(PR, `PKT_UpdateDatabase`);
  let { nodes = [], edges = [] } = pkt.Data();
  if (!nodes.length) console.log(PR, "WARNING: empty nodes array");
  else console.log(PR, `updating ${nodes.length} nodes...`);
  if (!edges.length) console.log(PR, "WARNING: empty edges array");
  else console.log(PR, `updating ${edges.length} edges...`);
  NODES.update(nodes);
  EDGES.update(edges);
  console.log(PR, `PKT_UpdateDatabase complete. Disk db file updated.`);
  m_db.saveDatabase();
  LOGGER.Write(pkt.Info(), `updatedatabase`);
  return { OK: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_GetNewNodeID = function(pkt) {
  m_max_nodeID += 1;
  if (DBG) console.log(PR, `PKT_GetNewNodeID ${pkt.Info()} nodeID ${m_max_nodeID}`);
  return { nodeID: m_max_nodeID };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_GetNewNodeIDs = function (pkt) {
  const count = Number(pkt.Data().count);
  const firstId = m_max_nodeID + 1;
  const nodeIDs = [];
  for (let i = 0; i < count; i++) nodeIDs.push(firstId + i);
  m_max_nodeID += count;
  if (DBG) console.log(PR, `PKT_GetNewNodeIDS ${pkt.Info()} nodeIDs ${nodeIDs}`);
  return { nodeIDs };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_GetNewEdgeID = function(pkt) {
  m_max_edgeID += 1;
  if (DBG) console.log(PR, `PKT_GetNewEdgeID ${pkt.Info()} edgeID ${m_max_edgeID}`);
  return { edgeID: m_max_edgeID };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_GetNewEdgeIDs = function(pkt) {
  const count = Number(pkt.Data().count);
  const firstId = m_max_edgeID + 1;
  const edgeIDs = [];
  for (let i = 0; i < count; i++) edgeIDs.push(firstId + i);
  m_max_edgeID += count;
  if (DBG) console.log(PR, `PKT_GetNewEdgeIDs ${pkt.Info()} edgeIDs ${edgeIDs}`);
  return { edgeIDs };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestLockNode = function(pkt) {
  let { nodeID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  let errcode = m_IsInvalidNode( nodeID );
  if (errcode) return errcode;
  // check if node is already locked
  if (m_locked_nodes.has(nodeID)) return m_MakeLockError(`nodeID ${nodeID} is already locked`);
  // SUCCESS
  // single matching node exists and is not yet locked, so lock it
  m_locked_nodes.set(nodeID, uaddr);
  return { nodeID, locked : true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestUnlockNode = function (pkt) {
  let { nodeID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  let errcode = m_IsInvalidNode( nodeID );
  if (errcode) return errcode;
  // check that node is already locked
  if (m_locked_nodes.has(nodeID)) {
    m_locked_nodes.delete(nodeID);
    return { nodeID, unlocked:true };
  }
  // this is an error because nodeID wasn't in the lock table
  return m_MakeLockError(`nodeID ${nodeID} was not locked so can't unlock`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_IsInvalidNode ( nodeID ) {
  if (!nodeID) return m_MakeLockError(`undefined nodeID`);
  nodeID = Number.parseInt(nodeID,10);
  if (isNaN(nodeID)) return m_MakeLockError(`nodeID was not a number`);
  if (nodeID<0) return m_MakeLockError(`nodeID ${nodeID} must be positive integer`);
  if (nodeID>m_max_nodeID) return m_MakeLockError(`nodeID ${nodeID} is out of range`);
    // find if the node exists
  let matches = NODES.find({ id: nodeID });
  if (matches.length===0) return m_MakeLockError(`nodeID ${nodeID} not found`);
  if (matches.length>1) return m_MakeLockError(`nodeID ${nodeID} matches multiple entries...critical error!`);
  // no retval is no error!
  return undefined;
}
function m_MakeLockError( info ) {
  return { NOP:`ERR`, INFO:info };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestLockEdge = function (pkt) {
  let { edgeID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  let errcode = m_IsInvalidEdge(edgeID);
  if (errcode) return errcode;
  // check if edge is already locked
  if (m_locked_edges.has(edgeID)) return m_MakeLockError(`edgeID ${edgeID} is already locked`);
  // SUCCESS
  // single matching edge exists and is not yet locked, so lock it
  m_locked_edges.set(edgeID, uaddr);
  return { edgeID, locked: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestUnlockEdge = function (pkt) {
  let { edgeID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  let errcode = m_IsInvalidEdge(edgeID);
  if (errcode) return errcode;
  // check that edge is already locked
  if (m_locked_edges.has(edgeID)) {
    m_locked_edges.delete(edgeID);
    return { edgeID, unlocked: true };
  }
  // this is an error because nodeID wasn't in the lock table
  return m_MakeLockError(`edgeID ${edgeID} was not locked so can't unlock`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_IsInvalidEdge(edgeID) {
  if (!edgeID) return m_MakeLockError(`undefined edgeID`);
  edgeID = Number.parseInt(edgeID, 10);
  if (isNaN(edgeID)) return m_MakeLockError(`edgeID was not a number`);
  if (edgeID < 0) return m_MakeLockError(`edgeID ${edgeID} must be positive integer`);
  if (edgeID > m_max_edgeID) return m_MakeLockError(`edgeID ${edgeID} is out of range`);
  // find if the node exists
  let matches = EDGES.find({ id: edgeID });
  if (matches.length === 0) return m_MakeLockError(`edgeID ${edgeID} not found`);
  if (matches.length > 1) return m_MakeLockError(`edgeID ${edgeID} matches multiple entries...critical error!`);
  // no retval is no error!
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestUnlockAllNodes = function (pkt) {
  m_locked_nodes = new Map();
  return { unlocked: true };
}
DB.PKT_RequestUnlockAllEdges = function (pkt) {
  m_locked_edges = new Map();
  return { unlocked: true };
}
DB.PKT_RequestUnlockAll = function (pkt) {
  m_locked_nodes = new Map();
  m_locked_edges = new Map();
  m_open_editors = [];
  return { unlocked: true };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ called by server-network when a client disconnects we want to unlock any
    nodes and edges they had locked.
/*/
DB.RequestUnlock = function (uaddr) {
  m_locked_nodes.forEach((value, key) => {
    if (value === uaddr) m_locked_nodes.delete(key);
  });
  m_locked_edges.forEach((value, key) => {
    if (value === uaddr) m_locked_edges.delete(key);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// eslint-disable-next-line complexity
DB.PKT_Update = function(pkt) {
  let { node, edge, nodeID, replacementNodeID, edgeID } = pkt.Data();
  let retval = {};
  // PROCESS NODE INSERT/UPDATE
  if (node) {
    m_CleanObjID(`${pkt.Info()} node.id`,node);
    let matches = NODES.find({ id: node.id });
    if (matches.length === 0) {
      // if there was no node, then this is an insert new operation
      if (DBG) console.log(PR,`PKT_Update ${pkt.Info()} INSERT nodeID ${JSON.stringify(node)}`);
      LOGGER.Write(pkt.Info(), `insert node`, node.id, JSON.stringify(node));
      DB.AppendNodeLog(node, pkt); // log GroupId to node stored in database
      NODES.insert(node);
      // Return the updated record -- needed to update metadata
      let updatedNode = NODES.findOne({ id: node.id });
      if (!updatedNode) console.log(PR, `PKT_Update ${pkt.Info()} could not find node after update!  This should not happen! ${node.id} ${JSON.stringify(node)}`);
      retval = { op: "insert", node: updatedNode };
    } else if (matches.length === 1) {
      // there was one match to update
      NODES.findAndUpdate({ id: node.id }, n => {
        if (DBG) console.log(PR,`PKT_Update ${pkt.Info()} UPDATE nodeID ${node.id} ${JSON.stringify(node)}`);
        LOGGER.Write(pkt.Info(), `update node`, node.id, JSON.stringify(node));
        DB.AppendNodeLog(n, pkt); // log GroupId to node stored in database
        Object.assign(n, node);
      });
      // Return the updated record -- needed to update metadata
      let updatedNode = NODES.findOne({ id: node.id });
      if (!updatedNode) console.log(PR, `PKT_Update ${pkt.Info()} could not find node after update!  This should not happen! ${node.id} ${JSON.stringify(node)}`);
      retval = { op: "update", node: updatedNode };
    } else {
      if (DBG) console.log(PR,`WARNING: multiple nodeID ${node.id} x${matches.length}`);
      LOGGER.Write(pkt.Info(), `ERROR`, node.id, "duplicate node id");
      retval = { op: "error-multinodeid" };
    }
    return retval;
  } // if node

  // PROCESS EDGE INSERT/UPDATE
  if (edge) {
    m_CleanObjID(`${pkt.Info()} edge.id`,edge);
    let matches = EDGES.find({ id: edge.id });
    if (matches.length === 0) {
      // this is a new edge
      if (DBG) console.log(PR,`PKT_Update ${pkt.Info()} INSERT edgeID ${edge.id} ${JSON.stringify(edge)}`);
      LOGGER.Write(pkt.Info(), `insert edge`, edge.id, JSON.stringify(edge));
      DB.AppendEdgeLog(edge, pkt); // log GroupId to edge stored in database
      EDGES.insert(edge);
      // Return the updated record -- needed to update metadata
      let updatedEdge = EDGES.findOne({ id: edge.id });
      if (!updatedEdge) console.log(PR, `PKT_Update ${pkt.Info()} could not find node after update!  This should not happen! ${node.id} ${JSON.stringify(node)}`);
      retval = { op: "insert", edge: updatedEdge };
    } else if (matches.length === 1) {
      // update this edge
      EDGES.findAndUpdate({ id: edge.id }, e => {
        if (DBG) console.log(PR,`PKT_Update ${pkt.SourceGroupID()} UPDATE edgeID ${edge.id} ${JSON.stringify(edge)}`);
        LOGGER.Write(pkt.Info(), `update edge`, edge.id, JSON.stringify(edge));
        DB.AppendEdgeLog(e, pkt); // log GroupId to edge stored in database
        Object.assign(e, edge);
      });
      // Return the updated record -- needed to update metadata
      let updatedEdge = EDGES.findOne({ id: edge.id });
      if (!updatedEdge) console.log(PR, `PKT_Update ${pkt.Info()} could not find node after update!  This should not happen! ${node.id} ${JSON.stringify(node)}`);
      retval = { op: "update", edge: updatedEdge };
    } else {
      console.log(PR, `WARNING: multiple edgeID ${edge.id} x${matches.length}`);
      LOGGER.Write(pkt.Info(), `ERROR`, node.id, "duplicate edge id");
      retval = { op: "error-multiedgeid" };
    }
    return retval;
  } // if edge

  // DELETE NODE
  if (nodeID !== undefined) {
    nodeID = m_CleanID(`${pkt.Info()} nodeID`,nodeID);
    if (DBG) console.log(PR, `PKT_Update ${pkt.Info()} DELETE nodeID ${nodeID}`);
    // Log first so it's apparent what is triggering the edge changes
    LOGGER.Write(pkt.Info(), `delete node`, nodeID);

    // handle edges
    let edgesToProcess = EDGES.where(e => {
      return e.source === nodeID || e.target === nodeID;
    });

    // handle linked nodes
    replacementNodeID = m_CleanID(`${pkt.Info()} replacementNodeID`,replacementNodeID);
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
    edgeID = m_CleanID(`${pkt.Info()} edgeID`,edgeID);
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
DB.WriteDbJSON = function (filePath) {
  let dataset = NC_CONFIG.dataset;

  // Ideally we should use m_otions value, but in standlone mode,
  // m_options might not be defined.
  let db_file = m_options ? m_options.db_file : m_GetValidDBFilePath(dataset);
  let db = new Loki(db_file,{
      autoload: true,
      autoloadCallback: () => {
        if (typeof filePath==='string') {
          if (DBG) console.log(PR,`writing { nodes, edges } to '${filePath}'`);
          let nodes = db.getCollection("nodes").chain()
            .data({ removeMeta: false });
          let edges = db.getCollection("edges").chain()
            .data({ removeMeta: false });
          let data = { nodes, edges };
          let json = JSON.stringify(data);
          if (DBG) console.log(PR,`ensuring DIR ${PATH.dirname(filePath)}`);
          FS.ensureDirSync(PATH.dirname( filePath ));
          if (DBG) console.log(PR,`writing file ${filePath}`);
          FS.writeFileSync( filePath, json );
          console.log(PR, `*** WROTE JSON DATABASE ${filePath}`);
        } else {
          console.log(PR,`ERR path ${filePath} must be a pathname`);
        }
      }
    }
  );
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ DEPRECATED.  Replaced by WriteTemplateTOML
    called by brunch to generate an up-to-date Template file to path.
    creates the path if it doesn't exist
/*/
DB.WriteTemplateJSON = function (filePath) {
  let templatePath = RUNTIMEPATH + NC_CONFIG.dataset + ".template";
  FS.ensureDirSync(PATH.dirname(templatePath));
  // Does the template exist?
  if (!FS.existsSync(templatePath)) {
    console.error(PR, `ERR could not find template ${templatePath}`);
  } else {
    FS.copySync(templatePath, filePath);
    console.log(PR, `*** COPIED TEMPLATE ${templatePath} to ${filePath}`);
  }
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ called by Template Editor and DB.WriteTemplateTOML
/*/
function m_GetTemplateTOMLFileName() {
  return NC_CONFIG.dataset + TEMPLATE_EXT;
}
function m_GetTemplateTOMLFilePath() {
  return RUNTIMEPATH + m_GetTemplateTOMLFileName();
}
DB.GetTemplateTOMLFileName = () => {
  return { filename: m_GetTemplateTOMLFileName() };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ called by Template Editor to save TOML template changes to disk.
    parm {object} pkt.data.template
    Loads the template after saving!
/*/
DB.WriteTemplateTOML = (pkt) => {
  const templateFilePath = m_GetTemplateTOMLFilePath();
  FS.ensureDirSync(PATH.dirname(templateFilePath));
  // Does the template exist?  If so, rename the old version with curren timestamp.
  if (FS.existsSync(templateFilePath)) {
    const timestamp = new Date().toISOString()
      .replace(/:/g, '.');
    const backupFilePath = RUNTIMEPATH + NC_CONFIG.dataset + '_' + timestamp + TEMPLATE_EXT;
    FS.copySync(templateFilePath, backupFilePath);
    console.log(PR, 'Backed up template to', backupFilePath);
  }
  const toml = TOML.stringify(pkt.data.template);
  return FS.outputFile(templateFilePath, toml)
    .then(data => {
      console.log(PR, 'Saved template to', templateFilePath)
      // reload template
      m_LoadTemplate();
      return { OK: true, info: templateFilePath }
    })
    .catch(err => {
      console.log(PR, 'Failed trying to save', templateFilePath, err);
      return { OK: false, info: 'Failed trying to save', templateFilePath }
    });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Clones the existing toml template
    called by brunch to generate an up-to-date Template file to path
    for standalone mode.
    creates the path if it doesn't exist
/*/
DB.CloneTemplateTOML = function (filePath) {
  const TOMLtemplateFilePath = m_GetTemplateTOMLFilePath();
  FS.ensureDirSync(PATH.dirname(TOMLtemplateFilePath));
  // Does the template exist?
  if (!FS.existsSync(TOMLtemplateFilePath)) {
    console.error(PR, `ERR could not find template ${TOMLtemplateFilePath}`);
  } else {
    FS.copySync(TOMLtemplateFilePath, filePath);
    console.log(PR, `*** COPIED TEMPLATE ${TOMLtemplateFilePath} to ${filePath}`);
  }
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ OPENEDITORS

    Used to coordinate Template editing vs Node/Edge editing.  Since Nodes and
    Edges should not be edited while the Template is being edited, any editor
    that is opened registers as an OPENEDITOR and will check on the status of
    existing open editors.

    * When a Template editor is open, "Node Edit", "Edge Edit", and "Add New Edge"
      buttons are all disabled.
    * When "Node Edit", "Edge Edit", or "Add New Edge" has been triggered,
      the Template buttons on the Template panel are all disabled.

    m_open_editors is an array of all the editors (node, edge, template) that are
    currently open.  Used to coordinate template vs node/edge editing
    because nodes and edges should not be edited while the template
    is being edited.
/*/
const EDITOR = { TEMPLATE: 'template', NONTEMPLATE: 'nonTemplate' };

function GetEditStatus() {
  // If there are any 'node' or 'edge' open editors, then request fails: template cannot be locked
  // If there are any 'template' open editors, then request fails: template cannot be locked
  const templateBeingEdited = m_open_editors.length === 1 && m_open_editors.includes( EDITOR.TEMPLATE );
  const nodeOrEdgeBeingEdited = m_open_editors.length > 0 && !m_open_editors.includes( EDITOR.TEMPLATE );
  return { templateBeingEdited, nodeOrEdgeBeingEdited };
}

/**
 * @returns { temtemplateBeingEditedplate: boolean, nodeOrEdgeBeingEdited: boolean }
 */
DB.GetTemplateEditState = pkt => {
  // return { isBeingEdited: GetTemplateIsBeingEdited() };
  return GetEditStatus();
}
/**
 * Requester is always the Template editor.
 * @returns { okToEdit: boolean }
 */
DB.RequestTemplateEdit = () => {
  console.log(PR,'RequestTemplateEdit', m_open_editors)
  const okToEdit = m_open_editors.length < 1; // okToEdit only if no node/edge/template is open
  // return edit state
  if (okToEdit) m_open_editors.push(EDITOR.TEMPLATE);
  return { okToEdit };
}
/**
 * Requester is always the Template editor
 * @param {Object} pkt
 * @returns { temtemplateBeingEditedplate: boolean, nodeOrEdgeBeingEdited: boolean }
 */
DB.ReleaseTemplateEdit = pkt => {
  const i = m_open_editors.findIndex(e => e === EDITOR.TEMPLATE);
  if (i > -1) m_open_editors.splice(i, 1);
  return GetEditStatus();
}
/**
 * Requester is always node or edge editor
 * @param {Object} pkt
 * @param {string} pkt.editor - 'node' or 'edge'
 * @returns { templateBeingEdited: boolean, nodeOrEdgeBeingEdited: boolean }
 */
DB.RequestTemplateLock = pkt => {
  console.log(PR,'RequestTemplateLock', pkt)
  m_open_editors.push(pkt.Data().editor);
  return GetEditStatus();
}
/**
 * @returns { templateBeingEdited: boolean, nodeOrEdgeBeingEdited: boolean }
 */
DB.ReleaseTemplateLock = pkt => {
  const i = m_open_editors.findIndex(e => e === pkt.Data().editor);
  if (i > -1) m_open_editors.splice(i, 1);
  return GetEditStatus();
}

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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// utility function for getting a valid file path
function m_GetValidDBFilePath(dataset) {
  // validate dataset name
  let regex = /^([A-z0-9-_+./])*$/; // Allow _ - + . /, so nested pathways are allowed
  if (!regex.test(dataset)) {
    console.error(PR, `Trying to initialize database with bad dataset name: ${dataset}`);
  }

  return RUNTIMEPATH + dataset + ".loki";
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
module.exports = DB;
