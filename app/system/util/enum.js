/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Enumerators

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ENUM = {};
// EDITORTYPE handles network edit locking messages
ENUM.EDITORTYPE = {
  TEMPLATE: 'template',
  IMPORTER: 'importer',
  NODE: 'node', // parameter sent with packet, listed here for coverage
  EDGE: 'edge' // parameter sent with packet, listed here for coverage
};
// BUILT-IN FIELDS
ENUM.BUILTIN_FIELDS_NODE = [
  'id',
  'label',
  'provenance',
  'degrees',
  'created',
  'updated',
  'revision'
];
ENUM.BUILTIN_FIELDS_EDGE = [
  'id',
  'source',
  'target',
  'provenance',
  'degrees',
  'created',
  'updated',
  'revision',
  'sourceLabel', // used internally for filters
  'targetLabel' // used internally for filters
];

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = ENUM;
