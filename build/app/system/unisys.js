/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS is the top level system module for implementing:

    * LIFECYCLE Hooks
    * Synchronized State
    * Messaging

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG         = true;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LIFECYCLE   = require('system/unisys-lifecycle');
const STATE       = require('system/unisys-state');

/// CLASSES ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const Emitter     = require('system/object/emitter-class');
const UniData     = require('system/object/unisys-data-class');
const UniModule   = require('system/object/unisys-module-class');


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
/*/ UNISYS.NewDataLink = ( owner, optName ) => {
      return new UniData( owner, optName );
    };
/// LIFECYCLE METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: LIFECYCLE Hook() functions
/*/ UNISYS.Hook = LIFECYCLE.Hook; // pass phase and hook function
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: LIFECYCLE Scope() functions
/*/ UNISYS.SetScope = LIFECYCLE.SetScope; // pass phase and hook function

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: application startup
/*/ UNISYS.EnterApp = () => {
      return new Promise( async (resolve,reject)=>{
        await LIFECYCLE.Execute('INITIALIZE'); // INITIALIZE hook
        await LIFECYCLE.Execute('LOADASSETS'); // LOADASSETS hook
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: configure system before run
/*/ UNISYS.SetupRun = () => {
      return new Promise( async (resolve,reject)=>{
        await LIFECYCLE.Execute('RESET');
        await LIFECYCLE.Execute('CONFIGURE');
        await LIFECYCLE.Execute('START');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: handle periodic updates for a simulation-driven timestep
/*/ UNISYS.Run = () => {
      return new Promise( async (resolve,reject)=>{
        await LIFECYCLE.Execute('UPDATE');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown lifecycle
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/ UNISYS.BeforePause = () => {
      return new Promise( async (resolve,reject)=>{
        await LIFECYCLE.Execute('PREPAUSE');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown lifecycle
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/ UNISYS.Paused = () => {
      return new Promise( async (resolve,reject)=>{
        await LIFECYCLE.Execute('PAUSE');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown lifecycle
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/ UNISYS.PostPause = () => {
      return new Promise( async (resolve,reject)=>{
        await LIFECYCLE.Execute('POSTPAUSE');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown lifecycle
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/ UNISYS.CleanupRun = () => {
      return new Promise( async (resolve,reject)=>{
        await LIFECYCLE.Execute('STOP');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: application shutdown
    NOTE ASYNC ARROW FUNCTION (necessary?)
/*/ UNISYS.ExitApp = () => {
      return new Promise( async (resolve,reject)=>{
        await LIFECYCLE.Execute('UNLOADASSETS');
        await LIFECYCLE.Execute('SHUTDOWN');
        resolve();
      });
    };


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNISYS;
