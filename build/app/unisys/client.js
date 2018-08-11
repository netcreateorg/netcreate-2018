if (window.NC_DBG) console.log(`inc ${module.id}`);
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
const UniData      = require('unisys/client-datalink-class');
const UniModule    = require('unisys/client-module-class');
const UniComponent = require('unisys/client-react-component');

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SETTINGS     = require('settings');
const LIFECYCLE    = require('unisys/client-lifecycle');
const STATE        = require('unisys/client-state');
const NETWORK      = require('unisys/client-network');
const PROMPTS      = require('system/util/prompts');
const PR           = PROMPTS.Pad('UNISYS');

/// INITIALIZE MAIN MODULE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var   UNISYS       = new UniModule(module.id);
var   UDATA        = new UniData(UNISYS);

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
    UNISYS.RegisterMessagesPromise = ( messages=[] ) => {
      if (messages.length) {
        try {
          messages = UniData.ValidateMessageNames(messages);
        } catch (e) {
          console.error(e);
        }
      } else {
        messages = UniData.MessageNames();
      }
      return new Promise((resolve,reject)=>{
        UDATA.Call('SRV_REG_HANDLERS',{ messages })
        .then((data)=>{
          resolve(data);
        });
      });
    };
/// LIFECYCLE METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: LIFECYCLE Hook() functions
/*/ UNISYS.Hook = ( phase, f ) => {
      if (typeof phase!=='string') throw Error('arg1 is phase as string');
      if (typeof f!=='function') throw Error('arg2 is function callback');
      LIFECYCLE.Hook(phase,f,UNISYS.ModuleID()); // pass phase and hook function
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: System Initialize
/*/ UNISYS.SystemInitialize = ( module_id ) => {
      UNISYS.SetScope(module_id);
      SETTINGS.ForceReloadSingleApp();
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API HELPER: LIFECYCLE Scope() functions
    The 'scope' is used by LIFECYCLE to determine what modules implementing
    various HOOKS will be called. The root_module_id is a path that will
    be considered the umbrella of "allowed to hook" modules. For REACT apps,
    this is the root directory of the root view component. Additionally,
    the unisys and system directories are allowed to run their hooks
/*/ UNISYS.SetScope = ( root_module_id ) => {
     LIFECYCLE.SetScope(root_module_id); // pass phase and hook function
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API HELPER: SETTINGS ForceReloadSingleApp
    checks to see if settings flag is "dirty"; if it is, then reload the
    location to ensure no linger apps are running in the background. Yes
    this is a bit of a hack.
/*/ UNISYS.ForceReloadSingleApp = () => {
      SETTINGS.ForceReloadSingleApp();
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API HELPER: return TRUE if passed module.id is within the current set
    scope
/*/ UNISYS.InScope = ( module_id ) => {
     let currentScope = LIFECYCLE.Scope();
     return (module_id.includes(currentScope))
   }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: application startup
/*/ UNISYS.NetworkInitialize = ( callback ) => {
      NETWORK.Connect(UDATA,{success:callback});
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: application startup
/*/ UNISYS.EnterApp = () => {
      return new Promise( async ( resolve, reject ) => {
        try {
          await LIFECYCLE.Execute('INITIALIZE');  // INITIALIZE hook
          await LIFECYCLE.Execute('UNISYS_INIT'); // UNISYS handlers hook (if needed)
          await LIFECYCLE.Execute('LOADASSETS');  // LOADASSETS hook
          resolve();
        } catch (e) {
          console.error('EnterApp() Lifecycle Error. Check phase execution order effect on data validity.\n',e);
        }
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: configure system before run
/*/ UNISYS.SetupRun = () => {
      return new Promise( async ( resolve, reject ) => {
        try {
          await LIFECYCLE.Execute('RESET');
          await LIFECYCLE.Execute('CONFIGURE');
          await LIFECYCLE.Execute('UNISYS_READY'); // UNISYS network connection
          await LIFECYCLE.Execute('START');
          resolve();
        } catch (e) {
          console.error('SetupRun() Lifecycle Error. Check phase execution order effect on data validity.\n',e);
        }
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: handle periodic updates for a simulation-driven timestep
/*/ UNISYS.Run = () => {
      return new Promise( async ( resolve, reject ) => {
        try {
          await LIFECYCLE.Execute('UPDATE');
          resolve();
        } catch (e) {
          console.error(e);
        }
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

/// REACT INTEGRATION /////////////////////////////////////////////////////////
/*/
/*/ UNISYS.Component = UniComponent;


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNISYS;
