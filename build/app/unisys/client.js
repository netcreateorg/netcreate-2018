if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    This is the main browser client UNISYS module, which implements:

      LIFECYCLE - a promise-based hooked run order system
      MESSAGING - a networked remote procedure call/event system
      STATE     - a networked global application state system

    UNISYS is designed to work with React or our own module system:
    for modules:
      UMOD = UNISYS.NewModule()
      UDATA = UNISYS.NewDataLink(UMOD)
    for React:
      COMPONENT = class MyComponent extends UNISYS.Component

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
/*/ UNISYS.ForceReloadOnNavigation = () => {
      SETTINGS.ForceReloadOnNavigation();
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
/*/ UNISYS.EnterApp = () => {
      return new Promise( async ( resolve, reject ) => {
        try {
          await LIFECYCLE.Execute('TEST_CONF');   // TESTCONFIG hook
          await LIFECYCLE.Execute('INITIALIZE');  // INITIALIZE hook
          await LIFECYCLE.Execute('LOADASSETS');  // LOADASSETS hook
          await LIFECYCLE.Execute('CONFIGURE');   // CONFIGURE support modules
          resolve();
        } catch (e) {
          console.error('EnterApp() Lifecycle Error. Check phase execution order effect on data validity.\n',e);
          debugger;
        }
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: call this when the view system's DOM has stabilized and is ready
    for manipulation by other code
/*/ UNISYS.SetupDOM = () => {
      return new Promise( async ( resolve, reject ) => {
        try {
          await LIFECYCLE.Execute('DOM_READY');  // GUI layout has finished composing
          resolve();
        } catch (e) {
          console.error('SetupDOM() Lifecycle Error. Check phase execution order effect on data validity.\n',e);
          debugger;
        }
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: network startup
/*/ UNISYS.JoinNet = () => {
      return new Promise(( resolve, reject ) => {
        try {
          NETWORK.Connect(UDATA,{success: resolve});
        } catch (e) {
          console.error('EnterNet() Lifecycle Error. Check phase execution order effect on data validity.\n',e);
          debugger;
        }
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: configure system before run
/*/ UNISYS.SetupRun = () => {
      return new Promise( async ( resolve, reject ) => {
        try {
          await LIFECYCLE.Execute('RESET');     // RESET runtime datastructures
          await LIFECYCLE.Execute('START');     // START running
          await LIFECYCLE.Execute('APP_READY'); // tell network APP_READY
          await LIFECYCLE.Execute('RUN');       // tell network APP_READY
          resolve();
        } catch (e) {
          console.error('SetupRun() Lifecycle Error. Check phase execution order effect on data validity.\n',e);
          debugger;
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
/*/ return the current connected Socket Address (e.g. UADDR_12)
/*/ UNISYS.SocketUADDR = () => {
      return NETWORK.SocketUADDR();
    };

/// REACT INTEGRATION /////////////////////////////////////////////////////////
/*/ return the referene to the UNISYS extension of React.Component
/*/ UNISYS.Component = UniComponent;


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNISYS;
