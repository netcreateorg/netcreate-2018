/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  entrypoint for server

  when making live changes, make sure that the ur builder is also running and
  users of this library are watching for changes to the ur library

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UrModule from './class-urmodule.mts';
import * as MODMGR from './urmod-mgr.mts';
import * as APPSERV from './appserver.mts';
import * as ENV from './env-node.mts';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// RUNTIME API ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** first time initialization */
function Initialize(options: UR_InitOptions): void {
  const { rootDir } = options;
  ENV.SetRootPaths(rootDir);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  // URSYS CONTROL
  Initialize,
  // MAIN MODULES
  APPSERV, // application server
  MODMGR, // ur module manager
  ENV, // environment utilities and constants
  // CLASSES
  UrModule // ur module wrapper
};
