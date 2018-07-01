/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS is the top level system module for implementing:

    * LIFECYCLE Hooks
    * Synchronized State
    * Messaging

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG         = true;

/// CLASSES ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UniData     = require('unisys/client-datalink-class');
const UniModule   = require('unisys/client-module-class');

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SETTINGS    = require('settings');
const LIFECYCLE   = require('unisys/client-lifecycle');
const STATE       = require('unisys/client-state');
const NETWORK     = require('unisys/client-network');
const PROMPTS     = require('system/util/prompts');
const PR          = PROMPTS.Pad('UNISYS');

/// INITIALIZE MAIN MODULE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var   UNISYS      = new UniModule(module.id);
var   UDATA       = new UniData(UNISYS);

/// UNISYS MODULE MAKING //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Make new module with UNISYS convenience methods
/*/ UNISYS.NewModule = ( uniqueName ) => {
      return new UniModule(uniqueName);
    };
/// UNISYS CONNECTOR //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Make new module with UNISYS convenience methods
/*/ UNISYS.NewDataLink = ( module, optName ) => {
      return new UniData(module,optName);
    };
/// LIFECYCLE METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: LIFECYCLE Hook() functions
/*/ UNISYS.Hook = (phase,f) => {
      if (typeof phase!=='string') throw Error('arg1 is phase as string');
      if (typeof f!=='function') throw Error('arg2 is function callback');
      LIFECYCLE.Hook(phase,f,UNISYS.ModuleID()); // pass phase and hook function
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: LIFECYCLE Scope() functions
    The 'scope' is used by LIFECYCLE to determine what modules implementing
    various HOOKS will be called. The root_module_id is a path that will
    be considered the umbrella of "allowed to hook" modules. For REACT apps,
    this is the root directory of the root view component. Additionally,
    the unisys and system directories are allowed to run their hooks
/*/ UNISYS.SetScope = ( root_module_id ) => {
     LIFECYCLE.SetScope(root_module_id); // pass phase and hook function
   }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Ensure UNISYS will run correctly
/*/ UNISYS.SystemInitialize = ( module_id ) => {
      console.log(PR,'SystemInitialize');
      // reload if SystemInitialize sees that it's run before
      const key = 'UNISYS_SYSTEM_INIT';
      if (SETTINGS.Get(key)) {
        location.reload();
        return;
      }
      // if reload didn't happen, then save info
      SETTINGS.Set(key,SETTINGS.EJSProp('client').ukey);
      // initialize lifecycle filtering by active view
      UNISYS.SetScope(module_id);
    }; // SystemInitialize
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: application startup after componentDidMount
/*/ UNISYS.NetworkInitialize = ( callback ) => {
      NETWORK.Connect({success:callback});
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: application startup after componentDidMount
/*/ UNISYS.EnterApp = () => {
      let p = new Promise( async ( resolve, reject ) => {
        await LIFECYCLE.Execute('INITIALIZE'); // INITIALIZE hook
        await LIFECYCLE.Execute('LOADASSETS'); // LOADASSETS hook
        resolve();
      });
      return p;
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: configure system before run
/*/ UNISYS.SetupRun = () => {
      return new Promise( async ( resolve, reject ) => {
        if (DBG) console.log(PR,"running RESET");
        await LIFECYCLE.Execute('RESET');
        if (DBG) console.log(PR,"running CONFIGURE");
        await LIFECYCLE.Execute('CONFIGURE');
        if (DBG) console.log(PR,"running START");
        await LIFECYCLE.Execute('START');
        if (DBG) console.log(PR,"StepRun() completed");
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: handle periodic updates for a simulation-driven timestep
/*/ UNISYS.Run = () => {
      return new Promise( async ( resolve, reject ) => {
        await LIFECYCLE.Execute('UPDATE');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown lifecycle
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/ UNISYS.BeforePause = () => {
      return new Promise( async ( resolve, reject ) => {
        await LIFECYCLE.Execute('PREPAUSE');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown lifecycle
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/ UNISYS.Paused = () => {
      return new Promise( async ( resolve, reject ) => {
        await LIFECYCLE.Execute('PAUSE');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown lifecycle
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/ UNISYS.PostPause = () => {
      return new Promise( async ( resolve, reject ) => {
        await LIFECYCLE.Execute('POSTPAUSE');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown lifecycle
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/ UNISYS.CleanupRun = () => {
      return new Promise( async ( resolve, reject ) => {
        await LIFECYCLE.Execute('STOP');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: application shutdown
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/ UNISYS.ExitApp = () => {
      return new Promise( async ( resolve, reject ) => {
        await LIFECYCLE.Execute('UNLOADASSETS');
        await LIFECYCLE.Execute('SHUTDOWN');
        resolve();
      });
    };



/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNISYS;
