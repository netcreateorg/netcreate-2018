/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UR PARSE module

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const { fork } = require('child_process');

/// STATE /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let OUT = 'ExecPeg';
let PEGGY;

/// RUN NODE COMMAND /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ExecPeg() {
  try {
    PEGGY = fork('./x-peggy.js');
  } catch (err) {
    console.log(err.toString());
  }
  PEGGY.on('message', msg => {
    console.log('peggy:', msg);
  });
  PEGGY.on('error', err => {
    console.error('peggy:error:', err);
  });
}

/// FIRST RUN /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ExecPeg();
