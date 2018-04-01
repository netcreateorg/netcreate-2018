/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS MODULE (UMODULE or UNIMODULE)
    Instances of this class are created by UNISYS.NewModule(config).
    The instances are mapped by unique name in the MODULES collection.

    * EVENTS are local to the current webapp instance.
    * MESSAGES are potentially network-wide.

    For REACT components, the NewModule() call can be made without
    a config object to create an "anonymous module" useful to act as
    a bridging interface to the UNISYS system. While UNISYS can be called
    directly from REACT, using the module as the bridge interface allows
    the event manager to not echo state changes back to the sender.

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
var MODULE_ID     = 100;

/// UNISYS MODULE CLASS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ This class implements instance-specific features of the UNISYS
    design such as custom event subscription and emission and network-
    based messaging.
/*/ class UniModule {

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// CONSTRUCTOR

      constructor(config) {
        // save unique id
        this.uid = `UMD_${MODULE_ID++}`;
        // validate parameters
        config = config || {};
        // validate 'name' as unique identifier
        let { name } = config;
        name = name || `<ANON_${this.id}>`;
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
  /// UNIQUE UNISYS ID for local application
  /// this is used to differentiate sources of events so they don't echo

      UID() { return this.uid; }

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
