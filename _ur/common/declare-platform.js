/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Utility to detect the JS environment independent of the module system or
  platform.  This is useful for code that needs to run in both Node and
  Browser environments.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** MODULE TYPE RETURN OBJECT
 *  @typedef {Object} ModuleSystemInfo
 *  @property {string[]} [node] - NodeJS environment type, description
 *  @property {string[]} [browser] - Browser environment type, description
 *  @property {string} [error] - error string
 *  @property {boolean} _init -  for internal use only
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// typeof ModuleSystemInfo
const INFO = {
  _init: false
};

/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Detects the module system in use and returns an object with either
 *  node, browser, or error properties.
 *  @returns {ModuleSystemInfo}
 */
function m_DetectModuleSystem() {
  // only run this code once
  if (INFO._init) {
    console.log('...skipping duplicate environment detection');
    return;
  }
  // Check for Node.js environment first
  if (process !== undefined && process.versions && process.versions.node) {
    if (typeof module !== 'undefined' && module.exports) {
      INFO.node = ['CJS', 'Node.js - CommonJS environment'];
    } else if (typeof import.meta !== 'undefined') {
      INFO.node = ['ESM', 'Node.js - CommonJS environment'];
    }
  } else if (window !== undefined) {
    // Check for Browser environment
    // eslint-disable-next-line no-undef
    if (typeof define === 'function' && define.amd) {
      INFO.browser = ['AMD', 'Browser - AMD maybe through UMD import'];
    } else if (document.currentScript && document.currentScript.type === 'module') {
      INFO.browser = ['ESM', 'Browser - ESM'];
    } else if (typeof module === 'function' && module.exports) {
      INFO.browser = [
        'CJS',
        'Browser - CJS maybe via a bundler like Browserify or Webpack'
      ];
    } else {
      INFO.browser = ['TAG', 'Browser - Script (traditional script tag)'];
    }
  } else {
    INFO.error = 'Unknown environment';
  }
  INFO._init = true;
}

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** utility to detect browser environment */
function IsBrowser() {
  return INFO.browser !== undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** utility to detect node environment */
function IsNode() {
  return INFO.node !== undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsNodeCJS() {
  if (INFO.node === undefined) {
    console.warn('IsNodeCJS() called outside of node environment');
    return false;
  }
  return INFO.node[0] === 'CJS';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsNodeESM() {
  if (INFO.node === undefined) {
    console.warn('IsNodeCJS() called outside of node environment');
    return false;
  }
  return INFO.node[0] === 'ESM';
}

/// ON MODULE INIT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
m_DetectModuleSystem(); // set the INFO object

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  IsBrowser, // return true if browser env detected
  IsNode, // return true if nodejs env deteted
  IsNodeCJS, // return true if nodejs CJS module system detected
  IsNodeESM // return true if nodejs ESM module system detected
};
