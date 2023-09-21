/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  entrypoint for client

  when making live changes, make sure that the ur builder is also running and
  users of this library are watching for changes to the ur library

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

// cjs-style modules
import PROMPTS from '../common/prompts.js';
const { makeStyleFormatter: MakeLogger } = PROMPTS;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = MakeLogger('UR', 'TagCyan');

/// TEST METHODS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ClientTest() {
  console.log(...PR('System Integration of new URSYS module successful!'));
  // console.log(...PR('@ursys/netcreate integration...works?'));
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { ClientTest, MakeLogger };
