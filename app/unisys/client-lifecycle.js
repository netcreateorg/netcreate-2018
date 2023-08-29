if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  LifeCycle - A system manager for application lifecycle events.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const PATH = require('system/util/path');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = window.NC_DBG && window.NC_DBG.lifecycle;
const BAD_PATH = "module_path must be a string derived from the module's module.id";
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var PHASE_HOOKS = new Map(); // functions that might right a Promise
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PHASES = [
  'TEST_CONF', // setup tests
  'INITIALIZE', // module data structure init
  'LOADASSETS', // load any external data, make connections
  'CONFIGURE', // configure runtime data structures
  'DOM_READY', // when viewsystem has completely composed
  'RESET', // reset runtime data structures
  'START', // start normal execution run
  'APP_READY', // synchronize to UNISYS network server
  'RUN', // system starts running
  'UPDATE', // system is running (periodic call w/ time)
  'PREPAUSE', // system wants to pause run
  'PAUSE', // system has paused (periodic call w/ time)
  'POSTPAUSE', // system wants to resume running
  'STOP', // system wants to stop current run
  'DISCONNECT', // unisys server has gone offline
  'RECONNECT', // unisys server has reconnected
  'UNLOADASSETS', // system releases any connections
  'SHUTDOWN' // system wants to shut down
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var PHASE = PHASES[0] + '_PENDING'; // current phase

/// MODULE DEFINITION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MOD = {
  name: 'LifeCycle',
  scope: 'system/booting' // overwritten by UNISYS.SystemInitialize()
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** UTILITY: compare the destination scope with the acceptable scope (the
    module.id of the root JSX component in a view). Any module not in the
    system directory will not get called
 */
function m_ExecuteScopedPhase(phase, o) {
  // check for special unisys or system directory
  if (o.scope.indexOf('system') === 0) return o.f();
  if (o.scope.indexOf('unisys') === 0) return o.f();
  // check for subdirectory
  if (o.scope.includes(MOD.scope, 0)) return o.f();
  // else do nothing
  if (DBG)
    console.info(
      `LIFECYCLE: skipping [${phase}] for ${o.scope} because scope is ${MOD.scope}`
    );
  return undefined;
}

/// LIFECYCLE METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: register a Phase Handler which is invoked by MOD.Execute()
    phase is a string constant from PHASES array above
    f is a function that does work immediately, or returns a Promise
 */
MOD.Hook = (phase, f, scope) => {
  // make sure scope is included
  if (typeof scope !== 'string')
    throw Error(`<arg3> scope is required (set to module.id)`);
  // does this phase exist?
  if (typeof phase !== 'string')
    throw Error("<arg1> must be PHASENAME (e.g. 'LOADASSETS')");
  if (!PHASES.includes(phase))
    throw Error(phase, 'is not a recognized lifecycle phase');
  // did we also get a promise?
  if (!(f instanceof Function))
    throw Error('<arg2> must be a function optionally returning Promise');

  // get the list of promises associated with this phase
  // and add the new promise
  if (!PHASE_HOOKS.has(phase)) PHASE_HOOKS.set(phase, []);
  PHASE_HOOKS.get(phase).push({ f, scope });
  if (DBG) console.log(`[${phase}] added handler`);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Execute all Promises associated with a phase, completing when
    all the callback functions complete. If the callback function returns
    a Promise, this is added to a list of Promises to wait for before the
    function returns control to the calling code.
 */
MOD.Execute = async phase => {
  // require scope to be set
  if (MOD.scope === false)
    throw Error(
      `UNISYS.SetScope() must be set to RootJSX View's module.id. Aborting.`
    );

  // note: contents of PHASE_HOOKs are promise-generating functions
  if (!PHASES.includes(phase))
    throw Error(`${phase} is not a recognized lifecycle phase`);
  let hooks = PHASE_HOOKS.get(phase);
  if (hooks === undefined) {
    if (DBG) console.log(`[${phase}] no subscribers`);
    return;
  }

  // phase housekeeping
  PHASE = phase + '_PENDING';

  // now execute handlers and promises
  let icount = 0;
  if (DBG) console.group(phase);
  // get an array of promises
  // o contains f, scope pushed in Hook() above
  let promises = hooks.map(o => {
    let retval = m_ExecuteScopedPhase(phase, o);
    if (retval instanceof Promise) {
      icount++;
      return retval;
    }
    // return undefined to signal no special handling
    return undefined;
  });
  promises = promises.filter(e => {
    return e !== undefined;
  });
  if (DBG && hooks.length)
    console.log(`[${phase}] HANDLERS PROCESSED : ${hooks.length}`);
  if (DBG && icount) console.log(`[${phase}] PROMISES QUEUED    : ${icount}`);

  // wait for all promises to execute
  await Promise.all(promises)
    .then(values => {
      if (DBG && values.length)
        console.log(`[${phase}] PROMISES RETURNED  : ${values.length}`, values);
      if (DBG) console.groupEnd();
      return values;
    })
    .catch(err => {
      if (DBG) console.log(`[${phase} EXECUTE ERROR ${err}`);
      throw Error(`[${phase} EXECUTE ERROR ${err}`);
    });

  // phase housekeeping
  PHASE = phase;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: The scope is used to filter lifecycle events within a particular
    application path, which are defined under the view directory.
 */
MOD.SetScope = module_path => {
  if (typeof module_path !== 'string') throw Error(BAD_PATH);
  if (DBG) console.log(`setting lifecycle scope to ${module_path}`);
  // strip out filename, if one exists
  MOD.scope = PATH.Dirname(module_path);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: The scope
 */
MOD.Scope = () => {
  return MOD.scope;
};

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// ...

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
