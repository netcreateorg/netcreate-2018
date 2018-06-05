/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS is the top level system module for implementing:

    * LifeCycle Hooks
    * Synchronized State
    * Messaging

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG         = true;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LifeCycle   = require('system/unisys-lifecycle');
const UniState    = require('system/unisys-state');

/// CLASSES ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const Emitter     = require('system/object/emitter_class');
const UniNode     = require('system/object/unisys_node_class');
const UniModule   = require('system/object/unisys_module_class');


/// INITIALIZE MAIN MODULE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var UNISYS        = {};

/// UNISYS MODULE MAKING //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Make new module with UNISYS convenience methods
/*/ UNISYS.NewModule = ( uniqueName ) => {
      return new UniModule( uniqueName );
    };
/// UNISYS CONNECTOR //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Make new module with UNISYS convenience methods
/*/ UNISYS.NewConnector = ( owner, optName ) => {
      return new UniNode( owner, optName );
    };


/// LIFECYCLE METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: LifeCycle Hook() functions,
/*/ UNISYS.Hook = LifeCycle.Hook; // pass phase and hook function
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: application startup
/*/ UNISYS.EnterApp = () => {
      return new Promise( async (resolve,reject)=>{
        await LifeCycle.Execute('INITIALIZE'); // INITIALIZE hook
        await LifeCycle.Execute('LOADASSETS'); // LOADASSETS hook
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: configure system before run
/*/ UNISYS.SetupRun = () => {
      return new Promise( async (resolve,reject)=>{
        await LifeCycle.Execute('RESET');
        await LifeCycle.Execute('CONFIGURE');
        await LifeCycle.Execute('START');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: handle periodic updates for a simulation-driven timestep
/*/ UNISYS.Run = () => {
      return new Promise( async (resolve,reject)=>{
        await LifeCycle.Execute('UPDATE');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown lifecycle
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/ UNISYS.BeforePause = () => {
      return new Promise( async (resolve,reject)=>{
        await LifeCycle.Execute('PREPAUSE');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown lifecycle
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/ UNISYS.Paused = () => {
      return new Promise( async (resolve,reject)=>{
        await LifeCycle.Execute('PAUSE');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown lifecycle
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/ UNISYS.PostPause = () => {
      return new Promise( async (resolve,reject)=>{
        await LifeCycle.Execute('POSTPAUSE');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown lifecycle
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/ UNISYS.CleanupRun = () => {
      return new Promise( async (resolve,reject)=>{
        await LifeCycle.Execute('STOP');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: application shutdown
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/ UNISYS.ExitApp = () => {
      return new Promise( async (resolve,reject)=>{
        await LifeCycle.Execute('UNLOADASSETS');
        await LifeCycle.Execute('SHUTDOWN');
        resolve();
      });
    };


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNISYS;
