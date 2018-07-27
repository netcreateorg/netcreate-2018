/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS DATALINK CLASS

    The UNISYS DATALINK (UDATA) class represents a connection to the UNISYS
    event messaging system. Instances are created with UNISYS.NewDataLink().

    Each UNODE has a unique UNISYS_ID (the UID) which represents its
    local address. Combined with the device UADDR, this makes every UNODE
    on the network addressable.

    * UNODES can get and set global state objects
    * UNODES can subscribe to state change events
    * UNODES can register listeners for a named message
    * UNODES can send broadcast to all listeners
    * UNODES can call listeners and receive data

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// DEBUGGING /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG          = { send : true, return : true, register : true };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BAD_OWNER    = "must pass owner object of type React.Component or UniModule with optional 'name' parameter";
const BAD_NAME     = "name parameter must be a string";
const BAD_UID      = "unexpected non-unique UID";
const BAD_EJSPROPS = "EJS props (window.NC_UNISYS) is undefined, so can not set datalink IP address";

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SETTINGS     = require('settings');
const STATE        = require('unisys/client-state');
const Messager     = require('unisys/client-messager-class');

/// NODE MANAGEMENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var UNODE          = new Map(); // unisys connector node map (local)
var UNODE_COUNTER  = 100;       // unisys connector node id counter

/// GLOBAL MESSAGES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MESSAGER       = new Messager();

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

        if ((optName!==undefined) && (typeof optName!=='string')) {
          throw Error(BAD_NAME);
        }

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

        // generate and save unique id
        this.uid      = `${msgr_type}_${UNODE_COUNTER++}`;
        this.name     = msgr_name;
        if (UNODE.has(this.uid)) throw Error(BAD_UID+this.uid);

        // save module in the global module list
        if (DBG) console.log(`Creating UNODE [${this.uid}] for [${this.name}]`);
        UNODE.set(this.uid,this);
      }


  /// UNIQUE UNISYS ID for local application
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// this is used to differentiate sources of events so they don't echo
      UID() { return this.uid; }
      Name() { return this.name; }


  /// GLOBAL STATE ACCESS
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// global STATE module calls are wrapped by unisys node so the unique
  /// UnisysID address can be appended
      State( namespace ) {
        return STATE.State(namespace);
      }
      SetState( namespace, newState ) {
        // uid is "source uid" designating who is making the change
        STATE.SetState(namespace,newState,this.UID() );
      }
      // uid is "source uid" of subscribing object, to avoid reflection
      // if the subscribing object is also the originating state changer
      OnStateChange( namespace, listener ) {
        STATE.OnStateChange(namespace,listener,this.UID() );
      }
      OffStateChange( namespace, listener ) {
        STATE.OffStateChange(namespace,listener);
      }


  /// MESSAGES ////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// mesgName is a string, and is an official event that's defined by the
  /// subclasser of UnisysNode
      HandleMessage( mesgName, listener ) {
        // uid is "source uid" of subscribing object, to avoid reflection
        // if the subscribing object is also the originating state changer
        if (DBG.register) console.log(`${this.name} handler added [${mesgName}]`);
        MESSAGER.HandleMessage(mesgName,listener,{receiverUID:this.UID()});
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      UnhandleMessage( mesgName, listener ) {
        if (DBG.register) console.log(`${this.name} handler removed [${mesgName}]`);
        MESSAGER.UnhandleMessage(mesgName,listener);
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      Send( mesgName, data ) {
        // uid is "source uid" of subscribing object, to avoid reflection
        // if the subscribing object is also the originating state changer
        if (DBG.send) console.log(`${this.name} send [${mesgName}]`);
        let promises = MESSAGER.Send(mesgName,data,{
          srcUID         : this.UID()
        });
        return Promise.all(promises);
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      Signal( mesgName, data ) {
        MESSAGER.Signal(mesgName,data);
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ UDATA wraps Messager.Call(), which returns an array of promises.
      The UDATA version of Call() also returns a Promise that resolves
      when all promises resolve.
  /*/ async Call( mesgName, inData, options ) {
        options = options || {};
        // uid is "source uid" of subscribing object, to avoid reflection
        // if the subscribing object is also the originating state changer
        options.srcUID = this.UID();
        let promises = MESSAGER.Call(mesgName,inData,options);
        let resArray = await Promise.all(promises);
        let resObj = Object.assign({},...resArray);
        if (DBG.return) console.log(`[${mesgName}] returning`,JSON.stringify(resObj));
        return resObj;
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      NullCallback () {
        if (DBG) console.log('null_callback',this.UID());
      }
  } // class UnisysNode


/// STATIC CLASS METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ There's a single MESSAGER object that handles all registered messages for
    UNISYS.
/*/ UnisysDataLink.MessageNames = function () {
      return MESSAGER.MessageNames();
    };


/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UnisysDataLink;
