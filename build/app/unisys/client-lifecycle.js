if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    LifeCycle - A system manager for application lifecycle events.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG      = false;
const BAD_PATH = "module_path must be a string derived from the module's module.id";

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PATH     = require('system/util/path');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    var PHASE_HOOKS = new Map();  // functions that might right a Promise
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const PHASES = [
      'INITIALIZE',               // very early initialization
      'UNISYS_INIT',              // configure early UNISYS-related hooks
      'LOADASSETS',               // load any external data, make connections
      'RESET',                    // reset runtime data structures
      'CONFIGURE',                // configure runtime data structures
      'UNISYS_READY',             // synchronize to UNISYS network server
      'START',                    // start normal execution run
      'UPDATE',                   // system is running (periodic call w/ time)
      'PREPAUSE',                 // system wants to pause run
      'PAUSE',                    // system has paused (periodic call w/ time)
      'POSTPAUSE',                // system wants to resume running
      'STOP',                     // system wants to stop current run
      'UNLOADASSETS',             // system releases any connections
      'SHUTDOWN'                  // system wants to shut down
    ];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    var PHASE = PHASES[0]+'_PENDING';   // current phase

/// MODULE DEFINITION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    var MOD = {
      name  : 'LifeCycle',
      scope : 'system/booting'    // overwritten by UNISYS.SystemInitialize()
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UTILITY: compare the destination scope with the acceptable scope (the
    module.id of the root JSX component in a view). Any module not in the
    system directory will not get called
/*/ function m_ExecuteScopedPhase( phase, o ) {
      // check for special unisys or system directory
      if (o.scope.indexOf('system')===0) return o.f();
      if (o.scope.indexOf('unisys')===0) return o.f();
      // check for subdirectory
      if (o.scope.includes(MOD.scope,0)) return o.f();
      // else do nothing
      if (DBG) console.info(`LIFECYCLE: skipping [${phase}] for ${o.scope} because scope is ${MOD.scope}`);
      return undefined;
    }


/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: register a Phase Handler which is invoked by MOD.Execute()
    phase is a string constant from PHASES array above
    f is a function that does work immediately, or returns a Promise
/*/ MOD.Hook = ( phase, f, scope ) => {
      // make sure scope is included
      if (typeof scope!=='string') throw Error(`<arg3> scope is required (set to module.id)`);
      // does this phase exist?
      if (typeof phase!=='string') throw Error("<arg1> must be PHASENAME (e.g. 'LOADASSETS')");
      if (!PHASES.includes(phase)) throw Error(phase,"is not a recognized lifecycle phase");
      // did we also get a promise?
      if (!(f instanceof Function)) throw Error("<arg2> must be a function optionally returning Promise");

      // get the list of promises associated with this phase
      // and add the new promise
      if (!PHASE_HOOKS.has(phase)) PHASE_HOOKS.set(phase,[]);
      PHASE_HOOKS.get(phase).push({f,scope});
      if (DBG) console.log(`[${phase}] added handler`);
    };

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Execute all Promises associated with a phase, completing when
    all the callback functions complete. If the callback function returns
    a Promise, this is added to a list of Promises to wait for before the
    function returns control to the calling code.
/*/ MOD.Execute = async (phase) => {
      // require scope to be set
      if (MOD.scope===false) throw Error(`Root JSX component must call UNISYS.SystemInitialize(module.id)`);

      // contents of PHASE_HOOKs are promise-generating functions
      if (!PHASES.includes(phase)) throw Error(`${phase} is not a recognized lifecycle phase`);
      let hooks = PHASE_HOOKS.get(phase);
      if (hooks===undefined) {
        if (DBG) console.log(`[${phase}] no subscribers`);
        return;
      }

      // phase housekeeping
      PHASE = phase+'_PENDING';
      // now execute handlers and promises
      let icount = 0;
      if (DBG) console.group(phase);
      // o contains f, scope pushed in Hook() above
      let promises = hooks.map((o) => {
        let retval = m_ExecuteScopedPhase(phase,o);
        if (retval instanceof Promise) return retval;
        icount++;
        // return undefined to signal no special handling
        return undefined;
      });
      if (icount && DBG) console.log(`[${phase}] EXECUTED DONE: ${icount}`);
      // wait for all promises to execute
      await Promise.all(promises).
      then((values) => {
        if (DBG) console.log(`[${phase}] PROMISES DONE: ${values.length}`);
        if (DBG) console.groupEnd();
        return values;
      }).
      catch((err)=>{
        if (DBG) console.log(`[${phase} EXECUTE ERROR ${err}`);
        throw Error(`[${phase} EXECUTE ERROR ${err}`);
      });
      // phase housekeeping
      PHASE = phase;
    };



/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: The scope is used to filter lifecycle events within a particular
    application path, which are defined under the view directory.
/*/ MOD.SetScope = ( module_path ) => {
      if (typeof module_path!=='string') throw Error(BAD_PATH);
      if (DBG) console.log(`setting lifecycle scope to ${module_path}`);
      // strip out filename, if one exists
      MOD.scope = PATH.Dirname(module_path);
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: The scope
/*/ MOD.Scope = () => {
      return MOD.scope;
    };

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// ...

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
