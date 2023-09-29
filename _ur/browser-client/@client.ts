/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  entrypoint for client

  when making live changes, make sure that the ur builder is also running and
  users of this library are watching for changes to the ur library

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

// note: cjs-style modules in 'common' can not be destructured on import
import PROMPTS from '../common/prompts.js';
const { makeStyleFormatter } = PROMPTS;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = makeStyleFormatter('UR', 'TagCyan');

/// TEST METHODS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ClientTest(): void {
  console.log(...PR('System Integration of new URSYS module successful!'));
  // console.log(...PR('@ursys/netcreate integration...works?'));
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { ClientTest, makeStyleFormatter as PrefixStyler };
