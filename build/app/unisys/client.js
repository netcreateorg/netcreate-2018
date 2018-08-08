console.log(`included ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS is the top level system module for implementing:

    * LIFECYCLE Hooks
    * Synchronized State
    * Messaging

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = {
  hook : false
};

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
/// UNISYS MESSAGE REGISTRATION ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    UNISYS.RegisterMessagesP = () => {
      let all = UniData.MessageNames();
      return new Promise((resolve,reject)=>{
        UDATA.Call('SRV_REG_HANDLERS',{ all })
        .then((data)=>{
          resolve(data);
        });
      });
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
   UNISYS.InScope = ( module_id ) => {
     let currentScope = LIFECYCLE.Scope();
     return (module_id.includes(currentScope))
   }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Ensure UNISYS will run correctly
    module_id is a subpath nested below 'app'
/*/ UNISYS.SystemInitialize = ( module_id ) => {
      if (DBG.hook) console.log(PR,'SystemInitialize',module_id);
      // make sure users of UNISYS are
      SETTINGS.ForceReloadSingleApp();
      // initialize lifecycle filtering by active view
      UNISYS.SetScope(module_id);
    }; // SystemInitialize
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: application startup after componentDidMount
/*/ UNISYS.NetworkInitialize = ( callback ) => {
      NETWORK.Connect(UDATA,{success:callback});
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: application startup after componentDidMount
/*/ UNISYS.EnterApp = () => {
      let p = new Promise( async ( resolve, reject ) => {
        await LIFECYCLE.Execute('INITIALIZE');  // INITIALIZE hook
        await LIFECYCLE.Execute('UNISYS_INIT'); // UNISYS handlers hook (if needed)
        await LIFECYCLE.Execute('LOADASSETS');  // LOADASSETS hook
        resolve();
      });
      return p;
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: configure system before run
/*/ UNISYS.SetupRun = () => {
      return new Promise( async ( resolve, reject ) => {
        if (DBG.hook) console.log(PR,"running RESET");
        await LIFECYCLE.Execute('RESET');
        if (DBG.hook) console.log(PR,"running CONFIGURE");
        await LIFECYCLE.Execute('CONFIGURE');
        if (DBG.hook) console.log(PR,"running UNISYS_SYNC");
        await LIFECYCLE.Execute('UNISYS_SYNC'); // UNISYS network connection
        if (DBG.hook) console.log(PR,"running START");
        await LIFECYCLE.Execute('START');
        if (DBG.hook) console.log(PR,"StepRun() completed");
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

/// NETWORK INFORMATION ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ UNISYS.SocketUADDR = () => {
      return NETWORK.SocketUADDR();
    };


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNISYS;
