/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    LifeCycle - A manager for application lifecycle events.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

'use strict';
const DBG = true;

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// recognized phases
    const PHASES = [
      'INITIALIZE',
      'LOADASSETS',
      'CONFIGURE',
      'START',
      'RUN',
      'STOP',
      'RESTART'
    ];
/// a Map of PHASE->ARRAY of PROMISES
    var PHASE_HOOKS = new Map();

/// MODULE UTILITY FUNCTIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// ...

/// MODULE DEFINITION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    let LifeCycle = {};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: register a promise with a phase
    throws an error if anything looks invalid
/*/ LifeCycle.Hook = (phase,promiseGenerator) => {
      // does this phase exist?
      if (typeof phase!=='string') throw new Error("<arg1> must be PHASENAME (e.g. 'LOADASSETS')");
      if (!PHASES.includes(phase)) throw new Error(phase,"is not a recognized lifecycle phase");
      // did we also get a promise?
      if (!(promiseGenerator instanceof Function)) throw new Error("<arg2> must be a function returning Promise");

      // get the list of promises associated with this phase
      // and add the new promise
      if (!PHASE_HOOKS.has(phase)) PHASE_HOOKS.set(phase,[]);
      PHASE_HOOKS.get(phase).push(promiseGenerator);
      if (DBG) console.log('lifecycle: added promise to phase list',phase);
    };

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: execute all Promises associated with a phase
    RETURNS: Promise resolving when a
/*/ LifeCycle.Execute = async (phase) => {
      // contents of PHASE_HOOKs are promise-generating functions
      if (!PHASES.includes(phase)) throw new Error(`LifeCycle: ${phase} is not a recognized lifecycle phase`);
      let hooks = PHASE_HOOKS.get(phase);
      if (hooks===undefined) {
        if (DBG) console.log(`LifeCycle: [${phase}] no subscribers`);
        return;
      }
      let promises = hooks.map((promiseGenerator)=>{
        return promiseGenerator();
      });

      if (DBG) console.log(`LifeCycle START [${phase}] ${promises.length} subscribers`);
      // wait for all promises to execute
      await Promise.all(promises)
      .then((values)=>{
        if (DBG) console.log(`LifeCycle   END [${phase}] results: ${values.toString()}`);
        return values;
      })
      .catch((err)=>{
        if (DBG) console.log('PHASE',phase,'EXECUTE ERROR',err);
        throw new Error(`PHASE ${phase} EXECUTE ERROR ${err}`);
      });
    };

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// ...

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = LifeCycle;
