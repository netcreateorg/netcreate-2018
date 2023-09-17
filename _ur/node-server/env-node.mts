/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  node server environment is mirror of node builder environment, and is 
  designed to be initialized by @server.mts

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { join, normalize } from 'node:path';
import { DirExists } from './files.mts';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - -
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - -
let ROOT: string = ''; // root of the project
let DIR_PUBLIC: string; // path to PUBLIC directory for webapp
let DIR_UR: string; // path to _ur directory
let DIR_PACKAGE: string; // path to browser client code
let DIR_BDL_BROWSER: string; // path to node server code
let DIR_BDL_NODE: string; // path to _ur/dist directory for library out
let DIR_URMODS: string; // path to _ur_mod directory
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return an absolute path string from root-relative path */
const u_path = (path = '') => {
  if (ROOT === '') throw new Error('SetRoot() must be called');
  if (path.length === 0) return ROOT;
  path = normalize(join(ROOT, path));
  if (path.endsWith('/')) path = path.slice(0, -1);
  return path;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** remove ROOT prefix to return shortname */
const u_short = path => {
  if (path.startsWith(ROOT)) return path.slice(ROOT.length);
  return path;
};

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Because we can't use __dirname in ESM or or conditionally run code without
 *  esbuild complaining about it, require external setting from the native
 *  environment.
 */
function SetRootPaths(path: string) {
  if (ROOT.length > 0) return GetPaths();
  if (DirExists(path)) {
    ROOT = path;
    DIR_PUBLIC = u_path('/public');
    DIR_UR = u_path('/_ur');
    DIR_PACKAGE = u_path('/_ur/_dist');
    DIR_BDL_BROWSER = u_path('/_ur/browser-client');
    DIR_BDL_NODE = u_path('/_ur/node-server');
    DIR_URMODS = u_path('/_ur_mods');
    if (DBG) {
      console.log(DIR_PUBLIC);
      console.log(DIR_UR);
      console.log(DIR_PACKAGE);
      console.log(DIR_BDL_BROWSER);
      console.log(DIR_BDL_NODE);
      console.log(DIR_URMODS);
    }
    return GetPaths();
  }
  console.log(`SetRoot: ${path} does not exist`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return object with all current paths defined */
function GetPaths() {
  if (ROOT === '') throw new Error('GetPath: SetRoot() has to be called prior');
  return {
    ROOT,
    DIR_PUBLIC,
    DIR_UR,
    DIR_BDL_BROWSER,
    DIR_BDL_NODE,
    DIR_PACKAGE,
    DIR_URMODS
  };
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  // API METHODS
  SetRootPaths,
  GetPaths,
  // UTILITY METHODS
  DirExists,
  u_path as MakePath,
  u_short as ShortPath,
  // CONSTANTS
  ROOT,
  DIR_PUBLIC,
  DIR_UR,
  DIR_BDL_BROWSER,
  DIR_BDL_NODE,
  DIR_PACKAGE,
  DIR_URMODS
};
