/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  * Export Logic

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS = require("unisys/client");

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MOD = UNISYS.NewModule(module.id);
var UDATA = UNISYS.NewDataLink(MOD);

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Define Node KEYS to export
/// Subkeys are mapped with a `:`, e.g. attributes:Node_Type
/// REVIEW: Should this be defined in the Template?
const NODEKEYS = [
  'id',
  'label',
  { 'attributes': ['Node_Type', 'Extra Info', 'Notes'] },
  'degrees',
  { 'meta': ['created', 'updated']}
];
/// Export Labels -- Exported data uses these labels as headers
/// During the export, we do a simple key lookup to match the label
/// e.g. 'id' becomes 'ID' in the exported file
const NODEKEY_LABELS = {
  'id': 'ID',
  'label': 'Label',
  'attributes:Node_Type': 'Attributes:Node_Type',
  'attributes:Extra Info': 'Attributes:Extra Info',
  'attributes:Nodes': 'Attributes:Notes',
  'degrees': 'Degrees',
  'meta:created': 'Meta:Created',
  'meta:updated': 'Meta:Updated'
}
const EDGEKEYS = [
  'id',
  'source',
  'target',
  { 'attributes': ['Relationship', 'Info', 'Citations', 'Category', 'Notes'] },
  { 'meta': ['created', 'updated']}
];

/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function m_formatDate(date) {
  // wrap in quotes because time includes a comma
  if (date) return `"${new Date(date).toUTCString()}"`;
  return '';
}

function m_encode(data) {
  // double quotes need to be escaped
  return String(data).replace(/"/g, '""');
}

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
    e.g. [1,'Tacitus','Person',...]
/*/
function m_getNodeValues(node, keys) {
  const RESULT = [];
  keys.forEach(key => {
    // If the key is an object, recurse
    // eslint-disable-next-line prefer-reflect
    if (Object.prototype.toString.call(key) === '[object Object]') {
      const subKeys = Object.keys(key); // can have multiple subKeys
      subKeys.forEach(k => {
        RESULT.push( m_getNodeValues(node[k], key[k]) );
      });
    }
    // Special Data Handling
    // -- DATE
    if (['created', 'updated'].includes(key)) {
      RESULT.push(m_formatDate(node[key]));
      return;
    }
    // Else, normal processing
    if (node.hasOwnProperty(key)) RESULT.push(`"${m_encode(node[key])}"`); // enclose in quotes to support commas
  })
  return RESULT;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Returns an array of node records
    e.g. [[<tacitus>], [<marc antony>], ...]
/*/
function m_GenerateNodesArray(nodes, nodekeys) {
  /// Define Node KEYS
  const nodesArr = [];
  nodes.forEach(n => nodesArr.push(m_getNodeValues(n, nodekeys)));
  return nodesArr;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Returns an array of values for a given node record
    e.g. [1,'Tacitus','Person',...]
/*/
function m_getEdgeValues(edge, keys) {
  const RESULT = [];
  keys.forEach(key => {
    // If the key is an object, recurse
    // eslint-disable-next-line prefer-reflect
    if (Object.prototype.toString.call(key) === '[object Object]') {
      const subKeys = Object.keys(key); // can have multiple subKeys
      subKeys.forEach(k => {
        RESULT.push( m_getNodeValues(edge[k], key[k]) );
      });
    }
    // Special Data Handling
    // -- SOURCE / TARGET
    if (['source', 'target'].includes(key)) {
      RESULT.push(edge[key].id);
      return;
    }
    // -- DATE
    if (['created', 'updated'].includes(key)) {
      RESULT.push(m_formatDate(edge[key]));
      return;
    }
    // Else, normal processing
    if (edge.hasOwnProperty(key)) RESULT.push(`"${edge[key]}"`); // enclose in quotes to support commas
  })
  return RESULT;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Returns an array of node records
    e.g. [ [<tacitus>], [<marc antony>], ...]
/*/
function m_GenerateEdgesArray(edges, edgekeys) {
  /// Define Edge KEYS
  const edgeArr = [];
  edges.forEach(e => edgeArr.push(m_getEdgeValues(e, edgekeys)));
  return edgeArr;
}

///////////////////////////////////////////////////////////////////////////////
/// MODULE EXPORT METHODS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// EXPORT NODES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Exports FILTERED data, not the full data set.
MOD.ExportNodes = () => {
  const DATA = UDATA.AppState('FILTEREDD3DATA');
  const { nodes } = DATA;
  let EXPORT = '';

  /// 1. Export Nodes
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Define Node KEYS to export
  const nodesArr = m_GenerateNodesArray(nodes, NODEKEYS);

  /// 2. Expand to CSV
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  ///    3.1. NODES
  ///    3.1.1. Create headers
  const nodeHeadersArr = NODEKEYS.map(key => {
    // eslint-disable-next-line prefer-reflect
    if (Object.prototype.toString.call(key) === '[object Object]') {
      const subKeys = Object.keys(key); // can have multiple subKeys
      const internalkeys = subKeys.map(sk => key[sk].map(k => `${sk}:${k}`)).flat();
      return internalkeys.map(k => NODEKEY_LABELS[k]);
    } else {
      return NODEKEY_LABELS[key];
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
  const { edges } = DATA;
  let EXPORT = '';

  /// 1. Export Edges
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Define Edge KEYS
  const edgesArr = m_GenerateEdgesArray(edges, EDGEKEYS);

  /// 3. Expand to CSV
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  ///   3.1. EDGES
  ///   3.1.1. Create headers
  const edgeHeadersArr = EDGEKEYS.map(key => {
    // eslint-disable-next-line prefer-reflect
    if (Object.prototype.toString.call(key) === '[object Object]') {
      const subKeys = Object.keys(key); // can have multiple subKeys
      return subKeys.map(sk => key[sk].map(k => `${sk}:${k}`)).flat();
    } else {
      return key;
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
/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
