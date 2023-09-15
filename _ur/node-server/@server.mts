/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  entrypoint for server

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UrModule from './class-urmodule.mts';
import * as Fork from './ur-proc.mts';
import * as AppServer from './appserver.mts';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// do not use 'export default' for library entrypoints because esbuild will
/// not convert the bundle to a commonjs module without .default appended
/// e.g. require('server').default if you uses export default
export { UrModule, Fork, AppServer };
