/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UR PARSE module

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const { fork } = require('node:child_process');

/// STATE /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let proc_PEGGY;
const TERM = require('../_lib/prompts').makeTerminalOut('-@init', 'TagGray');

/// RUN NODE COMMAND /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function InitializePeggy() {
  try {
    proc_PEGGY = fork('./x-peggy.js');
  } catch (err) {
    TERM(err.toString());
  }
  proc_PEGGY.on('message', msg => {
    TERM('peggy:', msg);
    if (typeof msg !== 'string') msg = JSON.stringify(msg);
    process.send(msg);
  });
  proc_PEGGY.on('error', err => {
    console.error('peggy:error:', err);
  });
  process.send('PeggyInitialized as fork of x-peggy.js');
}

/// FIRST RUN /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
(async () => {
  // InitializePeggy();
  // process.on('message', msg => proc_PEGGY.send(msg));
})();
