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
  FORK: [
    'initialize', // module data structure init
    'start', // start normal execution run
    'run', // system starts running
    'update', // system is running (periodic call w/ time)
    'message', // data produced by the child
    'stop', // system wants to stop current rons
    'exit' // system has ended
  ]
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  APP_LIFECYCLE,
  UR_EVENTS
};
