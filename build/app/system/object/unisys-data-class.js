/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS DATALINK CLASS

    The UNISYS DATALINK (UDATA) class represents a connection to the UNISYS
    event messaging system. Instances are created with UNISYS.NewDataLink().

    Each UNODE has a unique UNISYS_ID (the UID) which represents its
    local address. Combined with the device address, this makes every UNODE
    on the network addressable.

    * UNODES can get and set global state objects
    * UNODES can subscribe to state change events
    * UNODES can register listeners for a named message
    * UNODES can send broadcast to all listeners
    * UNODES can call listeners and receive data

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// DEBUGGING /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG         = true;
const BAD_OWNER   = "must pass owner object of type React.Component or UniModule with optional 'name' parameter";
const BAD_NAME    = "name parameter must be a string";
const BAD_UID     = "unexpected non-unique UID";


/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISTATE    = require('system/unisys-state');
const Emitter     = require('system/object/emitter-class');


/// NODE MANAGEMENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var UNODE         = new Map(); // unisys connector node map (local)
var UNODE_COUNTER = 100;       // unisys connector node id counter

/// GLOBAL MESSAGES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MESSAGER       = new Emitter();

/// UNISYS NODE CLASS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Instances of this class can register/unregister message handlers and also
    send messages. Constructor receives an owner, which is inspected for
    properties to determine how to classify the created messager for debugging
    purposes
/*/ class UnisysDataLink {

  /*/ CONSTRUCTOR
      A messager creates a unique ID within the webapp instance. Since
      messagers are "owned" by an object, we want the ID to reflect
      the owner's identity too while also allowing multiple instances per
      owner.
  /*/ constructor( owner, optName ) {
        let msgr_type = '?TYPE';
        let msgr_name = '?NAME';

        if ((optName!==undefined) && (typeof optName!=='string'))
          throw Error (BAD_NAME);

        // require an owner that is an object of some kind
        if (typeof owner!=='object') throw Error(BAD_OWNER);

        // react components or regular objects
        if (owner.name) {
          msgr_type = 'T_MOD';
          msgr_name = owner.name || optName;
        } else if (owner.constructor.name) {
          msgr_type = 'T_RCT';
          msgr_name = owner.constructor.name;
        } else {
          throw Error(BAD_OWNER);
        }

        // save unique id
        this.uid = `${msgr_type}_${UNODE_COUNTER++}`;
        this.name = msgr_name;
        if (UNODE.has(this.uid)) throw Error(BAD_UID+this.uid);

        // save module in the global module list
        if (DBG) console.log(`Creating UNODE [${this.uid}] for [${this.name}]`);
        UNODE.set( this.uid, this );
      }


  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UNIQUE UNISYS ID for local application
  /// this is used to differentiate sources of events so they don't echo
      UID() { return this.uid; }
      Name() { return this.name; }


  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// GLOBAL STATE ACCESS
  /// global UNISTATE module calls are wrapped by unisys node so the unique
  /// UnisysID address can be appended
      State( namespace ) {
        return UNISTATE.State( namespace );
      }
      SetState( namespace, newState ) {
        // uid is "source uid" designating who is making the change
        UNISTATE.SetState( namespace, newState, this.UID() );
      }
      // uid is "source uid" of subscribing object, to avoid reflection
      // if the subscribing object is also the originating state changer
      OnStateChange( namespace, listener ) {
        UNISTATE.OnStateChange( namespace, listener, this.UID() );
      }
      OffStateChange( namespace, listener ) {
        UNISTATE.OffStateChange( namespace, listener );
      }


  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// EVENT SUBSCRIPTION CONTROL - Other modules subscribe to events
  /// eventName is a string, and is an official event that's defined by the
  /// subclasser of UnisysNode
      On( eventName, listener ) {
        // uid is "source uid" of subscribing object, to avoid reflection
        // if the subscribing object is also the originating state changer
        if (DBG) console.log(`${this.name} listener added [${eventName}]`);
        MESSAGER.On( eventName, listener, this.UID() );
      }
      Off( eventName, listener ) {
        if (DBG) console.log(`${this.name} listener removed [${eventName}]`);
        MESSAGER.Off( eventName, listener );
      }
      Emit( eventName, data ) {
        // uid is "source uid" of subscribing object, to avoid reflection
        // if the subscribing object is also the originating state changer
        if (DBG) console.log(`${this.name} emit [${eventName}]`);
        MESSAGER.Emit( eventName, data, this.UID() );
      }
      Broadcast( eventName, data ) {
        MESSAGER.Call(eventName, data);
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// CALL-STYLE EVENT NOTIFICATION - send event to subscribers
  /// as above, but without also passing the eventName
  /// subscribers will be notified
  /// NOTE: UNISYS also has these available if you don't need source
  /// rejection
      Register( message, listener ) {
        // uid is "source uid" of subscribing object, to avoid reflection
        // if the subscribing object is also the originating state changer
        if (DBG) console.log(`${this.name} handler added [${message}]`);
        MESSAGER.Register( message, listener, this.UID() );
      }
      Unregister( message, listener ) {
        if (DBG) console.log(`${this.name} handler removed [${message}]`);
        MESSAGER.Off( message, listener );
      }
      Call( eventName, data ) {
        // uid is "source uid" of subscribing object, to avoid reflection
        // if the subscribing object is also the originating state changer
        if (DBG) console.log(`${this.name} emit [${eventName}]`);
        MESSAGER.Call( eventName, data, this.UID() );
      }


  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// ASYNCHRONOUS MESSAGE CALLING
  /// TBD


  } // end UnisysNode


/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UnisysDataLink;
