/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UR IPC

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = require('./prompts').makeTerminalOut(' URPC', 'TagGreen');

/// MAIN LIFECYCLE EVENTS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// INFO: This is a standardized lifecycle for our applications. These are
/// the lifecycle events that fire and can be hooked by interested modules
const LF_APP = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** add names to dictionary from a provided names array */
function m_AddGroup(dict = {}, start = 0, namesArray = [], increment = 10) {
  const usedValues = new Set();
  // any values reused?
  Object.values(dict).forEach(v => {
    if (usedValues.has(v)) console.warn('found duplicate value in dict', v);
    usedValues.add(v);
  });
  let value = start;
  // add values to matched names
  namesArray.forEach(name => {
    if (name !== name.toUpperCase()) console.warn('name should be uppercase');
    if (dict[name] !== undefined) console.warn('duplicate name in dict', name);
    dict[name] = value;
    if (usedValues.has(value)) console.warn('duplicate value set', value);
    TERM(`wrote '${name}':${value}`);
    value += increment;
  });
  return dict;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// pre-run operations
m_AddGroup(LF_APP, 100, [
  'INITIALIZE', // module data structure init
  'CONNECT', // connected to parent messaging system
  'LOAD', // load any external data, make connections
  'CONFIG', // configure runtime data structures
  'ALLOCATE' // allocate memory resources
]);
// run operations
m_AddGroup(LF_APP, 200, [
  'READY', // when viewsystem has completely composed
  'START', // start normal execution run
  'RUN', // system starts running
  'UPDATE', // system is running (periodic call w/ time)
  'STATUS', // system status message
  'STOP' // system wants to stop current rons
]);
// runtime operations
m_AddGroup(
  LF_APP,
  300,
  [
    'FREEZE', // system wants to pause run
    'UNFREEZE', // system has paused (periodic call w/ time)
    'DISCONNECT', // unisys server has gone offline
    'RECONNECT' // unisys server has reconnected
  ],
  1
);
// post-run operations
m_AddGroup(LF_APP, 400, [
  'DEALLOCATE', // release memory resourcesun
  'UNLOAD', // system releases any connecti
  'SHUTDOWN', // system is shutting down
  'ZOMBIE' // system is dead and needs to reinitialize
]);
// showstopping errors
m_AddGroup(LF_APP, 900, [
  'EXCEPTION', // general exception
  'NETWORK_LOST' // connection list
]);

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// INFO: When a CHILD process or WORKER starts, it
const CMD = {
  'INITIALIZE': 0
};

/// METHODS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
console.log(LF_APP);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {};
