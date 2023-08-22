/* eslint-disable newline-per-chained-call */
/* eslint-disable nonblock-statement-body-position */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

DATABASE SERVER

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const Loki = require('lokijs');
const PATH = require('path');
const FS = require('fs-extra');
const TOML = require('@iarna/toml');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const SESSION = require('./common-session');
const LOGGER = require('./server-logger');
const PROMPTS = require('../system/util/prompts');
const TEMPLATE_SCHEMA = require('../view/netcreate/template-schema');
const FILTER = require('../view/netcreate/components/filter/FilterEnums');
const { EDITORTYPE } = require('../system/util/enum');

const PR = PROMPTS.Pad('ServerDB');
const RUNTIMEPATH = './runtime/';
const TEMPLATEPATH = './app-templates/';
const TEMPLATE_EXT = '.template.toml';
const BACKUPPATH = 'backups/'; // combined with RUNTIMEPATH, so no leading './'
const DB_CLONEMASTER = 'blank.loki';
const NC_CONFIG = require('../../app-config/netcreate-config');

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
let db_file;
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
/*/ Backup Database File Utility
    Used by PKT_MergeDatabase to clone the db before importing.
    Saves the db in the runtime folder with a timestamp suffix.
/*/
function m_BackupDatabase() {
  FS.ensureDirSync(PATH.dirname(db_file));
  if (FS.existsSync(db_file)) {
    const timestamp = new Date().toISOString().replace(/:/g, '.');
    const backupDBFilePath = m_GetValidDBFilePath(
      BACKUPPATH + NC_CONFIG.dataset + '_' + timestamp
    );
    console.log(PR, 'Saving database backup to', backupDBFilePath);
    FS.copySync(db_file, backupDBFilePath);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Default Template Path
/*/
function m_DefaultTemplatePath() {
  return TEMPLATEPATH + '_default' + TEMPLATE_EXT;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Initialize the database
/*/
DB.InitializeDatabase = function (options = {}) {
  let dataset = NC_CONFIG.dataset;
  db_file = m_GetValidDBFilePath(dataset);
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
    autosaveInterval: 4000 // save every four seconds
  };
  ropt = Object.assign(ropt, options);
  m_db = new Loki(db_file, ropt);
  m_options = ropt;
  m_options.db_file = db_file; // store for use by DB.WriteJSON

  // callback on load
  async function f_DatabaseInitialize() {
    // on the first load of (non-existent database), we will have no
    // collections so we can detect the absence of our collections and
    // add (and configure) them now.
    NODES = m_db.getCollection('nodes');
    if (NODES === null) NODES = m_db.addCollection('nodes');
    m_locked_nodes = new Map();
    EDGES = m_db.getCollection('edges');
    if (EDGES === null) EDGES = m_db.addCollection('edges');
    m_locked_edges = new Map();

    // initialize unique set manager
    m_dupe_set = new Set();
    let dupeNodes = [];

    // find highest NODE ID
    if (NODES.count() > 0) {
      m_max_nodeID = NODES.mapReduce(
        obj => {
          // side-effect: make sure ids are numbers
          m_CleanObjID('node.id', obj);
          // side-effect: check for duplicate ids
          if (m_dupe_set.has(obj.id)) {
            dupeNodes.push(obj);
          } else {
            m_dupe_set.add(obj.id);
          }
          // return value
          return obj.id;
        },
        arr => {
          return Math.max(...arr);
        }
      );
    } else {
      m_max_nodeID = 0;
    }
    // remap duplicate NODE IDs
    dupeNodes.forEach(obj => {
      m_max_nodeID += 1;
      LOGGER.Write(PR, `# rewriting duplicate nodeID ${obj.id} to ${m_max_nodeID}`);
      obj.id = m_max_nodeID;
    });

    // find highest EDGE ID
    if (EDGES.count() > 0) {
      m_max_edgeID = EDGES.mapReduce(
        obj => {
          m_CleanObjID('edge.id', obj);
          m_CleanEdgeEndpoints(obj.id, obj);
          return obj.id;
        },
        arr => {
          return Math.max(...arr);
        }
      ); // end mapReduce edge ids
    } else {
      m_max_edgeID = 0;
    }
    console.log(
      PR,
      `DATABASE LOADED! m_max_nodeID '${m_max_nodeID}', m_max_edgeID '${m_max_edgeID}'`
    );
    m_db.saveDatabase();

    await m_LoadTemplate();
    m_MigrateTemplate();
    m_ValidateTemplate();
  } // end f_DatabaseInitialize

  // UTILITY FUNCTION
  function f_AutosaveStatus() {
    let nodeCount = NODES.count();
    let edgeCount = EDGES.count();
    console.log(PR, `AUTOSAVING! ${nodeCount} NODES / ${edgeCount} EDGES <3`);
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
    hideDeleteNodeButton:
      (jt.nodePrompts && jt.nodePrompts.delete && jt.nodePrompts.delete.hidden) ||
      SCHEMA.hideDeleteNodeButton.default,
    allowLoggedInUserToImport: SCHEMA.allowLoggedInUserToImport.default, // new parameter not in old json template
    duplicateWarning:
      (jt.nodePrompts &&
        jt.nodePrompts.label &&
        jt.nodePrompts.label.duplicateWarning) ||
      SCHEMA.duplicateWarning.default,
    nodeIsLockedMessage:
      (jt.nodePrompts &&
        jt.nodePrompts.label &&
        jt.nodePrompts.label.sourceNodeIsLockedMessage) ||
      SCHEMA.nodeIsLockedMessage.default,
    edgeIsLockedMessage:
      (jt.edgePrompts && jt.edgePrompts.edgeIsLockedMessage) ||
      SCHEMA.edgeIsLockedMessage.default,
    templateIsLockedMessage: SCHEMA.templateIsLockedMessage.default,
    nodeDefaultTransparency:
      (jt.nodePrompts && jt.nodePrompts.defaultTransparency) ||
      SCHEMA.nodeDefaultTransparency.default,
    edgeDefaultTransparency:
      (jt.edgePrompts && jt.edgePrompts.defaultTransparency) ||
      SCHEMA.edgeDefaultTransparency.default,
    searchColor: jt.searchColor || SCHEMA.searchColor.default,
    sourceColor: jt.sourceColor || SCHEMA.sourceColor.default,
    citation: {
      text: (jt.citationPrompts && jt.citationPrompts.citation) || jt.name,
      hidden:
        (jt.citationPrompts && jt.citationPrompts.hidden) ||
        SCHEMA.citation.properties.hidden.default
    }
  };
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
    };
    if (k === 'type') {
      // special handling for type options
      const options = field.options.map(o => {
        return {
          label: o.label,
          color: o.color
        };
      });
      // make sure field type is set to "select" -- older templates do not set type
      nodeDefs[k].type = 'select';
      console.log(
        PR,
        '...migrating nodeDefs field',
        k,
        'with options, forcing type to "select"'
      );
      nodeDefs[k].options = options;
    }
  });
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
  };
  nodeDefs.created = {
    displayLabel: 'Created',
    exportLabel: 'Created',
    help: 'Date and time node was created',
    includeInGraphTooltip: true // default to show tool tip
  };

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
    };
    if (k === 'type') {
      // special handling for type options
      const options = field.options.map(o => {
        return {
          label: o.label,
          color: o.color
        };
      });
      // make sure field type is set to "select" -- older templates do not set type
      edgeDefs[k].type = 'select';
      console.log(
        PR,
        '...migrating edgeDefs field',
        k,
        'with options, forcing type to "select"'
      );
      edgeDefs[k].options = options;
    }
  });
  // 2. Add id
  edgeDefs.id = {
    // will clobber any existing id
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
  if (DBG) console.log(PR, 'Imported TOML TEMPLATE', TOMLtemplate);

  return TOMLtemplate;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Loads an original circa version 1.3 JSON template
    and converts it to a TOML template
/*/
function m_LoadJSONTemplate(templatePath) {
  return new Promise((resolve, reject) => {
    // 1. Load JSON
    console.log(PR, `LOADING JSON TEMPLATE ${templatePath}`);
    const JSONTEMPLATE = FS.readJsonSync(templatePath);
    // 2. Convert to TOML
    TEMPLATE = m_MigrateJSONtoTOML(JSONTEMPLATE);
    // 3. Save it (and load)
    DB.WriteTemplateTOML({ data: { template: TEMPLATE } }).then(() => {
      console.log(PR, '...converted JSON template saved!');
      resolve({ Loaded: true });
    });
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Loads a *.template.toml file from the server.
/*/
function m_LoadTOMLTemplate(templateFilePath) {
  return new Promise((resolve, reject) => {
    const templateFile = FS.readFile(templateFilePath, 'utf8', (err, data) => {
      if (err) throw err;
      // Read TOML
      const json = TOML.parse(data);
      // Ensure key fields are present, else default to schema
      const SCHEMA = TEMPLATE_SCHEMA.TEMPLATE.properties;
      json.duplicateWarning =
        json.duplicateWarning || SCHEMA.duplicateWarning.default;
      json.nodeIsLockedMessage =
        json.nodeIsLockedMessage || SCHEMA.nodeIsLockedMessage.default;
      json.edgeIsLockedMessage =
        json.edgeIsLockedMessage || SCHEMA.edgeIsLockedMessage.default;
      json.templateIsLockedMessage =
        json.templateIsLockedMessage || SCHEMA.templateIsLockedMessage.default;
      json.importIsLockedMessage =
        json.importIsLockedMessage || SCHEMA.importIsLockedMessage.default;

      // Migrate v1.4 to v2.0
      // v2.0 added `provenance` and `comments` -- so we add the template definitions if the toml template does not already have them
      // hides them by default if they were not previously added
      // HACK: There is related migration code in m_MigrateTemplate() that needs to be merged...if possible

      const DEFAULT_TEMPLATE = TEMPLATE_SCHEMA.ParseTemplateSchema();
      const NODEDEFS = DEFAULT_TEMPLATE.nodeDefs;
      if (json.nodeDefs.provenance === undefined) {
        json.nodeDefs.provenance = NODEDEFS.provenance;
        json.nodeDefs.provenance.hidden = true;
      }
      if (json.nodeDefs.comments === undefined) {
        json.nodeDefs.comments = NODEDEFS.comments;
        json.nodeDefs.comments.hidden = true;
      }
      const EDGEDEFS = DEFAULT_TEMPLATE.edgeDefs;
      if (json.edgeDefs.provenance === undefined) {
        json.edgeDefs.provenance = EDGEDEFS.provenance;
        json.edgeDefs.provenance.hidden = true;
      }
      if (json.edgeDefs.comments === undefined) {
        json.edgeDefs.comments = EDGEDEFS.comments;
        json.edgeDefs.comments.hidden = true;
      }
      if (json.edgeDefs.weight === undefined) {
        json.edgeDefs.weight = EDGEDEFS.weight;
        json.edgeDefs.weight.hidden = true;
      }
      // NOTE: We are not modifying the template permanently, only temporarily inserting definitions so the system can validate

      TEMPLATE = json;
      console.log(PR, 'TEMPLATE LOADED', templateFilePath);

      resolve({ Loaded: true });
    });
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
async function m_LoadTemplate() {
  const TOMLtemplateFilePath = m_GetTemplateTOMLFilePath();
  FS.ensureDirSync(PATH.dirname(TOMLtemplateFilePath));
  // Does the TOML template exist?
  if (FS.existsSync(TOMLtemplateFilePath)) {
    // 1. If TOML exists, load it
    await m_LoadTOMLTemplate(TOMLtemplateFilePath);
  } else {
    // 2/ Try falling back to JSON template
    const JSONTemplatePath = RUNTIMEPATH + NC_CONFIG.dataset + '.template';
    // Does the JSON template exist?
    if (FS.existsSync(JSONTemplatePath)) {
      await m_LoadJSONTemplate(JSONTemplatePath);
    } else {
      // 3. Else, no existing template, clone _default.template.toml
      console.log(
        PR,
        `NO EXISTING TEMPLATE ${TOMLtemplateFilePath}, so cloning default template...`
      );
      FS.copySync(m_DefaultTemplatePath(), TOMLtemplateFilePath);
      // then load it
      await m_LoadTOMLTemplate(TOMLtemplateFilePath);
    }
  }
}

/// REVIEW: Should this be moved to a separate server-template module?
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Migrate Template File
    Updates older templates to the current template-schema specification by
    inserting missing properties needed by the UI.
    Any changes to template-schema should be reflected here.

    FIXME: There is code in m_LoadTOMLTemplate() that also does migration that
    needs to be moved here!
/*/
function m_MigrateTemplate() {
  // 2023-0628 BASE Defaults -- these should have been previously defined
  if (TEMPLATE.searchColor === undefined)
    TEMPLATE.searchColor = TEMPLATE_SCHEMA.TEMPLATE.properties.searchColor.default;
  if (TEMPLATE.sourceColor === undefined)
    TEMPLATE.sourceColor = TEMPLATE_SCHEMA.TEMPLATE.properties.sourceColor.default;
  // 2023-0602 Filter Labels
  // See branch `dev-bl/template-filter-labels`, and fb28fa68ee42deffc778c1be013acea7dae85258
  if (TEMPLATE.filterFade === undefined)
    TEMPLATE.filterFade = TEMPLATE_SCHEMA.TEMPLATE.properties.filterFade.default;
  if (TEMPLATE.filterReduce === undefined)
    TEMPLATE.filterReduce = TEMPLATE_SCHEMA.TEMPLATE.properties.filterReduce.default;
  if (TEMPLATE.filterFocus === undefined)
    TEMPLATE.filterFocus = TEMPLATE_SCHEMA.TEMPLATE.properties.filterFocus.default;
  if (TEMPLATE.filterFadeHelp === undefined)
    TEMPLATE.filterFadeHelp =
      TEMPLATE_SCHEMA.TEMPLATE.properties.filterFadeHelp.default;
  if (TEMPLATE.filterReduceHelp === undefined)
    TEMPLATE.filterReduceHelp =
      TEMPLATE_SCHEMA.TEMPLATE.properties.filterReduceHelp.default;
  if (TEMPLATE.filterFocusHelp === undefined)
    TEMPLATE.filterFocusHelp =
      TEMPLATE_SCHEMA.TEMPLATE.properties.filterFocusHelp.default;
  // 2023-0605 Max Sizes
  // See branch `dev-bl/max-size
  if (TEMPLATE.nodeSizeDefault === undefined)
    TEMPLATE.nodeSizeDefault =
      TEMPLATE_SCHEMA.TEMPLATE.properties.nodeSizeDefault.default;
  if (TEMPLATE.nodeSizeMax === undefined)
    TEMPLATE.nodeSizeMax = TEMPLATE_SCHEMA.TEMPLATE.properties.nodeSizeMax.default;
  if (TEMPLATE.edgeSizeDefault === undefined)
    TEMPLATE.edgeSizeDefault =
      TEMPLATE_SCHEMA.TEMPLATE.properties.edgeSizeDefault.default;
  if (TEMPLATE.edgeSizeMax === undefined)
    TEMPLATE.edgeSizeMax = TEMPLATE_SCHEMA.TEMPLATE.properties.edgeSizeMax.default;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Validate Template File
    Lazy check of template object definitions to make sure they are of
    expected types and values so the UI doesn't choke and die. Throws an error
    if property is missing.
/*/
// eslint-disable-next-line complexity
function m_ValidateTemplate() {
  try {
    // nodeDefs
    let nodeDefs = TEMPLATE.nodeDefs;
    if (nodeDefs === undefined) {
      throw 'Missing `nodeDefs` nodeDefs=' + nodeDefs;
    }
    if (nodeDefs.label === undefined)
      throw 'Missing `nodeDefs.label` label=' + nodeDefs.label;
    if (nodeDefs.type === undefined)
      throw 'Missing `nodeDefs.type` type= ' + nodeDefs.type;
    if (
      nodeDefs.type.options === undefined ||
      !Array.isArray(nodeDefs.type.options)
    ) {
      throw 'Missing or bad `nodeDefs.type.options` options=' + nodeDefs.type.options;
    }
    if (nodeDefs.notes === undefined)
      throw 'Missing `nodeDefs.notes` notes=' + nodeDefs.notes;
    if (nodeDefs.info === undefined)
      throw 'Missing `nodeDefs.info` info=' + nodeDefs.info;
    // Version 2.x Fields
    if (nodeDefs.provenance === undefined)
      throw 'Missing `nodeDefs.provenance` provenance=' + nodeDefs.provenance;
    if (nodeDefs.comments === undefined)
      throw 'Missing `nodeDefs.comments` comments=' + nodeDefs.comments;

    // edgeDefs
    let edgeDefs = TEMPLATE.edgeDefs;
    if (edgeDefs === undefined) throw 'Missing `edgeDefs` edgeDefs=' + edgeDefs;
    if (edgeDefs.source === undefined)
      throw 'Missing `edgeDefs.source` source=' + edgeDefs.source;
    if (edgeDefs.type === undefined)
      throw 'Missing `edgeDefs.type` type= ' + edgeDefs.type;
    if (
      edgeDefs.type.options === undefined ||
      !Array.isArray(edgeDefs.type.options)
    ) {
      throw 'Missing or bad `edgeDefs.type.options` options=' + edgeDefs.type.options;
    }
    if (edgeDefs.target === undefined)
      throw 'Missing `edgeDefs.target` label=' + edgeDefs.target;
    if (edgeDefs.notes === undefined)
      throw 'Missing `edgeDefs.notes` notes=' + edgeDefs.notes;
    if (edgeDefs.info === undefined)
      throw 'Missing `edgeDefs.info` info=' + edgeDefs.info;
    // Version 2.x Fields
    if (edgeDefs.provenance === undefined)
      throw 'Missing `edgeDefs.provenance` provenance=' + edgeDefs.provenance;
    if (edgeDefs.comments === undefined)
      throw 'Missing `edgeDefs.comments` comments=' + edgeDefs.comments;
    // -- End 2.x
    if (edgeDefs.citation === undefined)
      throw 'Missing `edgeDefs.citation` info=' + edgeDefs.citation;
    if (edgeDefs.category === undefined)
      throw 'Missing `edgeDefs.category` info=' + edgeDefs.category;
  } catch (error) {
    const templateFileName = m_GetTemplateTOMLFilePath();
    console.error('Error loading template `', templateFileName, '`::::', error);
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: load database
    note: InitializeDatabase() was already called on system initialization
    to populate the NODES and EDGES structures.
/*/
DB.PKT_GetDatabase = function (pkt) {
  let nodes = NODES.chain().data({ removeMeta: false });
  let edges = EDGES.chain().data({ removeMeta: false });
  if (DBG)
    console.log(
      PR,
      `PKT_GetDatabase ${pkt.Info()} (loaded ${nodes.length} nodes, ${
        edges.length
      } edges)`
    );
  m_MigrateNodes(nodes);
  m_MigrateEdges(edges);
  LOGGER.Write(pkt.Info(), `getdatabase`);
  return { d3data: { nodes, edges }, template: TEMPLATE };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: reset database from scratch
/*/
DB.PKT_SetDatabase = function (pkt) {
  if (DBG) console.log(PR, `PKT_SetDatabase`);
  let { nodes = [], edges = [] } = pkt.Data();
  if (!nodes.length) console.log(PR, 'WARNING: empty nodes array');
  else console.log(PR, `setting ${nodes.length} nodes...`);
  if (!edges.length) console.log(PR, 'WARNING: empty edges array');
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
  if (!nodes.length) console.log(PR, 'WARNING: empty nodes array');
  else console.log(PR, `setting ${nodes.length} nodes...`);
  if (!edges.length) console.log(PR, 'WARNING: empty edges array');
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
  if (DBG) console.log(PR, `PKT_MergeDatabase`);
  let { nodes = [], edges = [] } = pkt.Data();

  // Save Backup First!
  m_BackupDatabase();

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

  return new Promise((resolve, reject) =>
    m_db.saveDatabase(err => {
      if (err) reject(new Error('rejected'));
      DB.InitializeDatabase();
      LOGGER.Write(pkt.Info(), `mergedatabase`);
      resolve({ OK: true });
    })
  );
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Update all data in existing database.
    Used to update node/edge types after template edit
/*/
DB.PKT_UpdateDatabase = function (pkt) {
  if (DBG) console.log(PR, `PKT_UpdateDatabase`);
  let { nodes = [], edges = [] } = pkt.Data();
  if (!nodes.length) console.log(PR, 'WARNING: empty nodes array');
  else console.log(PR, `updating ${nodes.length} nodes...`);
  if (!edges.length) console.log(PR, 'WARNING: empty edges array');
  else console.log(PR, `updating ${edges.length} edges...`);
  NODES.update(nodes);
  EDGES.update(edges);
  console.log(PR, `PKT_UpdateDatabase complete. Disk db file updated.`);
  m_db.saveDatabase();
  LOGGER.Write(pkt.Info(), `updatedatabase`);
  return { OK: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Side Effect: Changes `m_max_nodeID`
function m_CalculateMaxNodeID() {
  if (NODES.count() > 0) {
    m_max_nodeID = NODES.mapReduce(
      obj => obj.id,
      arr => Math.max(...arr)
    );
  } else {
    m_max_nodeID = 0;
  }
  return m_max_nodeID;
}
DB.PKT_CalculateMaxNodeID = function (pkt) {
  if (DBG) console.log(PR, `PKT_CalculateMaxNodeID ${pkt.Info()}`);
  return { maxNodeID: m_CalculateMaxNodeID() };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetNewNodeID() {
  m_max_nodeID += 1;
  return m_max_nodeID;
}
DB.PKT_GetNewNodeID = function (pkt) {
  if (DBG) console.log(PR, `PKT_GetNewNodeID ${pkt.Info()} nodeID ${m_max_nodeID}`);
  return { nodeID: m_GetNewNodeID() };
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
function m_CalculateMaxEdgeID() {
  if (EDGES.count() > 0) {
    m_max_edgeID = EDGES.mapReduce(
      obj => obj.id,
      arr => Math.max(...arr)
    );
  } else {
    m_max_edgeID = 0;
  }
  return m_max_edgeID;
}
DB.PKT_CalculateMaxEdgeID = function (pkt) {
  if (DBG) console.log(PR, `PKT_CalculateMaxEdgeID ${pkt.Info()}`);
  return { maxEdgeID: m_CalculateMaxEdgeID() };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetNewEdgeID() {
  m_max_edgeID += 1;
  return m_max_edgeID;
}
DB.PKT_GetNewEdgeID = function (pkt) {
  if (DBG) console.log(PR, `PKT_GetNewEdgeID ${pkt.Info()} edgeID ${m_max_edgeID}`);
  return { edgeID: m_GetNewEdgeID() };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_GetNewEdgeIDs = function (pkt) {
  const count = Number(pkt.Data().count);
  const firstId = m_max_edgeID + 1;
  const edgeIDs = [];
  for (let i = 0; i < count; i++) edgeIDs.push(firstId + i);
  m_max_edgeID += count;
  if (DBG) console.log(PR, `PKT_GetNewEdgeIDs ${pkt.Info()} edgeIDs ${edgeIDs}`);
  return { edgeIDs };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestLockNode = function (pkt) {
  let { nodeID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  let errcode = m_IsInvalidNode(nodeID);
  if (errcode) return errcode;
  // check if node is already locked
  if (m_locked_nodes.has(nodeID))
    return m_MakeLockError(`nodeID ${nodeID} is already locked`);
  // SUCCESS
  // single matching node exists and is not yet locked, so lock it
  m_locked_nodes.set(nodeID, uaddr);
  return { nodeID, locked: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestUnlockNode = function (pkt) {
  let { nodeID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  let errcode = m_IsInvalidNode(nodeID);
  if (errcode) return errcode;
  // check that node is already locked
  if (m_locked_nodes.has(nodeID)) {
    m_locked_nodes.delete(nodeID);
    return { nodeID, unlocked: true };
  }
  // this is an error because nodeID wasn't in the lock table
  return m_MakeLockError(`nodeID ${nodeID} was not locked so can't unlock`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_IsNodeLocked = function (pkt) {
  let { nodeID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  let errcode = m_IsInvalidNode(nodeID);
  if (errcode) return errcode;
  const isLocked = m_locked_nodes.has(nodeID);
  return { nodeID, locked: isLocked };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_IsInvalidNode(nodeID) {
  if (!nodeID) return m_MakeLockError(`undefined nodeID`);
  nodeID = Number.parseInt(nodeID, 10);
  if (isNaN(nodeID)) return m_MakeLockError(`nodeID was not a number`);
  if (nodeID < 0) return m_MakeLockError(`nodeID ${nodeID} must be positive integer`);
  if (nodeID > m_max_nodeID)
    return m_MakeLockError(`nodeID ${nodeID} is out of range`);
  // find if the node exists
  let matches = NODES.find({ id: nodeID });
  if (matches.length === 0) return m_MakeLockError(`nodeID ${nodeID} not found`);
  if (matches.length > 1)
    return m_MakeLockError(
      `nodeID ${nodeID} matches multiple entries...critical error!`
    );
  // no retval is no error!
  return undefined;
}
function m_MakeLockError(info) {
  return { NOP: `ERR`, INFO: info };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestLockEdge = function (pkt) {
  let { edgeID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  let errcode = m_IsInvalidEdge(edgeID);
  if (errcode) return errcode;
  // check if edge is already locked
  if (m_locked_edges.has(edgeID))
    return m_MakeLockError(`edgeID ${edgeID} is already locked`);
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
DB.PKT_IsEdgeLocked = function (pkt) {
  let { edgeID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  let errcode = m_IsInvalidEdge(edgeID);
  if (errcode) return errcode;
  const isLocked = m_locked_edges.has(edgeID);
  return { edgeID, locked: isLocked };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_IsInvalidEdge(edgeID) {
  if (!edgeID) return m_MakeLockError(`undefined edgeID`);
  edgeID = Number.parseInt(edgeID, 10);
  if (isNaN(edgeID)) return m_MakeLockError(`edgeID was not a number`);
  if (edgeID < 0) return m_MakeLockError(`edgeID ${edgeID} must be positive integer`);
  if (edgeID > m_max_edgeID)
    return m_MakeLockError(`edgeID ${edgeID} is out of range`);
  // find if the node exists
  let matches = EDGES.find({ id: edgeID });
  if (matches.length === 0) return m_MakeLockError(`edgeID ${edgeID} not found`);
  if (matches.length > 1)
    return m_MakeLockError(
      `edgeID ${edgeID} matches multiple entries...critical error!`
    );
  // no retval is no error!
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestUnlockAllNodes = function (pkt) {
  m_locked_nodes = new Map();
  return { unlocked: true };
};
DB.PKT_RequestUnlockAllEdges = function (pkt) {
  m_locked_edges = new Map();
  return { unlocked: true };
};
DB.PKT_RequestUnlockAll = function (pkt) {
  m_locked_nodes = new Map();
  m_locked_edges = new Map();
  m_open_editors = [];
  return { unlocked: true };
};
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
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// eslint-disable-next-line complexity
DB.PKT_Update = function (pkt) {
  let { node, edge, nodeID, replacementNodeID, edgeID } = pkt.Data();
  let retval = {};
  // PROCESS NODE INSERT/UPDATE
  if (node) {
    m_CleanObjID(`${pkt.Info()} node.id`, node);
    let matches = NODES.find({ id: node.id });
    if (matches.length === 0) {
      // if there was no node, then this is an insert new operation
      if (DBG)
        console.log(
          PR,
          `PKT_Update ${pkt.Info()} INSERT nodeID ${JSON.stringify(node)}`
        );

      // Handle different id types
      if (isNaN(node.id)) {
        // If the node id has NOT been defined, generate a new node id
        node.id = m_GetNewNodeID();
      }

      LOGGER.Write(pkt.Info(), `insert node`, node.id, JSON.stringify(node));
      DB.AppendNodeLog(node, pkt); // log GroupId to node stored in database
      NODES.insert(node);
      // Return the updated record -- needed to update metadata
      let updatedNode = NODES.findOne({ id: node.id });
      if (!updatedNode)
        console.log(
          PR,
          `PKT_Update ${pkt.Info()} could not find node after update!  This should not happen! ${
            node.id
          } ${JSON.stringify(node)}`
        );
      retval = { op: 'insert', node: updatedNode };
    } else if (matches.length === 1) {
      // there was one match to update
      NODES.findAndUpdate({ id: node.id }, n => {
        if (DBG)
          console.log(
            PR,
            `PKT_Update ${pkt.Info()} UPDATE nodeID ${node.id} ${JSON.stringify(
              node
            )}`
          );
        LOGGER.Write(pkt.Info(), `update node`, node.id, JSON.stringify(node));
        DB.AppendNodeLog(n, pkt); // log GroupId to node stored in database
        Object.assign(n, node);
      });
      // Return the updated record -- needed to update metadata
      let updatedNode = NODES.findOne({ id: node.id });
      if (!updatedNode)
        console.log(
          PR,
          `PKT_Update ${pkt.Info()} could not find node after update!  This should not happen! ${
            node.id
          } ${JSON.stringify(node)}`
        );
      retval = { op: 'update', node: updatedNode };
    } else {
      if (DBG)
        console.log(PR, `WARNING: multiple nodeID ${node.id} x${matches.length}`);
      LOGGER.Write(pkt.Info(), `ERROR`, node.id, 'duplicate node id');
      retval = { op: 'error-multinodeid' };
    }
    // Always update m_max_nodeID
    m_CalculateMaxNodeID();
    return retval;
  } // if node

  // PROCESS EDGE INSERT/UPDATE
  if (edge) {
    m_CleanObjID(`${pkt.Info()} edge.id`, edge);
    let matches = EDGES.find({ id: edge.id });
    if (matches.length === 0) {
      // this is a new edge
      if (DBG)
        console.log(
          PR,
          `PKT_Update ${pkt.Info()} INSERT edgeID ${edge.id} ${JSON.stringify(edge)}`
        );

      // Handle different id types
      if (isNaN(edge.id)) {
        // If the edge id has NOT been defined, generate a new edge id
        edge.id = m_GetNewEdgeID();
      }

      LOGGER.Write(pkt.Info(), `insert edge`, edge.id, JSON.stringify(edge));
      DB.AppendEdgeLog(edge, pkt); // log GroupId to edge stored in database
      EDGES.insert(edge);
      // Return the updated record -- needed to update metadata
      let updatedEdge = EDGES.findOne({ id: edge.id });
      if (!updatedEdge)
        console.log(
          PR,
          `PKT_Update ${pkt.Info()} could not find node after update!  This should not happen! ${
            node.id
          } ${JSON.stringify(node)}`
        );
      retval = { op: 'insert', edge: updatedEdge };
    } else if (matches.length === 1) {
      // update this edge
      EDGES.findAndUpdate({ id: edge.id }, e => {
        if (DBG)
          console.log(
            PR,
            `PKT_Update ${pkt.SourceGroupID()} UPDATE edgeID ${
              edge.id
            } ${JSON.stringify(edge)}`
          );
        LOGGER.Write(pkt.Info(), `update edge`, edge.id, JSON.stringify(edge));
        DB.AppendEdgeLog(e, pkt); // log GroupId to edge stored in database
        Object.assign(e, edge);
      });
      // Return the updated record -- needed to update metadata
      let updatedEdge = EDGES.findOne({ id: edge.id });
      if (!updatedEdge)
        console.log(
          PR,
          `PKT_Update ${pkt.Info()} could not find node after update!  This should not happen! ${
            node.id
          } ${JSON.stringify(node)}`
        );
      retval = { op: 'update', edge: updatedEdge };
    } else {
      console.log(PR, `WARNING: multiple edgeID ${edge.id} x${matches.length}`);
      LOGGER.Write(pkt.Info(), `ERROR`, node.id, 'duplicate edge id');
      retval = { op: 'error-multiedgeid' };
    }
    // Always update m_max_edgeID
    m_CalculateMaxEdgeID();
    return retval;
  } // if edge

  // DELETE NODE
  if (nodeID !== undefined) {
    nodeID = m_CleanID(`${pkt.Info()} nodeID`, nodeID);
    if (DBG) console.log(PR, `PKT_Update ${pkt.Info()} DELETE nodeID ${nodeID}`);
    // Log first so it's apparent what is triggering the edge changes
    LOGGER.Write(pkt.Info(), `delete node`, nodeID);

    // handle edges
    let edgesToProcess = EDGES.where(e => {
      return e.source === nodeID || e.target === nodeID;
    });

    // handle linked nodes
    replacementNodeID = m_CleanID(
      `${pkt.Info()} replacementNodeID`,
      replacementNodeID
    );
    if (replacementNodeID !== -1) {
      // re-link edges to replacementNodeID...
      EDGES.findAndUpdate({ source: nodeID }, e => {
        LOGGER.Write(pkt.Info(), `relinking edge`, e.id, `to`, replacementNodeID);
        e.source = replacementNodeID;
      });
      EDGES.findAndUpdate({ target: nodeID }, e => {
        LOGGER.Write(pkt.Info(), `relinking edge`, e.id, `to`, replacementNodeID);
        e.target = replacementNodeID;
      });
    } else {
      // ... or delete edges completely
      let sourceEdges = EDGES.find({ source: nodeID });
      EDGES.findAndRemove({ source: nodeID });
      if (sourceEdges.length)
        LOGGER.Write(
          pkt.Info(),
          `deleting ${sourceEdges.length} sources matching ${nodeID}`
        );
      let targetEdges = EDGES.find({ target: nodeID });
      EDGES.findAndRemove({ target: nodeID });
      if (targetEdges.length)
        LOGGER.Write(
          pkt.Info(),
          `deleting ${targetEdges.length} targets matching ${nodeID}`
        );
    }
    // ...finally remove the node itself
    NODES.findAndRemove({ id: nodeID });
    return { op: 'delete', nodeID, replacementNodeID };
  }

  // DELETE EDGES
  if (edgeID !== undefined) {
    edgeID = m_CleanID(`${pkt.Info()} edgeID`, edgeID);
    if (DBG) console.log(PR, `PKT_Update ${pkt.Info()} DELETE edgeID ${edgeID}`);
    LOGGER.Write(pkt.Info(), `delete edge`, edgeID);
    EDGES.findAndRemove({ id: edgeID });
    return { op: 'delete', edgeID };
  }

  // return update value
  return { op: 'error-noaction' };
};

/// NODE ANNOTATION ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ write/remove packet SourceGroupID() information into the node before writing
    the first entry is the insert, subsequent operations are updates
/*/
DB.AppendNodeLog = function (node, pkt) {
  if (!node._nlog) node._nlog = [];
  let gid = pkt.SourceGroupID() || pkt.SourceAddress();
  node._nlog.push(gid);
  if (DBG) {
    let out = '';
    node._nlog.forEach(el => {
      out += `[${el}] `;
    });
    console.log(PR, 'nodelog', out);
  }
};
DB.FilterNodeLog = function (node) {
  let newNode = Object.assign({}, node);
  Reflect.deleteProperty(newNode, '_nlog');
  return newNode;
};
/// EDGE ANNOTATION ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ write/remove packet SourceGroupID() information into the node before writing
    the first entry is the insert, subsequent operations are updates
/*/
DB.AppendEdgeLog = function (edge, pkt) {
  if (!edge._elog) edge._elog = [];
  let gid = pkt.SourceGroupID() || pkt.SourceAddress();
  edge._elog.push(gid);
  if (DBG) {
    let out = '';
    edge._elog.forEach(el => {
      out += `[${el}] `;
    });
    console.log(PR, 'edgelog', out);
  }
};
DB.FilterEdgeLog = function (edge) {
  let newEdge = Object.assign({}, edge);
  Reflect.deleteProperty(newEdge, '_elog');
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
  db_file = m_options ? m_options.db_file : m_GetValidDBFilePath(dataset);
  let db = new Loki(db_file, {
    autoload: true,
    autoloadCallback: () => {
      if (typeof filePath === 'string') {
        if (DBG) console.log(PR, `writing { nodes, edges } to '${filePath}'`);
        let nodes = db.getCollection('nodes').chain().data({ removeMeta: false });
        let edges = db.getCollection('edges').chain().data({ removeMeta: false });
        let data = { nodes, edges };
        let json = JSON.stringify(data);
        if (DBG) console.log(PR, `ensuring DIR ${PATH.dirname(filePath)}`);
        FS.ensureDirSync(PATH.dirname(filePath));
        if (DBG) console.log(PR, `writing file ${filePath}`);
        FS.writeFileSync(filePath, json);
        console.log(PR, `*** WROTE JSON DATABASE ${filePath}`);
      } else {
        console.log(PR, `ERR path ${filePath} must be a pathname`);
      }
    }
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ DEPRECATED.  Replaced by WriteTemplateTOML
    called by brunch to generate an up-to-date Template file to path.
    creates the path if it doesn't exist
/*/
DB.WriteTemplateJSON = function (filePath) {
  let templatePath = RUNTIMEPATH + NC_CONFIG.dataset + '.template';
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
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ called by Template Editor to save TOML template changes to disk.
    parm {object} pkt.data.template
                  pkt.data.path      Will override the current template path in NC_CONFIG.dataset
                                     Use this to write to the _default template or
                                     other specific template.
    Loads the template after saving!
/*/
DB.WriteTemplateTOML = pkt => {
  if (pkt.data === undefined)
    throw 'DB.WriteTemplateTOML pkt received with no `data`';
  const templateFilePath = pkt.data.path || m_GetTemplateTOMLFilePath();
  FS.ensureDirSync(PATH.dirname(templateFilePath));
  // Does the template exist?  If so, rename the old version with curren timestamp.
  if (FS.existsSync(templateFilePath)) {
    const timestamp = new Date().toISOString().replace(/:/g, '.');
    const backupFilePath =
      RUNTIMEPATH + NC_CONFIG.dataset + '_' + timestamp + TEMPLATE_EXT;
    FS.copySync(templateFilePath, backupFilePath);
    console.log(PR, 'Backed up template to', backupFilePath);
  }
  const toml = TOML.stringify(pkt.data.template);
  return FS.outputFile(templateFilePath, toml)
    .then(data => {
      console.log(PR, 'Saved template to', templateFilePath);
      // reload template
      m_LoadTemplate();
      return { OK: true, info: templateFilePath };
    })
    .catch(err => {
      console.log(PR, 'Failed trying to save', templateFilePath, err);
      return { OK: false, info: 'Failed trying to save', templateFilePath };
    });
};
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
/*/ Regenerate Default Template from Template Schema
    Call this when `template-schema.js` changes so that _default.template.toml will
    match the schema defined in `template-schema.js`.
    Use JSCLI `ncRegenerateDefaultTemplate` in the dev console to call this.
/*/
DB.RegenerateDefaultTemplate = () => {
  const pkt = {
    data: {
      template: TEMPLATE_SCHEMA.ParseTemplateSchema(),
      path: m_DefaultTemplatePath()
    }
  };
  const toml = TOML.stringify(pkt.data.template);
  return DB.WriteTemplateTOML(pkt);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ OPENEDITORS

    Used to coordinate Template editing, Importing, and Node/Edge editing.
    They are mutually exclusive: if one is active, the others should be disabled
    to prevent overwriting data.

    Since Nodes and Edges should not be edited while the Template is being
    edited or data is being imported, any editor that is opened registers
    as an OPENEDITOR.  The UI will also pre-emptively disable edit buttons
    whenever the open editors have been updated via a broacast of the
    `EDIT_PERMISSIONS_UPDATE` message by server.js.

    * When a Template editor is open, "Import", "Node Edit", "Edge Edit",
      "Add New Node", and "Add New Edge" buttons are all disabled.
    * When an Import file has been successfully selected and validated,
      "Template", "Node Edit", "Edge Edit", "Add New Node", and
      "Add New Edge" buttons are disabled.
    * When "Node Edit", "Edge Edit", "Add New Node" or "Add New Edge" has
      been triggered, the Template buttons on the Template panel and the
      "Import" pane on the "More" panel are disabled.

    m_open_editors is an array of all the editors (node, edge, template,
    importer) that are currently open.

    Whenever a template is being edited, import is requested, or a node or
    edge is being edited:
    1. They will register with `RequestEditLock`.
    2. When they are finished, they will deregister using `ReleaseEditLock`.
    3. `GetEditStatus` returns the current state of `m_open_editors`.

    UI elements query `GetEditStatus` to figure out what they should
    enable or disable.

    UI elements should also listen to `EDIT_PERMISSIONS_UPDATE` to
    enable or disable elements.

    Note that multiple `node` and `edge` editors can be open at the same
    time and ALL must be closed before the lock is released.  We support
    this because each node or edge will have its own entry in m_open_editors,
    though we do not distinguish between the individual nodes/edges.

    Note that this is a different system from the instance-specific Node/Edge
    lock that locks out individual node/edge objects for editing used with
    `PKT_RequestLockNode` and `PKT_RequestLockEdge`.  m_open_editors focuses
    on categories of editor types rather than locking out individual nodes
    and edges to prevent others from editing the same node or edge.

/*/
/**
 * Returns object with flags indicating whether the template is being edited,
 * data is being imported, or node or edge are being edited
 * @returns {templateBeingEdited:boolean, importActive:boolean, nodeOrEdgeBeingEdited:boolean,
 *           lockedNodes:array, lockedEdges:array }
 */
DB.GetEditStatus = () => {
  // If there are any 'template' open editors, then templateBeingEdited is true
  const templateBeingEdited = m_open_editors.includes(EDITORTYPE.TEMPLATE);
  // If there are any 'importers' open editors, then importActive is true
  const importActive = m_open_editors.includes(EDITORTYPE.IMPORTER);
  // If there are any 'node' or 'edge' open editors, then nodeOrEdgeBeingEdited is true
  const nodeOrEdgeBeingEdited =
    m_open_editors.length > 0 &&
    (m_open_editors.includes(EDITORTYPE.NODE) ||
      m_open_editors.includes(EDITORTYPE.EDGE));
  return {
    templateBeingEdited,
    importActive,
    nodeOrEdgeBeingEdited,
    lockedNodes: [...m_locked_nodes.keys()],
    lockedEdges: [...m_locked_edges.keys()]
  };
};
/**
 * Register a template, import, node or edge as being actively edited.
 * @param {Object} pkt
 * @param {string} pkt.editor - 'template', 'importer', 'node', or 'edge'
 * @returns { templateBeingEdited: boolean, importActive: boolean, nodeOrEdgeBeingEdited: boolean }
 */
DB.RequestEditLock = pkt => {
  m_open_editors.push(pkt.Data().editor);
  return DB.GetEditStatus();
};
/**
 * Deregister a template, import, node or edge as being actively edited.
 * @param {Object} pkt
 * @param {string} pkt.editor - 'template', 'importer', 'node', or 'edge'
 * @returns { templateBeingEdited: boolean, importActive: boolean, nodeOrEdgeBeingEdited: boolean }
 */
DB.ReleaseEditLock = pkt => {
  const i = m_open_editors.findIndex(e => e === pkt.Data().editor);
  if (i > -1) m_open_editors.splice(i, 1);
  return DB.GetEditStatus();
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// utility functions for loading data
/*/ Migrates old network data to new formats based on the template defintion.
    This will automatically migrate any field/property that is marked `isRequired`
    and has a `defaultValue` defined.

    The basic check is this:
    1. If the TEMPLATE property `isRequired`
    2. ...and the TEMPLATE propert has `defaultValue` defined
    2. ...and the node/edge property is currently undefined or ``
    3. ...then we set the property to the defaultValue

    The key parameters:
      property.isRequired
      property.defaultValue

    If `isRequired` or `defaultValue` is not defined on the property, we skip migration.

    REVIEW: We might consider also adding type coercion.
/*/
function m_MigrateNodes(nodes) {
  // modifies `nodes` by reference
  // Migrate v1.4 to v2.0
  for (const [propertyName, property] of Object.entries(TEMPLATE.nodeDefs)) {
    if (property.isRequired && property.defaultValue !== undefined) {
      nodes.forEach(n => {
        if (n[propertyName] === undefined || n[propertyName] === '')
          n[propertyName] = property.defaultValue;
      });
    }
  }
}
function m_MigrateEdges(edges) {
  // modifies `edges` by reference
  // Migrate v1.4 to v2.0
  for (const [propertyName, property] of Object.entries(TEMPLATE.edgeDefs)) {
    if (property.isRequired && property.defaultValue !== undefined) {
      edges.forEach(e => {
        if (e[propertyName] === undefined || e[propertyName] === '')
          e[propertyName] = property.defaultValue;
      });
    }
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// utility function for cleaning nodes with numeric id property
function m_CleanObjID(prompt, obj) {
  if (typeof obj.id === 'string') {
    let int = parseInt(obj.id, 10);
    LOGGER.Write(PR, `! ${prompt} "${obj.id}" is string; converting to ${int}`);
    obj.id = int;
  }
  return obj;
}
function m_CleanEdgeEndpoints(prompt, edge) {
  if (typeof edge.source === 'string') {
    let int = parseInt(edge.source, 10);
    LOGGER.Write(
      PR,
      `  edge ${prompt} source "${edge.source}" is string; converting to ${int}`
    );
    edge.source = int;
  }
  if (typeof edge.target === 'string') {
    let int = parseInt(edge.target, 10);
    LOGGER.Write(
      PR,
      `  edge ${prompt} target "${edge.target}" is string; converting to ${int}`
    );
    edge.target = int;
  }
  return edge;
}
function m_CleanID(prompt, id) {
  if (typeof id === 'string') {
    let int = parseInt(id, 10);
    LOGGER.Write(PR, `! ${prompt} "${id}" is string; converting to number ${int}`);
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
    console.error(
      PR,
      `Trying to initialize database with bad dataset name: ${dataset}`
    );
  }

  return RUNTIMEPATH + dataset + '.loki';
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
module.exports = DB;
