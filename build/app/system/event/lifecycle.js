/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    LifeCycle - A manager for application lifecycle events.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

'use strict';
const DBG = false;

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    var PHASE_HOOKS = new Map();        // functions that might right a Promise
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const PHASES = [                    // recognized phases
      'INITIALIZE',
      'LOADASSETS',
      'RESET',
      'CONFIGURE',
      'START',
      'UPDATE',
      'PREPAUSE',
      'PAUSE',
      'POSTPAUSE',
      'STOP',
      'UNLOADASSETS',
      'SHUTDOWN',
    ];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    var PHASE = PHASES[0]+'_PENDING';   // current phase

/// MODULE DEFINITION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    var MOD = {
      name : 'LifeCycle'
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: register a Phase Handler which is invoked by MOD.Execute()
    phase is a string constant from PHASES array above
    f is a function that does work immediately, or returns a Promise
/*/ MOD.Hook = (phase,f) => {
      // does this phase exist?
      if (typeof phase!=='string') throw new Error("<arg1> must be PHASENAME (e.g. 'LOADASSETS')");
      if (!PHASES.includes(phase)) throw new Error(phase,"is not a recognized lifecycle phase");
      // did we also get a promise?
      if (!(f instanceof Function)) throw new Error("<arg2> must be a function optionally returning Promise");

      // get the list of promises associated with this phase
      // and add the new promise
      if (!PHASE_HOOKS.has(phase)) PHASE_HOOKS.set(phase,[]);
      PHASE_HOOKS.get(phase).push(f);
      if (DBG) console.log(`[${phase}] added handler`);
    };

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Execute all Promises associated with a phase, completing when
    all the callback functions complete. If the callback function returns
    a Promise, this is added to a list of Promises to wait for before the
    function returns control to the calling code.
/*/ MOD.Execute = async (phase) => {
      // contents of PHASE_HOOKs are promise-generating functions
      if (!PHASES.includes(phase)) throw new Error(`${phase} is not a recognized lifecycle phase`);
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
      let promises = hooks.map((f)=>{
        let retval = f();
        if (retval instanceof Promise) return retval;
        icount++;
      });
      if (icount && DBG) console.log(`[${phase}] EXECUTED DONE: ${icount}`);
      // wait for all promises to execute
      await Promise.all(promises)
      .then((values)=>{
        if (DBG)         console.log(`[${phase}] PROMISES DONE: ${values.length}`);
        if (DBG) console.groupEnd();
        return values;
      })
      .catch((err)=>{
        if (DBG) console.log(`[${phase} EXECUTE ERROR ${err}`);
        throw new Error(`[${phase} EXECUTE ERROR ${err}`);
      });
      // phase housekeeping
      PHASE = phase;
    };

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// ...

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
