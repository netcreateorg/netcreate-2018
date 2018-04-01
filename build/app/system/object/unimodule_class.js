/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS MODULE (UMODULE or UNIMODULE)
    Instances of this class are created by UNISYS.NewModule(config).
    The instances are mapped by unique name in the MODULES collection.

    * EVENTS are local to the current webapp instance.
    * MESSAGES are potentially network-wide.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG         = true;
const BAD_CONFIG  = "must pass minimum config object with 'name' property unique string";
const BAD_NAME    = "name parameter must be a unique string";

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const Emitter     = require('system/event/emitter_class');

/// MODULE DECLARATIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MODULES       = new Map();

/// UNISYS MODULE CLASS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ This class implements instance-specific features of the UNISYS
    design such as custom event subscription and emission and network-
    based messaging.
/*/ class UniModule {

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// CONSTRUCTOR

      constructor(config) {
        // validate parameters
        if(typeof config!=='object') throw Error(BAD_CONFIG);
        // validate 'name' as unique identifier
        let { name } = config;
        if(name===undefined) throw Error(BAD_NAME);
        if (typeof name!=='string') throw Error(BAD_NAME);
        if (MODULES.has(name)) throw Error(BAD_NAME);

        // successful name validation
        this.name = name;
        if (DBG) console.log('umodule define',name);

        // define key subsystems
        this.Event = new Emitter();

        // save module in the global module list
        MODULES.set(name,this);
      }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// EVENT SUBSCRIPTION CONTROL - Other modules subscribe to events
  /// eventName is a string, and is an official event that's defined by the
  /// subclasser of UniModule

      On(eventName, listener) {
        this.Event.On(eventName,listener);
        if (DBG) console.log('umodule',this.name,'listener added for',eventName);
      }

      Off(eventName, listener) {
        this.Event.Off(eventName,listener);
        if (DBG) console.log('umodule',this.name,'listener removed for',eventName);
      }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// EVENT NOTIFICATION - send event to subscribers
  /// call this to fire the named event with args
  /// subscribers will be notified

      Emit(eventName, ...args) {
        this.Event.Emit(eventName, args);
        if (DBG) console.log('umodule',this.name,'emit event',eventName);
      }

  } // end UniModule


/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UniModule;
