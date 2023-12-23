/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  A dependency-free environment detection for CJS codebases

  Similar to _ur/env-ur.cjs, but for the _ur_mods directory. Relies only on
  internal node modules

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
const DIR_URMODS = u_path('/_ur_mods');
const DIR_URMODS_DIST = u_path('/_ur_mods/_dist');

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ROOT, // root of the project
  DIR_URMODS, // path to _ur_mod directory
  DIR_URMODS_DIST, // path to _ur_mods/_dist directory for library out
  //
  DirExists: u_exists,
  MakePath: u_path,
  ShortPath: u_short
};
