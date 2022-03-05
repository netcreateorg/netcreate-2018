/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  * Import / Export Logic

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;
const PR = 'importexport-logic: ';

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS = require("unisys/client");
const TOML = require("@iarna/toml");
const clone = require("rfdc")();

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MOD = UNISYS.NewModule(module.id);
var UDATA = UNISYS.NewDataLink(MOD);

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// For CSV Importing
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
  // encode carriage returns
  res = String(res).replace(/\n/g, 'nnn');
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
/*/ Returns an array of export values for a given node record
    Used during export.
    e.g. [1,'Tacitus','Person',...]
/*/
function m_getNodeValues(node, keys) {
  const RESULT = [];
  keys.forEach(key => {
    // If the key is an object, recurse
    // eslint-disable-next-line prefer-reflect
    if (Object.prototype.toString.call(key) === '[object Object]') {
      // DEPRECATED -- 'attribute' handler.
      const subKeys = Object.keys(key); // can have multiple subKeys
      subKeys.forEach(k => {
        RESULT.push(m_getNodeValues(node[k], key[k]));
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
/*/ Returns an array of node records
    Used during export.
    e.g. [[<tacitus>], [<marc antony>], ...]
/*/
function m_GenerateNodesArray(nodes, nodekeys) {
  /// Define Node KEYS
  const nodesArr = [];
  nodes.forEach(n => nodesArr.push(m_getNodeValues(n, nodekeys)));
  return nodesArr;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Returns an array of values for a given edge record
    Used during export.
    e.g. [1,'Tacitus','Person',...]
/*/
function m_getEdgeValues(edge, keys) {
  const RESULT = [];
  keys.forEach(key => {
    // If the key is an object, recurse
    // eslint-disable-next-line prefer-reflect
    if (Object.prototype.toString.call(key) === '[object Object]') {
      // DEPRECATED -- 'attribute' handler.
      const subKeys = Object.keys(key); // can have multiple subKeys
      subKeys.forEach(k => {
        RESULT.push( m_getNodeValues(edge[k], key[k]) );
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
      RESULT.push(`"${edge[key]}"`); // enclose in quotes to support commas
      return;
    }
    // -- Else, data missing/not defined, add empty string
    RESULT.push("");
  })
  return RESULT;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Returns an array of edge records
    Used during export.
    e.g. [ [<tacitus>], [<marc antony>], ...]
/*/
function m_GenerateEdgesArray(edges, edgekeys) {
  /// Define Edge KEYS
  const edgeArr = [];
  edges.forEach(e => edgeArr.push(m_getEdgeValues(e, edgekeys)));
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
  /// Use nodekeys from TEMPLATE
  const nodekeys = Object.keys(TEMPLATE.nodeDefs);
  const nodesArr = m_GenerateNodesArray(nodes, nodekeys);

  /// 2. Expand to CSV
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  ///    3.1. NODES
  ///    3.1.1. Create headers
  const nodeHeadersArr = nodekeys.map(key => {
    // eslint-disable-next-line prefer-reflect
    if (Object.prototype.toString.call(key) === '[object Object]') {
      // DEPRECATED -- 'attribute' handler.
      throw new Error(`Unexpected node type for ${key}`);
      // This shouldn't be called anymore as of 2/2022 because the data fields
      // have been flattened. See #198.
      // const subKeys = Object.keys(key); // can have multiple subKeys
      // const internalkeys = subKeys.map(sk => key[sk].map(k => `${sk}:${k}`)).flat();
      // return internalkeys.map(k => NODEKEY_LABELS[k]);
    } else {
      // return NODEKEY_LABELS[key];
      return TEMPLATE.nodeDefs[key].exportLabel;
    }
  });
  const nodeHeaders = nodeHeadersArr.flat();
  nodesArr.unshift(nodeHeaders); // add headers
  ///    3.1.2. Expand Nodes to CSV
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
  // Use edgekeys from TEMPLATE
  const edgekeys = Object.keys(TEMPLATE.edgeDefs);
  const edgesArr = m_GenerateEdgesArray(edges, edgekeys);

  /// 3. Expand to CSV
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  ///   3.1. EDGES
  ///   3.1.1. Create headers
  const edgeHeadersArr = edgekeys.map(key => {
    // eslint-disable-next-line prefer-reflect
    if (Object.prototype.toString.call(key) === '[object Object]') {
      // DEPRECATED -- 'attribute' handler.
      const subKeys = Object.keys(key); // can have multiple subKeys
      return subKeys.map(sk => key[sk].map(k => `${sk}:${k}`)).flat();
    } else {
      return TEMPLATE.edgeDefs[key].exportLabel;
    }
  });
  const edgeHeaders = edgeHeadersArr.flat();
  edgesArr.unshift(edgeHeaders); // add headers
  ///   3.2.2 Expand Edges to CSV
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

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// IMPORT NODES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// This only checks to make sure the expected headers are present
/// It does not actually validate the data
/// Headers are defined in the template schema.
MOD.ValidateNodeFile = async data => {
  let isValid = true;
  let missingKeys = [];

  // Retrieve import file node keys defined in template
  const TEMPLATE = UDATA.AppState('TEMPLATE');
  const NODEKEYS = Object.values(TEMPLATE.nodeDefs).map(k => k.exportLabel);

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
  nodeKeys.forEach(n => {
    if (!fileKeys.includes(n)) {
      isValid = false;
      missingKeys.push(n);
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
  const EDGEKEYS = Object.values(TEMPLATE.edgeDefs).map(k => k.exportLabel);

  const { edgefile } = data;
  if (edgefile===undefined) return { isValid: false, missingKeys, fileKeys: []}; // User cancelled
  let result = await edgefile.text();
  // Validate Data
  const lines = result.split(/\r\n|\n/);
  // First line should list the headers
  // Remove headers, so 'lines' is just data
  const headers = lines.shift().split(',');
  // get keys
  const edgeKeys = m_flattenKeys(EDGEKEYS);
  const fileKeys = m_flattenKeys(headers);
  // check that ALL nodeKeys are in the fileKeys
  edgeKeys.forEach(n => {
    if (!fileKeys.includes(n)) {
      isValid = false;
      missingKeys.push(n);
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

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// IMPORT
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
        if (['id'].includes(internalLabel)) {
          node[internalLabel] = Number(field); // ids are numbers
        } else if (['created', 'updated', 'revision'].includes(internalLabel)) {
          if (node.meta === undefined) node.meta = {};
          node.meta[internalLabel] = field;
        } else {
          node[internalLabel] = field;
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
          // don't replace bad ids with 0
          edge[internalLabel] = field==='' ? NaN : Number(field); // ids are numbers
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

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Import
/**
 * Import will first try to validate the data.  If the data is valid
 * it will write the results to the database and NCDATA AppState is updated.
 * If the data is not valid neither the database nor NCDATA will be updated.
 * @param {object} data - not used currently
 * @returns { error } - 'error' is 'undefined' if there are no errors
 *                      otherwise it is an array of error messages.
 */
MOD.Import = data => {
  let errMsgs = [];
  const importNodes = m_LoadNodes(MOD.NodefileData);
  const importEdges = m_LoadEdges(MOD.EdgefileData);
  const mergeData = { nodes: importNodes, edges: importEdges }

  // Validate Data
  const NCDATA = clone(UDATA.AppState('NCDATA'));
  // 1. Merge nodes to NCDATA
  importNodes.forEach(n => {
    const i = NCDATA.nodes.findIndex(dn => dn.id === n.id);
    if (i > -1) {
      NCDATA.nodes.splice(i, 1, n); // Replace existing node
    } else {
      NCDATA.nodes.push(n); // Insert new node
    }
  });
  // 2. Merge edges to NCDATA
  importEdges.forEach(e => {
    // Validate Edges
    // Make sure each edge has a valid source and target
    const source = NCDATA.nodes.find(n => n.id === e.source);
    const target = NCDATA.nodes.find(n => n.id === e.target);
    if (source === undefined) errMsgs.push(`Edge id ${e.id} references unknown source node id ${e.source}`);
    if (target === undefined) errMsgs.push(`Edge id ${e.id} references unknown target node id ${e.target}`);

    if (source && target) {
      // Set default edge size
      // REVIEW: Recalculate edge size?
      e.size = 1;

      const i = NCDATA.edges.findIndex(de => de.id === e.id);
      if (i > -1) {
        NCDATA.edges.splice(i, 1, e);  // Replace existing edge
      } else {
        NCDATA.edges.push(e); // Insert new edge
      }
    }
  })

  // If there were errors, abort!!!
  if (errMsgs.length > 0) return { error: errMsgs };

  // Write to database!
  UDATA.LocalCall("DB_MERGE", mergeData).then(res => {
    UDATA.LocalCall('CONSTRUCT_GRAPH');
    UDATA.SetAppState("NCDATA", NCDATA); // data was merged into NCDATA before the merge, now publish it
 });

  return { error: undefined };
}


/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
