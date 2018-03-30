/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS MODULE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = true;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const Emitter     = require('system/event/emitter');
const LifeCycle   = require('system/event/lifecycle');
const Messager    = require('system/network/messeger');


/// INITIALIZE MAIN MODULE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let MODULES = new Map();


/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The UniModule class is returned
/*/ class UniModule {

      constructor(config) {
        // validate parameters
        if(typeof config!=='object') throw new Error("must pass minimum config object with 'name' property unique string");
        // validate 'name' as unique identifier
        let { name } = config;
        if(name===undefined) throw new Error("constructor requires name parm");
        if (typeof name!=='string') throw new Error("name must be string");
        if (MODULES.has(name)) throw new Error('name already used');

        // successful name validation
        this.name       = name;
        if (DBG) console.log('umodule define',name);

        // define key subsystems
        this.Event     = new Emitter();

        // save module in the global module list
        MODULES.set(name,this);
      }

  /// EVENT SUBSCRIPTION CONTROL - Other modules subscribe to events
  /// event is a string, and is an official event that's supported by
  /// this module
      On(event, listener) {
        this.Event.On(event,listener);
        if (DBG) console.log('umodule',this.name,'listener added for',event);
      }

      Off(event, listener) {
        this.Event.Off(event,listener);
        if (DBG) console.log('umodule',this.name,'listener removed for',event);
      }

  /// EVENT NOTIFICATION - send event to subscribers
  /// call this to fire the named event with args
  /// subscribers will be notified
      Emit(event, ...args) {
        this.Event.Emit(event, args);
        if (DBG) console.log('umodule',this.name,'emit event',event);
      }


  } // end UnisysModule


/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UniModule;
