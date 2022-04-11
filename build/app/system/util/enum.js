
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Enumerators

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const ENUM = {};

// EDITORTYPE handles network edit locking messages
ENUM.EDITORTYPE = {
  TEMPLATE: 'template',
  IMPORTER: 'importer',
  NODE: 'node', // parameter sent with packet, listed here for coverage
  EDGE: 'edge'  // parameter sent with packet, listed here for coverage
};

module.exports = ENUM;
