/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  All declare modules are dependency-free so can be imported by anyone

  These are the model for the MAIN FUNCTIONAL SCOPE of a module. Ideally
  I think each module would have only one such scope; if there is a need for
  multiple things then a higher-level aggregating manager would do that.
  For example: APPCORE modules, DATACORE modules, LOGIC and CONDITIONS.

  PLACEHOLDER WIP

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// these are modules that all emit events and use a common API syntax as much
/// as possible
const SUPPORT_MODULES = [
  'collection', // common API for mutable dictionaries, objects, maps, arrays
  'resource-pool', // common API for managing static resources
  'monitors', // common API for monitoring changes in
  'event-emitter', // implement register/subscribe functions for local modules
  'sequencer', // implement notion of sequential operations that complete
  'timer', // implement timers with common events
  'graph', // implement network graphs
  'state-machine', // implement state and state changes
  'lifecycle', // implement sequenced state changes
  'action-queue', // manages a queue of actions to be handled in the order received
  'dispatcher', // handles logic to determine what to do when an "action" is queued
  'ui-component', // a self-contained visual element
  //
  'ur-network', // app network communication
  'ur-messages', // remote channel-based message passing/receiving
  'ur-services', // registering and unregistering ur services (built on ur-messages)
  'ur-inputs', // implement controller devices on ur-network
  'ur-outputs', // implement display/sound devices on ur-network
  'ur-data-ex' // a stream-like protocol for data exchange, tied to ur-messages
  //
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// higher level modules perform distinct functions
const MODULE_ROLES = [
  'remote-collection', // manages and synchronized with a remote datastore (db, file)
  'runtime-collection', // provides API for getting collections
  'datacore', // the unasailable "pure data" representation single source of truth
  'dataset', // app-specific "pure data" store, using a collection
  'dataset-transform', // app-specific transformer of data to derived data
  'dataset-analyzer', // returns information based on a dataset
  'dataset-exchanger', // serialize and import/export dataset to other formats
  'watch-data-events', // app-specific module that watches for data events
  'watch-condition-events', // app-specific module that watches for changes in any condition
  'manage-transaction', // app-specific module that manages async transaction
  'app-state', // app-specific representation of application state that affect runtime ops
  'ui-state', // app-specific representation of the UI display (not same as app state)
  'app-core', // centralized manager of a set of events (the VM in MVVM)
  'app-lifecycle', // app-specific management of startup, run, shutdown
  'app-display' // app-specific manager of the overall screen where everything appears
];
