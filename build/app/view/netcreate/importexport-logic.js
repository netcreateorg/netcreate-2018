/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  * Import / Export Logic

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;
const PR = 'importexport-logic: ';

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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

/// DATA //////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// These are set by MOD.ValidateNodeFile and MOD.ValidateEdgeFile if the
/// file to import matches the headers.  They are not actually imported
/// until MOD.Import() is called.
MOD.NodefileData = {}; // { headers, lines }
MOD.EdgefileData = {}; // { headers, lines }
// REVIEW: Is this too confusing with `nodefileData`?

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

/// IMPORT / EXPORT METHODS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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
    if (['id', 'revision'].includes(key)) {
      // Export as a number
      RESULT.push(node[key]);
      return;
    }
    // -- DATE
    if (['created', 'updated'].includes(key)) {
      RESULT.push(m_formatDate(node.meta[key]));
      return;
    }
    // -- Normal processing -- wrap in quotes
    if (node.hasOwnProperty(key)) {
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
        RESULT.push( m_renderNodeValues(edge[k], key[k]) );
      });
    }
    // Special Data Handling
    // -- Number
    if (['id', 'revision'].includes(key)) {
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
    // -- DATE
    if (['created', 'updated'].includes(key)) {
      RESULT.push(m_formatDate(edge.meta[key]));
      return;
    }
    // -- normal processing -- wrap in quotes
    if (edge.hasOwnProperty(key)) {
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
/// IMPORT FILE HEADER VALIDATION /////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// This only checks to make sure the expected headers are present
/// It does not actually validate the data
/// Headers are defined in the template schema.
MOD.ValidateNodeFile = async data => {
  let isValid = true;
  let missingKeys = [];

  // Retrieve import file node keys defined in template
  const TEMPLATE = UDATA.AppState('TEMPLATE');
  const NODEKEYS = Object.values(TEMPLATE.nodeDefs)
    .filter(k => !k.hidden) // Ignore hidden keys
    .map(k => k.exportLabel);

  const { nodefile } = data;
  if (nodefile===undefined) return { isValid: false, missingKeys, fileKeys: []}; // User cancelled
  let result = await nodefile.text();
  // Validate Data
  const lines = result.split(REGEXMatchLFNotInQuotes);
  // First line should list the headers
  // Remove headers, so 'lines' is just data
  const headers = lines.shift().split(',');
  // get keys
  const nodeKeys = m_flattenKeys(NODEKEYS);
  const fileKeys = m_flattenKeys(headers);
  // check that ALL nodeKeys are in the fileKeys
  nodeKeys.forEach(k => {
    if (!fileKeys.includes(k)) {
      isValid = false;
      missingKeys.push(k);
    }
  });
  if (isValid) MOD.NodefileData = { headers, lines };
  return {isValid, missingKeys, fileKeys};
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// This only checks to make sure the expected headers are present
/// It does not actually validate the data
MOD.ValidateEdgeFile = async data => {
  let isValid = true;
  let missingKeys = [];

  // Retrieve import file node keys defined in template
  const TEMPLATE = UDATA.AppState('TEMPLATE');
  const EDGEKEYS = Object.values(TEMPLATE.edgeDefs)
    .filter(k => !k.hidden) // Ignore hidden keys
    .map(k => k.exportLabel);

  const { edgefile } = data;
  if (edgefile===undefined) return { isValid: false, missingKeys, fileKeys: []}; // User cancelled
  let result = await edgefile.text();
  // Validate Data
  const lines = result.split(REGEXMatchLFNotInQuotes);
  // First line should list the headers
  // Remove headers, so 'lines' is just data
  const headers = lines.shift().split(',');
  // get keys
  const edgeKeys = m_flattenKeys(EDGEKEYS);
  const fileKeys = m_flattenKeys(headers);
  // check that ALL nodeKeys are in the fileKeys
  edgeKeys.forEach(k => {
    if (!fileKeys.includes(k)) {
      isValid = false;
      missingKeys.push(k);
    }
  });
  if (isValid) MOD.EdgefileData = { headers, lines };
  return {isValid, missingKeys, fileKeys};
}


/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Used when importing a TOML file
    Makes sure TOML file is readable.
    Returns JSON
/*/
MOD.ValidateTOMLFile = async data => {
  const { tomlfile } = data;
  try {
    let tomlText = await tomlfile.text();
    const json = TOML.parse(tomlText);
    const isValid = true;
    return {isValid, templateJSON: json};
  }
  catch (err) {
    return { isValid: false, error: err };
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// IMPORT FILE LOADERS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Load Nodes from node csv file
 * @param {object} nodefileData
 * @param {array} nodefileData.headers
 * @param {array} nodefileData.lines
 * @returns
 */
function m_LoadNodes(nodefileData) {
  // If nodefileData is not defined, just return an empty array
  if (!nodefileData || !nodefileData.headers || !nodefileData.lines) return [];

  // Retrieve import file node keys defined in template
  const TEMPLATE = UDATA.AppState('TEMPLATE');
  const NODEKEYS = Object.values(TEMPLATE.nodeDefs).map(k => k.exportLabel);

  // Map import fields (exportLabel) to internal fields, e.g. ID => id,
  // essentially a reverse look up map
  const INTERNAL_FIELDS_MAP = new Map();
  Object.entries(TEMPLATE.nodeDefs).map(e => INTERNAL_FIELDS_MAP.set(e[1].exportLabel, e[0]));

  // convert nodefileData to JSON
  // Load JSON
  const headers = nodefileData.headers;
  const nodes = nodefileData.lines.map(l => {
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
        if (['id'].includes(internalLabel)) {
          // Note that Number("") => 0
          // We don't want empty ids to be converted to id 0
          // so we explicitly replace it with NaN
          node[internalLabel] = field==='' ? NaN : field; // ids are numbers
        } else if (['created', 'updated', 'revision'].includes(internalLabel)) {
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
  return nodes;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Load Edges from edge csv file
 * @param {object} edgefileData
 * @param {array} edgefileData.headers
 * @param {array} edgefileData.lines
 * @returns
 */
function m_LoadEdges(edgefileData) {
  // If edgefileData is not defined, just return an empty array
  if (!edgefileData || !edgefileData.headers || !edgefileData.lines) return [];

  // Retrieve import file node keys defined in template
  const TEMPLATE = UDATA.AppState('TEMPLATE');
  const EDGEKEYS = Object.values(TEMPLATE.edgeDefs).map(k => k.exportLabel);

  // Map import fields (exportLabel) to internal fields, e.g. ID => id,
  // essentially a reverse look up map
  const INTERNAL_FIELDS_MAP = new Map();
  Object.entries(TEMPLATE.edgeDefs).map(e => INTERNAL_FIELDS_MAP.set(e[1].exportLabel, e[0]));

  // convert edgefileData to JSON
  // Load JSON
  const headers = edgefileData.headers;
  const edges = edgefileData.lines.map(l => {
    const edge = {};
    const subcategories = new Map();
    const importFields = l.split(REGEXMatchCommasNotInQuotes); // ?=" needed to match commas in strings
    importFields.forEach((f, index) => {
      const field = f.replace(/^"/, "").replace(/"$/, ""); // strip quotes
      const key = headers[index];
      const keysplit = String(key).split(':');
      // Subcategory and subkey are DEPRECATED
      const subcategory = keysplit[0]; // e.g. 'attributes' of 'attributes:Node_type'
      const subkey = keysplit[1]; // e.g. 'Node_type'
      if (subkey) {
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
          edge[internalLabel] = field==='' ? NaN : field; // ids are numbers
        } else if (['created', 'updated', 'revision'].includes(internalLabel)) {
          if (edge.meta === undefined) edge.meta = {};
          edge.meta[internalLabel] = field;
        } else {
          edge[internalLabel] = field;
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
  return edges;
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
  if (source === undefined) edgeImportErrors.push(`Edge id ${edge.id}, row ${row} references unknown source node id ${edge.source} ${typeof edge.source}`);
  if (target === undefined) edgeImportErrors.push(`Edge id ${edge.id}, row ${row} references unknown target node id ${edge.target}`);
  return (source && target);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// MAIN IMPORT ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Import will first try to validate the data.  If the data is valid
 * it will write the results to the database and NCDATA AppState is updated.
 * If the data is not valid neither the database nor NCDATA will be updated.
 * @param {object} data - not used currently
 * @returns { error } - 'error' is 'undefined' if there are no errors
 *                      otherwise it is an array of error messages.
 */
MOD.Import = async data => {
  const importMsgs = []; // general non-error notes about the import
  const nodeImportErrors = [];
  const edgeImportErrors = [];
  const importNodes = m_LoadNodes(MOD.NodefileData);
  const importEdges = m_LoadEdges(MOD.EdgefileData);

  let NCDATA = clone(UDATA.AppState('NCDATA'));

  // A. Merge nodes to NCDATA
  const nodesToAdd = []; // [ node ]
  const nodesToReplace = []; // [ {node, index}, ... ]
  //    A1. Construct 'nodesToAdd' and 'nodesToReplace'
  importNodes.forEach((n, i) => {
    const row = i + 2; // to account for header row
    if (n.id === NEW_ID_KEYWORD) {
      //  A1.1 "new" node
      nodesToAdd.push(n);
    } else {
      n.id = Number(n.id); // csv imports as string, so convert to Number
      if (isNaN(n.id)) {
        // A1.2 Invalid node id, usually a string
        nodeImportErrors.push(`Node in row ${row} does not have a valid id.  Found: "${n.id}".`);
      } else {
        const existingNodeIdx = NCDATA.nodes.findIndex(node => node.id === n.id);
        if (existingNodeIdx > -1) {
          // A1.3 Replace existing node
          importMsgs.push(`Existing node id ${n.id} "${NCDATA.nodes[existingNodeIdx].label}" replaced by node "${n.label}" in row ${row} with matching id.`);
          nodesToReplace.push({ node: n, index: existingNodeIdx });
        } else {
          // A1.4 Referenced unknown id
          nodeImportErrors.push(`Node in row ${row} referenced unknown id "${n.id}".  Use id "${NEW_ID_KEYWORD}" to add a new node.`);
        }
      }
    }
  })
  //    A2. Modify NCDATA if there were no errors
  if (importNodes.length > 0 && nodeImportErrors.length < 1) {
    //   A2.1 Replace existing nodes
    nodesToReplace.forEach(def => { // def = {node, index}
      NCDATA.nodes.splice(def.index, 1, def.node);
    });
    //   A2.2 Add new nodes
    await DATASTORE.PromiseNewNodeIDs(nodesToAdd.length)
      .then(newNodeIDs => {
        nodesToAdd.forEach(node => {
          node.id = newNodeIDs.shift();
          importMsgs.push(`New node "${node.label}" with auto-generated id ${node.id} added.`);
          NCDATA.nodes.push(node);
        });
      });
  }

  // B. Merge edges to NCDATA
  const edgesToAdd = [];
  const edgesToReplace = [];
  //    B1. Construct 'edgesToAdd' and 'edgesToReplace'
  importEdges.forEach((e, i) => {
    const row = i + 2; // to account for header row

    // REVIEW: Recalculate edge size?
    e.size = 1; // Set default edge size

    // Make sure each edge has a valid source and target
    if (!m_hasValidSourceTarget(e, NCDATA, edgeImportErrors, row)) return;

    if (e.id === NEW_ID_KEYWORD) {
      // B1.1 New Edge
      edgesToAdd.push(e);
    } else {
      e.id = Number(e.id);
      if (isNaN(e.id)) {
        // B1.2 Invalid edge id, usually a string
        edgeImportErrors.push(`Edge in row ${row} does not have a valid id.  Found: "${e.id}".`);
      } else {
        const existingEdgeIdx = NCDATA.edges.find(existingEdge => e.id === existingEdge.id);
        if (existingEdgeIdx > -1) {
          // B1.3 Replace Existing Edge
          importMsgs.push(`Existing edge id ${existingEdgeIdx} replaced by edge in row ${row} with matching id.`);
          edgesToReplace.push({ edge: e, index: existingEdgeIdx });
        } else {
          // B1.4 Error Unknown Id
          edgeImportErrors.push(`Edge in row ${row} referenced unknown id "${e.id}".  Use id "${NEW_ID_KEYWORD}" to add a new edge.`);
        }
      }
    }
  })
  //    B2. Modify NCDATA if there were no errors
  if (importEdges.length > 0 && edgeImportErrors.length < 1) {
    //  B2.1 Replace existing edges
    edgesToReplace.forEach(def => { // def = {edge, index}
      NCDATA.edges.splice(def.index, 1, def.edge);
    });
    //  B2.2 Add new edges
    await DATASTORE.PromiseNewEdgeIDs(edgesToAdd.length)
      .then((newEdgeIDs) => {
        edgesToAdd.forEach(edge => {
          edge.id = newEdgeIDs.shift();
          importMsgs.push(`New edge with auto-generated id ${edge.id} added.`);
          NCDATA.edges.push(edge);
        });
      });
  }

  // C. Calculate degrees and sizes
  UTILS.RecalculateAllEdgeSizes(NCDATA);
  UTILS.RecalculateAllNodeDegrees(NCDATA);

  // D. Post summary of results
  importMsgs.unshift(`Edges -- Added: ${edgesToAdd.length} Replaced: ${edgesToReplace.length}`);
  importMsgs.unshift(`Nodes -- Added: ${nodesToAdd.length} Replaced: ${nodesToReplace.length}`);

  // E, If there were errors, abort!!!
  let errors = { messages: importMsgs };
  if (nodeImportErrors.length > 0) errors.nodeImportErrors = nodeImportErrors;
  if (edgeImportErrors.length > 0) errors.edgeImportErrors = edgeImportErrors;
  if (errors.nodeImportErrors || errors.edgeImportErrors) return errors;

  // F. Reset Form
  //    Clear file data, otherwise data will be re-used on next import
  MOD.NodefileData = {};
  MOD.EdgefileData = {};

  // G.  Write to database!
  const mergeData = { nodes: importNodes, edges: importEdges };
  UDATA.LocalCall("DB_MERGE", mergeData).then(res => {
    console.log('DB_MERGE Comlete.  Constructing graph and updating NCDATA', NCDATA)
    UDATA.LocalCall('CONSTRUCT_GRAPH').then(() => {
      UDATA.SetAppState("NCDATA", NCDATA); // data was merged into NCDATA before the merge, now publish it
    });
  });

  return { nodeImportErrors: undefined, edgeImportErrors: undefined, messages: importMsgs };
}


/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
