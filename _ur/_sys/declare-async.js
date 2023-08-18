/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  All declare modules are dependency-free so can be imported by anyone

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// MAIN LIFECYCLE EVENTS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// This is a standardized lifecycle for our applications. These are
/// the lifecycle events that fire and can be hooked by interested modules
const APP_LIFECYCLE = {
  SETUP: [
    'INITIALIZE', // module data structure init
    'NETWORK', // connected to network
    'CONNECT', // connected as registered UR application
    'LOAD', // load any external data, make connections
    'CONFIG', // configure runtime data structures
    'ALLOCATE' // alloca
  ],
  RUN: [
    'READY', // when viewsystem has completely composed
    'START', // start normal execution run
    'RUN', // system starts running
    'UPDATE', // system is running (periodic call w/ time)
    'STATUS', // system status message
    'STOP' // system wants to stop current rons
  ],
  ASYNC: [
    'FREEZE', // system wants to pause run
    'UNFREEZE' // system has paused (periodic call w/ time)
  ],
  SHUTDOWN: [
    'DEALLOCATE', // release memory resourcesun
    'UNLOAD', // system releases any connecti
    'SHUTDOWN', // system is shutting down
    'ZOMBIE', // system is dead and needs to reinitialize
    'EXIT' // system has ended
  ],
  EXCEPTION: [
    'DISCONNECT', // unisys server has gone offline
    'RECONNECT', // unisys server has reconnected
    'NETWORK_LOST', // network connection lost
    'APP_HALT' // system and thrown an error
  ]
};

/// CHILD STATUS EVENTS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// These are events emitted by a UR-format command module The key ones are
/// MESSAGE and STOP or EXIT
const UR_EVENTS = {
  DATAEX: [
    // upstream module messages to downstream module
    'DATA', // data: chunk from upstream module
    'RESPONSE', // control: response from upstream module
    // downstream module messages to upstream module
    'initialize', // status: downstream module init
    'start', // status:about to start
    'run', // status: has started running
    'status', // status: periodic update
    'error', // status: process-terminating error, w status
    'stop', // status: process stoppeed
    'exit', // status: process terminated w/ errcode
    'request' // control: request upstream RESPONSE
  ]
};

/// NODEJS EVENT EMITTER //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// these
const EMITTER = {
  addListener: (event, listener) => {},
  emit: (event, [...args]) => {},
  eventNames: () => {},
  getMaxListeners: () => {},
  listenerCount: eventName => {},
  listeners: eventName => {},
  off: (eventName, listener) => {},
  on: (eventName, listener) => {},
  once: (eventName, listener) => {},
  prependListener: (eventName, listener) => {},
  prependOnceListener: (eventName, listener) => {},
  removeAllListeners: ([eventName]) => {},
  removeListener: (eventName, listener) => {},
  setMaxListeners: n => {},
  rawListeners: eventName => {}
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  APP_LIFECYCLE,
  UR_EVENTS
};
