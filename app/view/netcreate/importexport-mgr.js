/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## Import / Export Manager

  See ImportExport.jsx for the UI.


  #### Data Format

  The import/export data format is '.csv'.

  The first row should define the headers.
  Each data row should be comma-delimited and ended with a CR/LF.

  We support:
  * CR/LF inside of double quotes
  * Double quotes need to be escaped by repeating the quote, e.g. `""quoted text"""
  * Dates can be exported and imported as UTCStrings

  In general, any valid '.csv' file exported by Excel ought to work.


  #### Permissions

  Everyone is allowed to EXPORT data.
  * The data fields that are exported are defined in the project's template.
    Any field that is NOT marked "hidden" is exported.

  In general, only admins are allowed IMPORT data.
  * If the `allowLoggedInUserToImport` flag is set in the template, then
    logged-in users are also allowed to import data.
  * When anyone on the net is importing data, "Edit Lock" is set and no
    one else is allowed to import, edit a node or edge, or edit a template.
    This is because each of those activities can potentially conflict with
    each other.


  #### How it works

  Coordinating the selection of node and edge files for imports is a complex
  dance of selection, validation, and reporting.  When an import file is
  selected, we:

  1. Make sure any headers required by the Template are present
  2. Attempt to load the field data into memory
  3. Validate the data, either adding new objects or replacing existing objects
     For edges, we also check that the sources and targets point to valid nodes
  4. Display the expected import -- kind of like a dry run output.
  5. Wait fo the user to confirm and click Import.
  6. After the user clicks import, erge the data into the database and
  refresh global NCDATA.

  If there is a failure at any point, we abort immediately and display an error
  and clear the UI for the user to fix the import file and select a
  replacement file.  Importing can be a complex process, so we want to provide
  as much feedback as we can along the way so users know how to fix problems.

  Node and edge import files can be selected separately and in any order.
  The import data is temporarily stored in `IMPORT_NCDATA` for validation.

  The DB is NOT updated until the user clicks "Import".


  ####



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = true;
const PR = 'importexport-mgr: ';

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const UNISYS = require("unisys/client");
const DATASTORE = require("system/datastore");
const TOML = require("@iarna/toml");
const clone = require("rfdc")();
const UTILS = require("./nc-utils");

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MOD = UNISYS.NewModule(module.id);
var UDATA = UNISYS.NewDataLink(MOD);

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// For CSV Importing
/// * new id keyword
const NEW_ID_KEYWORD = "new"; // use id "new" to add a new record during import
/// We need to match:
/// * To split lines, we need to split on LF that is NOT wrapped in quotes
const REGEXMatchLFNotInQuotes = /\n(?=(?:[^"]*"[^"]*")*[^"]*$)/;
/// * To read fields, we need to ignore commas that are between two double quotes
const REGEXMatchCommasNotInQuotes = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/;

/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function m_formatDate(date) {
  // wrap in quotes because time includes a comma
  if (date) return `"${new Date(date).toUTCString()}"`;
  return '';
}

function m_encode(data) {
  let res;
  // double quotes need to be escaped
  res = String(data).replace(/"/g, '""');
  // Don't encode carriage returns, csv should support LF inside of quotes
  // `REGEXMatchLFNotInQuotes` should work.
  // // encode carriage returns
  // res = String(res).replace(/\n/g, 'nnn');
  return res;
}

function m_decode(data) {
  let res;
  // double quotes need to be escaped
  res = String(data).replace(/""/g, '"');
  return res;
}

// DEPRECATED -- Used to flatten 'attributes'
//    'attributes' have been removed, so this should not be needed anymore
// Converts nested key definitions into a flat array, e.g.
//     from ['id', { attributes: ['type', 'info'] } ]
//     into ['id', 'attributes:type', 'attributes:info']
function m_flattenKeys(keys, prefix) {
  if (!Array.isArray(keys)) {
    // Recurse
    const pre = Object.keys(keys)[0];
    return m_flattenKeys(keys[pre], pre);
  } else {
    const flattenedKeys = keys.map(k => {
      if (typeof k !== 'string') return m_flattenKeys(k);
      if (prefix) return `${prefix}:${k}`;
      else return k;
    });
    return flattenedKeys.flat();
  }
}

///////////////////////////////////////////////////////////////////////////////
/// IMPORT / EXPORT HELPERS ///////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns an array of export values for a given node record
 * Used during export.
 * @param {array} nodes - array of source nodes to export
 * @param {array} keys - node def keys, e.g. 'id' and 'label'
 *                       NOTE this is usually a subset of nodeDef keys
 *                       with `hidden` keys removed so they won't export
 * @returns - array of node values, e.g. [1,'Tacitus','Person',...]
 */
function m_renderNodeValues(node, keys) {
  const RESULT = [];
  keys.forEach(key => {
    // If the key is an object, recurse
    // eslint-disable-next-line prefer-reflect
    if (Object.prototype.toString.call(key) === '[object Object]') {
      // DEPRECATED -- 'attribute' handler.
      const subKeys = Object.keys(key); // can have multiple subKeys
      subKeys.forEach(k => {
        RESULT.push(m_renderNodeValues(node[k], key[k]));
      });
    }
    // Special Data Handling
    // -- Number
    if (['id'].includes(key)) {
      // Export as a number
      RESULT.push(node[key]);
      return;
    }
    // -- Revision
    if (['revision'].includes(key)) {
      // Export as a number from meta
      RESULT.push(node.meta[key]);
      return;
    }
    // -- DATE
    if (['created', 'updated'].includes(key)) {
      RESULT.push(m_formatDate(node.meta[key]));
      return;
    }
    // -- Normal processing -- wrap in quotes
    if (Object.prototype.hasOwnProperty.call(node, key)) {
      RESULT.push(`"${m_encode(node[key])}"`); // enclose in quotes to support commas
      return;
    }
    // -- Else, data missing/not defined, add empty string
    RESULT.push("");
  });
  return RESULT;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns an array of node records
 * Used during export.
 * @param {array} nodes - array of source nodes to export
 * @param {array} nodekeys - node def keys, e.g. 'id' and 'label'
 *                           NOTE this is usually a subset of nodeDef keys
 *                           with `hidden` keys removed so they won't export
 * @returns - array of nodes, e.g. [[<tacitus>], [<marc antony>], ...]
 */
function m_GenerateNodesArray(nodes, nodekeys) {
  /// Define Node KEYS
  const nodesArr = [];
  nodes.forEach(n => nodesArr.push(m_renderNodeValues(n, nodekeys)));
  return nodesArr;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns an array of export values for a given edge record
 * Used during export.
 * @param {array} edge - array of source nodes to export
 * @param {array} keys - edge def keys, e.g. 'id' and 'label'
 *                       NOTE this is usually a subset of edgeDef keys
 *                       with `hidden` keys removed so they won't export
 * @returns - array of edge values, e.g. [1,'is enemy of',2,...]
 */
function m_renderEdgeValues(edge, keys) {
  const RESULT = [];
  keys.forEach(key => {
    // If the key is an object, recurse
    // eslint-disable-next-line prefer-reflect
    if (Object.prototype.toString.call(key) === '[object Object]') {
      // DEPRECATED -- 'attribute' handler.
      const subKeys = Object.keys(key); // can have multiple subKeys
      subKeys.forEach(k => {
        RESULT.push(m_renderNodeValues(edge[k], key[k]));
      });
    }
    // Special Data Handling
    // -- Number
    if (['id'].includes(key)) {
      // Export as a number
      RESULT.push(edge[key]);
      return;
    }
    // -- SOURCE / TARGET
    if (['source', 'target'].includes(key)) {
      // source/target is an id not an object
      RESULT.push(edge[key]);
      return;
    }
    // -- Revision
    if (['revision'].includes(key)) {
      // Export as a number from meta
      RESULT.push(edge.meta[key]);
      return;
    }
    // -- DATE
    if (['created', 'updated'].includes(key)) {
      RESULT.push(m_formatDate(edge.meta[key]));
      return;
    }
    // -- normal processing -- wrap in quotes
    if (Object.prototype.hasOwnProperty.call(edge, key)) {
      RESULT.push(`"${m_encode(edge[key])}"`); // enclose in quotes to support commas
      return;
    }
    // -- Else, data missing/not defined, add empty string
    RESULT.push("");
  })
  return RESULT;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns an array of edge records
 * Used during export.
 * @param {array} edges - array of source edges to export
 * @param {array} edgekeys - edge def keys, e.g. 'id' and 'label'
 *                           NOTE this is usually a subset of edgeDef keys
 *                           with `hidden` keys removed so they won't export
 * @returns - array of edges, e.g. [[<1:2>], [<1:4>], ...]
 */
function m_GenerateEdgesArray(edges, edgekeys) {
  /// Define Edge KEYS
  const edgeArr = [];
  edges.forEach(e => edgeArr.push(m_renderEdgeValues(e, edgekeys)));
  return edgeArr;
}


///////////////////////////////////////////////////////////////////////////////
/// EXPORT METHODS ////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// EXPORT NODES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Exports FILTERED data, not the full data set.
MOD.ExportNodes = () => {
  const DATA = UDATA.AppState('FILTEREDD3DATA');
  const TEMPLATE = UDATA.AppState('TEMPLATE');
  const { nodes } = DATA;
  let EXPORT = '';

  /// 1. Export Nodes
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Define Node KEYS to export
  /// Use nodekeys from TEMPLATE, but skip hidden fields
  const nodekeys = Object.keys(TEMPLATE.nodeDefs).filter(k => {
    return TEMPLATE.nodeDefs[k].hidden ? false : k;
  });

  /// 2. Expand to CSV
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  ///    2.1. NODES
  ///    2.1.1. Create headers
  const nodeHeadersArr = [];
  nodekeys.forEach(key => {
    // eslint-disable-next-line prefer-reflect
    if (Object.prototype.toString.call(key) === '[object Object]') {
      // DEPRECATED -- 'attribute' handler.
      throw new Error(`Unexpected node type for ${JSON.stringify(key)}`);
      // This shouldn't be called anymore as of 2/2022 because the data fields
      // have been flattened. See #198.
      // const subKeys = Object.keys(key); // can have multiple subKeys
      // const internalkeys = subKeys.map(sk => key[sk].map(k => `${sk}:${k}`)).flat();
      // return internalkeys.map(k => NODEKEY_LABELS[k]);
    } else {
      nodeHeadersArr.push(TEMPLATE.nodeDefs[key].exportLabel);
    }
  });
  const nodeHeaders = nodeHeadersArr.flat();
  ///    2.1.2 Export Nodes with filtered headers
  const nodesArr = m_GenerateNodesArray(nodes, nodekeys);
  ///    2.1.3 Attach headers to front of file
  nodesArr.unshift(nodeHeaders); // add headers
  ///    2.1.4 Expand Nodes to CSV
  const commaDelimitedNodes = nodesArr.map(n => n.join(','));
  EXPORT += commaDelimitedNodes.join('\n')


  /// 3. Save to File
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // const encodedURI = encodeURI(EXPORT);
  const link = document.createElement('a');
  const blob = new Blob(["\ufeff", EXPORT]);
  const url = URL.createObjectURL(blob);
  link.href = url;
  const DATASET = window.NC_CONFIG.dataset || "netcreate";
  link.download = `${DATASET}_nodes.csv`;
  // link.setAttribute('href', encodedURI);
  // link.setAttribute('download', 'netcreate_export.csv');
  document.body.appendChild(link); // Required for FF
  link.click();
  document.body.removeChild(link);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// EXPORT EDGES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Exports FILTERED data, not the full data set.
MOD.ExportEdges = () => {
  const DATA = UDATA.AppState('FILTEREDD3DATA');
  const TEMPLATE = UDATA.AppState('TEMPLATE');
  const { edges } = DATA;
  let EXPORT = '';

  /// 1. Export Edges
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Define Edge KEYS

  // Old attributes method
  // const edgesArr = m_GenerateEdgesArray(edges, EDGEKEYS);

  // New Template method
  // Use edgekeys from TEMPLATE, but skip hidden fields
  // const edgekeys = Object.keys(TEMPLATE.edgeDefs);
  const edgekeys = Object.keys(TEMPLATE.edgeDefs).filter(k => {
    return TEMPLATE.edgeDefs[k].hidden ? false : k;
  });


  // const edgesArr = m_GenerateEdgesArray(edges, edgekeys);

  /// 3. Expand to CSV
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  ///   3.1. EDGES
  ///   3.1.1. Create headers
  const edgeHeadersArr = [];
  edgekeys.forEach(key => {
    // eslint-disable-next-line prefer-reflect
    if (Object.prototype.toString.call(key) === '[object Object]') {
      // DEPRECATED -- 'attribute' handler.
      throw new Error(`Unexpected edge type for ${JSON.stringify(key)}`);
      // const subKeys = Object.keys(key); // can have multiple subKeys
      // return subKeys.map(sk => key[sk].map(k => `${sk}:${k}`)).flat();
    } else {
      edgeHeadersArr.push(TEMPLATE.edgeDefs[key].exportLabel);
    }
  });
  const edgeHeaders = edgeHeadersArr.flat();
  ///    3.1.2 Export Nodes with filtered headers
  const edgesArr = m_GenerateEdgesArray(edges, edgekeys);
  ///    3.1.3 Attach headers to front of file
  edgesArr.unshift(edgeHeaders);
  ///    3.1.4 Expand Edges to CSV
  const commaDelimitedEdges = edgesArr.map(e => e.join(','));
  EXPORT += commaDelimitedEdges.join('\n');

  /// 4. Save to File
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // const encodedURI = encodeURI(EXPORT);
  const link = document.createElement('a');
  const blob = new Blob(["\ufeff", EXPORT]);
  const url = URL.createObjectURL(blob);
  link.href = url;
  const DATASET = window.NC_CONFIG.dataset || "netcreate";
  link.download = `${DATASET}_edges.csv`;
  // link.setAttribute('href', encodedURI);
  // link.setAttribute('download', 'netcreate_export.csv');
  document.body.appendChild(link); // Required for FF
  link.click();
  document.body.removeChild(link);
}

///////////////////////////////////////////////////////////////////////////////
/// IMPORT METHODS ////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// IMPORT MODULE VARIABLES ///////////////////////////////////////////////////
let nodeFile;
let edgeFile;
let nodesToImport = [];
let edgesToImport = [];
let IMPORT_NCDATA;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Called by ImportExport when user clicks "Clear File Selections".
 * Resets the loaded/validated data for a new set of data
 */
MOD.ResetImportData = () => {
  nodeFile = undefined;
  edgeFile = undefined;
  nodesToImport = [];
  edgesToImport = [];
  IMPORT_NCDATA = clone(UDATA.AppState('NCDATA'));
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// IMPORT HELPERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// Make sure source and target have valid ids
/// If not, add message to edgeImportErrors
/// `row` is the line number in the import csv file
function m_hasValidSourceTarget(edge, NCDATA, edgeImportErrors, row) {
  const source = NCDATA.nodes.find(n => n.id === Number(edge.source));
  const target = NCDATA.nodes.find(n => n.id === Number(edge.target));
  if (source === undefined) edgeImportErrors.push(`Edge id ${edge.id}, row ${row} references unknown source node id ${edge.source}`);
  if (target === undefined) edgeImportErrors.push(`Edge id ${edge.id}, row ${row} references unknown target node id ${edge.target}`);
  return (source && target);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// IMPORT MODULE METHODS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Called by ImportExport if the user Cancels selecting a node file
 */
MOD.ResetNodeImportData = () => {
  nodeFile = undefined;
  nodesToImport = [];
  if (IMPORT_NCDATA) IMPORT_NCDATA.nodes = clone(UDATA.AppState('NCDATA').nodes);
}
/**
 * Called by IMportExport if the user Cancels selecting a node file
 */
MOD.ResetEdgeImportData = () => {
  edgeFile = undefined;
  edgesToImport = [];
  if (IMPORT_NCDATA) IMPORT_NCDATA.edges = clone(UDATA.AppState('NCDATA').edges);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NODE IMPORT ///////////////////////////////////////////////////////////////
/**
 * Loads the file and checks the first row headers to make sure all the required
 * headers have been defined.
 * @param {Object} data
 * @param {File} data.nodefile - https://developer.mozilla.org/en-US/docs/Web/API/File
 * @returns {isValid:boolean, messageJsx:jsx, headers:[], lines:[]}
 */
async function m_NodefileCheckHeaders(data) {
  let isValid = true;
  let missingKeys = [];
  let messageJsx = '';

  // Retrieve import file node keys defined in template
  const TEMPLATE = UDATA.AppState('TEMPLATE');
  const NODEKEYS = Object.values(TEMPLATE.nodeDefs)
    .filter(k => !k.hidden) // Ignore hidden keys
    .map(k => k.exportLabel);

  const { nodefile } = data;
  if (nodefile === undefined) return { isValid: false, missingKeys, fileKeys: [] }; // User cancelled
  let result = await nodefile.text();
  // Validate Data
  const lines = result.split(REGEXMatchLFNotInQuotes);
  // First line should list the headers
  // Remove headers, so 'lines' is just data
  const headers = lines.shift()
    .trim()
    .split(',');
  // get keys
  const nodeKeys = m_flattenKeys(NODEKEYS);
  const fileKeys = m_flattenKeys(headers);
  // check that ALL nodeKeys are in the fileKeys
  nodeKeys.forEach(k => {
    if (!fileKeys.includes(k)) {
      isValid = false;
      missingKeys.push(`"${k}"`);
    }
  });
  if (!isValid) {
    // construct missing keys jsx
    messageJsx = (
      <div style={{ color: 'red' }}>
        <div>Error trying to import {data.nodefile.name}!</div>
        <div>Missing keys: {missingKeys.join(', ')}</div>
        <div>Keys found in file: {fileKeys.join(', ')}</div>
      </div>
    )
  }
  return { isValid, messageJsx, headers, lines };
}
/**
 * Reads each line, mapping data fields to internal representation fields
 * @param {array} headers
 * @param {array} lines
 * @returns { isValid:boolean, messageJsx:jsx, nodes:[] }
 */
function m_NodefileLoadNodes(headers, lines) {
  // Map import fields (exportLabel) to internal representation fields, e.g. ID => id,
  // essentially a reverse look up map
  const TEMPLATE = UDATA.AppState('TEMPLATE');
  const INTERNAL_FIELDS_MAP = new Map();
  Object.entries(TEMPLATE.nodeDefs).map(e => INTERNAL_FIELDS_MAP.set(e[1].exportLabel, e[0]));

  // convert nodefileData to JSON
  // Load JSON
  let isValid = true;
  let messageJsx = '';
  const nodes = lines.map(l => {
    const node = {};
    const subcategories = new Map();
    const importFields = l.split(REGEXMatchCommasNotInQuotes); // ?=" needed to match commas in strings
    importFields.forEach((f, index) => {
      const field = f.replace(/^"/, "").replace(/"$/, ""); // strip start and end quotes from strings
      const key = headers[index];
      const keysplit = String(key).split(':');
      // Subcategory and subkey are DEPRECATED
      const subcategory = keysplit[0]; // e.g. 'attributes' of 'attributes:Node_type'
      const subkey = keysplit[1]; // e.g. 'Node_type'
      if (subkey) {
        isValid = false;
        messageJsx = (<div color="red">`subkey ${subkey} is deprecated!`</div>)
        console.error(PR, `subkey ${subkey} is deprecated!`);
        // DEPRECATED: Review if we decide to use this again.
        // // Using a sub category?  e.g. 'attributes:Node_type'
        // const currSubfields = subcategories.get(subcategory) || {};
        // console.log('...currSubfields', currSubfields, field)
        // currSubfields[subkey] = field;
        // subcategories.set(subcategory, currSubfields);
        // console.log('adding subfields', key, currSubfields, subcategories)
      } else {
        // not using a subcategory, just a regular field
        const exportLabel = headers[index];
        if (exportLabel === undefined) console.error(PR, 'could not find exportLabel for index', index, 'in', headers);
        const internalLabel = INTERNAL_FIELDS_MAP.get(exportLabel);
        // special handling for internal fields
        if (['id'].includes(internalLabel)) {
          // Note that Number("") => 0
          // We don't want empty ids to be converted to id 0
          // so we explicitly replace it with NaN
          node[internalLabel] = field === '' ? NaN : field; // ids are numbers
        } else if (['created', 'updated', 'revision'].includes(internalLabel)) {
          // meta fields
          if (node.meta === undefined) node.meta = {};
          node.meta[internalLabel] = field;
        } else {
          node[internalLabel] = m_decode(field); // convert double quotes
        }
      }
    })
    // DEPRECATED
    // collapse 'attributes' and 'meta' into objects
    // subcategories.forEach((val, key) => {
    //   node[key] = val
    // });
    return node;
  });
  return { isValid, messageJsx, nodes };
}
/**
 * Checks to make sure all nodes to import have a valid id or specify "new"
 * @param {array} nodes
 * @returns { isValid:boolean, messageJsx:jsx, nodes, IMPORT_NCDATA }
 *          At the end of this method, IMPORT_NCDATA will have imported nodes added EXCEPT for "new" id nodes
 */
function m_NodefileValidateNodes(nodes) {
  let isValid = true;
  let messageJsx = '';
  let nodesAdded = 0; // counter
  let nodesReplaced = 0; // counter
  const importMsgs = [];
  const nodeImportErrors = [];
  nodes.forEach((n, i) => {
    const row = i + 2; // to account for header row
    if (String(n.id).toLowerCase() === NEW_ID_KEYWORD) {
      //  A1.1 "new" node
      importMsgs.push(`New node "${n.label}" with auto-generated id will be added.`);
      //  NOTE: "new" nodes are not added until after DB_MERGE since they do not have an id
      //        Edge imports should not be referencing these new nodes.
      nodesAdded++;
    } else {
      n.id = Number(n.id); // csv imports as string, so convert to Number
      if (isNaN(n.id)) {
        // A1.2 Invalid node id, usually a string
        isValid = false;
        nodeImportErrors.push(`Node in row ${row} does not have a valid id.  Found: "${n.id}".`);
      } else {
        const existingNodeIdx = IMPORT_NCDATA.nodes.findIndex(node => node.id === n.id);
        if (existingNodeIdx > -1) {
          // A1.3 Replace existing node
          importMsgs.push(`Existing node id ${n.id} "${IMPORT_NCDATA.nodes[existingNodeIdx].label}" will be replaced by node "${n.label}" in row ${row} with matching id.`);
          IMPORT_NCDATA.nodes.splice(existingNodeIdx, 1, n);
          nodesReplaced++;
        } else {
          // A1.4 Referenced unknown id, add if valid
          importMsgs.push(`New node id ${n.id} "${n.label}" will be added.`);
          IMPORT_NCDATA.nodes.push(n);
          nodesAdded++;
        }
      }
    }
  });
  if (isValid) {
    messageJsx = (
      <ul>{importMsgs.map((e, i) => (<li key={i}>{e}</li>))}</ul>
    );
  } else {
    messageJsx = (
      <ul style={{ color: 'red' }}>{nodeImportErrors.map((e, i) => (<li key={i}>{e}</li>))}</ul>
    )
  }
  return { isValid, messageJsx, nodes, IMPORT_NCDATA }
}
/**
 * Walks down the checkers/validators one by one and aborts/returns an error message if an
 * an error is encountered.  Data is stored temporarily in `IMPORT_NCDATA` so that we can
 * process edges -- e.g. an edge might refer to a node that is currently being imported.
 *
 * Data is not actually imported in the DB until the user clicks "Import"
 *
 * Side effect: Updates `nodesToImport` with validated nodes
 * @param {object} data
 * @param {File} data.nodefile - https://developer.mozilla.org/en-US/docs/Web/API/File
 * @return { isValid:boolean, messages:[], errors:[] }
 */
MOD.NodefileValidate = async (data) => {
  // No nodefile passed, user probably clicked cancel
  if (!data.nodefile) return { isValid: false }

  if (!IMPORT_NCDATA) IMPORT_NCDATA = clone(UDATA.AppState('NCDATA'));
  const nodeFileName = data.nodefile.name;

  const headerResults = await m_NodefileCheckHeaders(data);
  if (!headerResults.isValid) return Object.assign(headerResults, {
    messageTitle: `Nodes import file "${nodeFileName}" will not be imported: Header Validation Failed!`
  });

  const importResults = m_NodefileLoadNodes(headerResults.headers, headerResults.lines);
  if (!importResults.isValid) return Object.assign(importResults, {
    messageTitle: `Nodes import file "${nodeFileName}" will not be imported: Load File Failed!`
  });

  const nodeResults = m_NodefileValidateNodes(importResults.nodes, IMPORT_NCDATA);
  if (!nodeResults.isValid) return Object.assign(nodeResults, {
    messageTitle: `Nodes import file "${nodeFileName}" will not be imported: Data Validation Failed!`
  });

  // set module-wide vars
  nodesToImport = nodeResults.nodes;
  nodeFile = data.nodefile;
  IMPORT_NCDATA.nodes = Object.assign(IMPORT_NCDATA.nodes, nodeResults.nodes);
  return Object.assign(nodeResults, {
    messageTitle: `Nodes import file "${nodeFileName}": Validated!`
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// EDGE IMPORT ///////////////////////////////////////////////////////////////
/**
 * Loads the file and checks the first row headers to make sure all the required
 * headers have been defined.
 * @param {Object} data
 * @param {File} data.edgefile - https://developer.mozilla.org/en-US/docs/Web/API/File
 * @returns {isValid:boolean, messageJsx:jsx, headers:[], lines:[]}
 */
async function m_EdgefileCheckHeaders(data) {
  let isValid = true;
  let missingKeys = [];
  let messageJsx = '';

  // Retrieve import file node keys defined in template
  const TEMPLATE = UDATA.AppState('TEMPLATE');
  const EDGEKEYS = Object.values(TEMPLATE.edgeDefs)
    .filter(k => !k.hidden) // Ignore hidden keys
    .map(k => k.exportLabel);

  const { edgefile } = data;
  if (edgefile === undefined) return { isValid: false, missingKeys, fileKeys: [] }; // User cancelled
  let result = await edgefile.text();
  // Validate Data
  const lines = result.split(REGEXMatchLFNotInQuotes);
  // First line should list the headers
  // Remove headers, so 'lines' is just data
  const headers = lines.shift()
    .trim()
    .split(',');
  // get keys
  const edgeKeys = m_flattenKeys(EDGEKEYS);
  const fileKeys = m_flattenKeys(headers);
  // check that ALL edgeKeys are in the fileKeys
  edgeKeys.forEach(k => {
    if (!fileKeys.includes(k)) {
      isValid = false;
      missingKeys.push(`"${k}"`);
    }
  });
  if (!isValid) {
    // construct missing keys jsx
    messageJsx = (
      <div style={{ color: 'red' }}>
        <div>Error trying to import {data.edgefile.name}!</div>
        <div>Missing keys: {missingKeys.join(', ')}</div>
        <div>Keys found in file: {fileKeys.join(', ')}</div>
      </div>
    )
  }
  return { isValid, messageJsx, headers, lines };
}
/**
 * Reads each line, mapping data fields to internal representation fields
 * @param {array} headers
 * @param {array} lines
 * @returns { isValid:boolean, messageJsx:jsx, nodes:[] }
 */
function m_EdgefileLoadEdges(headers, lines) {
  // Map import fields (exportLabel) to internal representation fields, e.g. ID => id,
  // essentially a reverse look up map
  const TEMPLATE = UDATA.AppState('TEMPLATE');
  const INTERNAL_FIELDS_MAP = new Map();
  Object.entries(TEMPLATE.edgeDefs).map(e => INTERNAL_FIELDS_MAP.set(e[1].exportLabel, e[0]));

  // convert nodefileData to JSON
  // Load JSON
  let isValid = true;
  let messageJsx = '';
  const edges = lines.map(l => {
    const edge = {};
    const subcategories = new Map();
    const importFields = l.split(REGEXMatchCommasNotInQuotes); // ?=" needed to match commas in strings
    importFields.forEach((f, index) => {
      const field = f.replace(/^"/, "").replace(/"$/, ""); // strip start and end quotes from strings
      const key = headers[index];
      const keysplit = String(key).split(':');
      // Subcategory and subkey are DEPRECATED
      const subcategory = keysplit[0]; // e.g. 'attributes' of 'attributes:Node_type'
      const subkey = keysplit[1]; // e.g. 'Node_type'
      if (subkey) {
        isValid = false;
        messageJsx = (<div color="red">`subkey ${subkey} is deprecated!`</div>)
        console.error(PR, `subkey ${subkey} is deprecated!`);
        // DEPRECATED: Review if we decide to use this again.
        // // Using a sub category?  e.g. 'attributes:Node_type'
        // const currSubfields = subcategories.get(subcategory) || {};
        // console.log('...currSubfields', currSubfields, field)
        // currSubfields[subkey] = field;
        // subcategories.set(subcategory, currSubfields);
        // console.log('adding subfields', key, currSubfields, subcategories)
      } else {
        // not using a subcategory, just a regular field
        // meta field?
        const exportLabel = headers[index];
        if (exportLabel === undefined) console.error(PR, 'could not find exportLabel for index', index, 'in', headers);
        const internalLabel = INTERNAL_FIELDS_MAP.get(exportLabel);
        // special handling for internal fields
        if (['id', 'source', 'target'].includes(internalLabel)) {
          // Note that Number("") => 0
          // We don't want empty ids to be converted to id 0
          // so we explicitly replace it with NaN
          edge[internalLabel] = field === '' ? NaN : field; // ids are numbers
        } else if (['created', 'updated', 'revision'].includes(internalLabel)) {
          // meta fields
          if (edge.meta === undefined) edge.meta = {};
          edge.meta[internalLabel] = field;
        } else {
          edge[internalLabel] = m_decode(field); // convert double quotes
        }
      }
    })
    // DEPRECATED
    // collapse 'attributes' and 'meta' into objects
    // subcategories.forEach((val, key) => {
    //   node[key] = val
    // });
    return edge;
  });
  return { isValid, messageJsx, edges };
}
/**
 * Checks to make sure all edges to import have a valid id or specify "new"
 * @param {array} edges
 * @returns { isValid:boolean, messageJsx:jsx, nodes, IMPORT_NCDATA }
 *          At the end of this method, IMPORT_NCDATA will have imported edges added EXCEPT for "new" id edges
 */
function m_EdgefileValidateEdges(edges) {
  let isValid = true;
  let messageJsx = '';
  let edgesAdded = 0; // counter
  let edgesReplaced = 0; // counter
  const importMsgs = [];
  const edgeImportErrors = [];
  edges.forEach((e, i) => {
    const row = i + 2; // to account for header row
    e.size = 1; // Set default edge size

    // Make sure each edge has a valid source and target
    if (!m_hasValidSourceTarget(e, IMPORT_NCDATA, edgeImportErrors, row)) isValid = false;

    if (String(e.id).toLowerCase() === NEW_ID_KEYWORD) {
      //  A1.1 "new" edge
      importMsgs.push(`New edge with auto-generated id will be added.`);
      //  NOTE: "new" edges are not added until after DB_MERGE since they do not have an id
      edgesAdded++;
    } else {
      e.id = Number(e.id); // csv imports as string, so convert to Number
      if (isNaN(e.id)) {
        // A1.2 Invalid edge id, usually a string
        isValid = false;
        edgeImportErrors.push(`Edge in row ${row} does not have a valid id.  Found: "${e.id}".`);
      } else {
        const existingEdgeIdx = IMPORT_NCDATA.edges.findIndex(edge => edge.id === e.id);
        if (existingEdgeIdx > -1) {
          // A1.3 Replace existing node
          importMsgs.push(`Existing edge id ${e.id} will be replaced by edge in row ${row} with matching id.`);
          IMPORT_NCDATA.edges.splice(existingEdgeIdx, 1, e);
          edgesReplaced++;
        } else {
          // A1.4 Referenced unknown id, add if valid
          importMsgs.push(`New edge id ${e.id} will be added.`);
          IMPORT_NCDATA.edges.push(e);
          edgesAdded++;
        }
      }
    }
  });
  if (isValid) {
    messageJsx = (
      <ul>{importMsgs.map((e, i) => (<li key={i}>{e}</li>))}</ul>
    );
  } else {
    messageJsx = (
      <ul style={{ color: 'red' }}>{edgeImportErrors.map((e, i) => (<li key={i}>{e}</li>))}</ul>
    )
  }
  return { isValid, messageJsx, edges, IMPORT_NCDATA }
}
/**
 * Walks down the checkers/validators one by one and aborts/returns an error message if an
 * an error is encountered.  Data is stored temporarily in `IMPORT_NCDATA` so that we can
 * process edges -- e.g. an edge might refer to a node that is currently being imported.
 *
 * Data is not actually imported in the DB until the user clicks "Import"
 *
 * Side effect: Updates `edgesToImport` with validated edges
 * @param {object} data
 * @param {File} data.edgefile - https://developer.mozilla.org/en-US/docs/Web/API/File
 * @return { isValid:boolean, messages:[], errors:[] }
 */
MOD.EdgefileValidate = async (data) => {
  // No edgefile passed, user probably clicked cancel
  if (!data.edgefile) return { isValid: false }

  if (!IMPORT_NCDATA) IMPORT_NCDATA = clone(UDATA.AppState('NCDATA'));
  const edgeFileName = data.edgefile.name;

  const headerResults = await m_EdgefileCheckHeaders(data);
  if (!headerResults.isValid) return Object.assign(headerResults, {
    messageTitle: `Edges import file "${edgeFileName}" will not be imported: Header Validation Failed!`
  });

  const importResults = m_EdgefileLoadEdges(headerResults.headers, headerResults.lines);
  if (!importResults.isValid) return Object.assign(importResults, {
    messageTitle: `Edges mport file "${edgeFileName}" will not be imported: Load File Failed!`
  });

  const edgeResults = m_EdgefileValidateEdges(importResults.edges, IMPORT_NCDATA);
  if (!edgeResults.isValid) return Object.assign(edgeResults, {
    messageTitle: `Edges import file "${edgeFileName}" will not be imported: Data Validation Failed!`
  });

  // set module-wide vars
  edgesToImport = edgeResults.edges; // set module-wide var
  edgeFile = data.edgefile; // set module-wide var
  return Object.assign(edgeResults, {
    messageTitle: `Edges import file "${edgeFileName}": Validated!`
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// MAIN IMPORT ///////////////////////////////////////////////////////////////
/**
 * This is triggered when the user clicks the "Import" button.
 * Forces a RELOAD_DB after the import data is merged into the database.
 * @returns {messageJsx} -- summary of file imported
 */
MOD.Import = async () => {
  // Write to database!
  const mergeData = { nodes: nodesToImport, edges: edgesToImport };
  await UDATA.LocalCall("DB_MERGE", mergeData).then(res => {
    // Reload NCDATA from the DB to get new Node and Edge Ids created during the merge
    UDATA.LocalCall("RELOAD_DB");
  });
  const importedFiles = [];
  if (nodeFile) importedFiles.push(nodeFile.name);
  if (edgeFile) importedFiles.push(edgeFile.name);
  const importedFileNames = importedFiles.join(', ');
  return {
    messageJsx: (<div>{importedFileNames} Import Completed!</div>)
  }
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
