/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  A dependency-free environment detection for CJS codebases
  
  NOTES: The _ur_cli directory contains several 'task utilities' written for
  node as CommonJS. This is a requirement because the base project, NetCreate,
  is stuck using it due to the legacy nature of the project: it predates
  the use of ESM and the build system 'brunch' is not compatible with ESM.
  We can not upgrade the build system because the source files themselves are
  reliant on how brunch emulates a filesystem.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const { join, normalize } = require('node:path');
const { statSync } = require('node:fs');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - -
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - -
const ROOT = normalize(join(__dirname, '../'));

/// UTILITY METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return an absolute path string from root-relative path */
const u_path = (path = '') => {
  if (path.length === 0) return ROOT;
  path = normalize(join(ROOT, path));
  if (path.endsWith('/')) path = path.slice(0, -1);
  return path;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return true if the path exists and is a directory */
const u_exists = dirpath => {
  try {
    const stat = statSync(dirpath);
    if (stat.isFile()) return false;
    return stat.isDirectory();
  } catch (err) {
    console.log('*** DirExists:', err.message);
    return false;
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** remove ROOT prefix to return shortname */
const u_short = path => {
  if (path.startsWith(ROOT)) return path.slice(ROOT.length);
  return path;
};

/// RUNTIME CALCULATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: these are declared also in node-server/env-node.mts
const DIR_APP = u_path('/app');
const DIR_PUBLIC = u_path('/public');
const DIR_UR = u_path('/_ur');
const DIR_UR_DIST = u_path('/_ur/_dist');
const DIR_BDL_BROWSER = u_path('/_ur/browser-client');
const DIR_BDL_NODE = u_path('/_ur/node-server');
const DIR_URMODS = u_path('/_ur_mods');

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ROOT, // root of the project
  DIR_APP, // path of webbapp source code
  DIR_PUBLIC, // path to PUBLIC directory for serving webapp
  DIR_UR, // path to _ur directory
  DIR_UR_DIST, // path to browser client code
  DIR_BDL_BROWSER, // path to node server code
  DIR_BDL_NODE, // path to _ur/dist directory for library out
  DIR_URMODS, // path to _ur_mod directory
  //
  DirExists: u_exists,
  MakePath: u_path,
  ShortPath: u_short
};
