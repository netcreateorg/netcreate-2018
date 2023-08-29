if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Messager - Handle a collection of named events and their handlers
  https://en.wikipedia.org/wiki/Event-driven_architecture#JavaScript

  NOTE: This class is often WRAPPED by other UNISYS modules that manage
  a unique ID (such as the unique unisys datalink id) that hide that
  implementation detail from local users (e.g. unisys-data-class)

  HandleMessasge('MESG_NAME',handlerFunc,options)
    Add a handlerFunc. Specify options.handlerUID to enable echo rejection
    (same udata module will not invoke own handler when sending same message)
  UnhandleMessage('MESG_NAME',handlerFunc)
    Remove a handlerFunc associated with the handlerFuncFunction
  Send('MESG_NAME',data,options)
    Trigger an message+data to all handlers from a particular UDATA id
    If options.srcUID is specified, echo suppression is enabled
  Signal('MESG_NAME',data)
    Similar to Send(), but will ALWAYS broadcast to all implementors
  Call('MESG_NAME',data,options)
    Similar to Send(), but can return a value to a callback function
    options.srcUID is the UDATA id; set for echo supression to that uid
    options.dataReturnFunc is the callback function.

  NOTE: CallerReturnFunctions receive data object AND control object.
  The control object has the "return" function that closes a transaction;
  this is useful for async operations without Promises.

  NOTE: HandlerFunctions and CallerReturnFunctions are anotated with the
  udata_id property, which can be set to avoid echoing a message back to
  the same originating udata source.

  NOTE: When providing a handlerFunc, you might want to bind it to a
  specific object context (i.e. 'this') value using bind().
  e.g. handlerFunction = handlerFunction.bind(this);

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const TEST = require('test');
const NetMessage = require('unisys/common-netmessage-class');

/// MODULE VARS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MSGR_IDCOUNT = 0;
var DBG = false;

/// UNISYS MESSAGER CLASS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Messager {
  /** Instances of this class can be used to implement a UNISYS-style message
    passing scheme with shared semantics. It maintains a Map keyed by mesgName
    strings, containing a Set object filled with handlers for that mesgName.
 */
  constructor() {
    this.handlerMap = new Map(); // message map storing sets of functions
    this.messager_id = ++MSGR_IDCOUNT;
  }

  /// FIRE ONCE EVENTS //////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: subscribe a handlerFunc function with a particular unisys id
    to receive a particular message. The handlerFunc receives a data obj
    and should return one as well. If there is an error, return a string.
 */
  HandleMessage(mesgName, handlerFunc, options = {}) {
    let { handlerUID } = options;
    let { syntax } = options;
    if (typeof handlerFunc !== 'function') {
      throw 'arg2 must be a function';
    }
    if (typeof handlerUID === 'string') {
      // bind the udata uid to the handlerFunc function for convenient access
      // by the message dispatcher
      handlerFunc.udata_id = handlerUID;
    }
    let handlers = this.handlerMap.get(mesgName);
    if (!handlers) {
      handlers = new Set();
      this.handlerMap.set(mesgName, handlers);
    }
    // syntax annotation
    if (syntax) handlerFunc.umesg = { syntax };
    // saved function to handler
    handlers.add(handlerFunc);
    return this;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: unsubscribe a handlerFunc function from a particular event
   */
  UnhandleMessage(mesgName, handlerFunc) {
    if (!arguments.length) {
      this.handlerMap.clear();
    } else if (arguments.length === 1) {
      this.handlerMap.delete(mesgName);
    } else {
      const handlers = this.handlerMap.get(mesgName);
      if (handlers) {
        handlers.delete(handlerFunc);
      }
    }
    return this;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: trigger a message with the data object payload, sending to all handlers
    that implement that event. Includer sender's unisys id to prevent the sender
    to receiving its own message back if it happens to implement the message as
    well. dstScope is 'net' or 'local' to limit where to send, or 'all'
    for everyone on net or local
 */
  Send(mesgName, inData, options = {}) {
    let { srcUID, type } = options;
    let { toLocal = true, toNet = true } = options;
    const handlers = this.handlerMap.get(mesgName);
    /// toLocal
    if (handlers && toLocal)
      for (let handlerFunc of handlers) {
        // handlerFunc signature: (data,dataReturn) => {}
        // handlerFunc has udata_id property to note originating UDATA object
        // skip "same origin" calls
        if (srcUID && handlerFunc.udata_id === srcUID) {
          if (DBG)
            console.warn(
              `MessagerSend: [${mesgName}] skip call since origin = destination; use Broadcast() if intended`
            );
          continue;
        }
        // trigger the handler (no return expected)
        handlerFunc(inData, {
          /*control functions go here*/
        });
      } // end toLocal
    /// toNetwork
    if (toNet) {
      let pkt = new NetMessage(mesgName, inData, type);
      pkt.SocketSend();
    } // end toNetwork
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: wrapper for Send() used when you want every handlerFunc, including
    the sender, to receive the event even if it is the one who sent it.
 */
  Signal(mesgName, data, options = {}) {
    if (options.srcUID) {
      console.warn(
        `overriding srcUID ${options.srcUID} with NULL because Signal() doesn't use it`
      );
      options.srcUID = null;
    }
    this.Send(mesgName, data, options);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: Return an array of Promises. Called by UDATA.Call().
   */
  Call(mesgName, inData, options = {}) {
    let { srcUID, type } = options;
    let { toLocal = true, toNet = true } = options;
    const handlers = this.handlerMap.get(mesgName);
    let promises = [];
    /// toLocal
    if (handlers && toLocal) {
      for (let handlerFunc of handlers) {
        // handlerFunc signature: (data,dataReturn) => {}
        // handlerFunc has udata_id property to note originating UDATA object
        // skip "same origin" calls
        if (srcUID && handlerFunc.udata_id === srcUID) {
          if (DBG)
            console.warn(
              `MessagerCall: [${mesgName}] skip call since origin = destination; use Broadcast() if intended`
            );
          continue;
        }
        // Create a promise. if handlerFunc returns a promise, it follows
        let p = f_MakeResolverFunction(handlerFunc, inData);
        promises.push(p);
      } // end toLocal
    }
    /// resolver function
    /// remember MESSAGER class is used for more than just Network Calls
    /// the state manager also uses it, so the resolved value may be of any type
    function f_MakeResolverFunction(handlerFunc) {
      return new Promise((resolve, reject) => {
        let retval = handlerFunc(inData, {
          /*control functions go here*/
        });
        resolve(retval);
      });
    }
    /// toNetwork
    if (toNet) {
      type = type || 'mcall';
      let pkt = new NetMessage(mesgName, inData, type);
      let p = pkt.QueueTransaction();
      promises.push(p);
    } // end toNetwork

    /// return all queued promises
    return promises;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: Return a list of messages handled by this Messager instance
   */
  MessageNames() {
    let handlers = [];
    this.handlerMap.forEach((value, key) => {
      handlers.push(key);
      if (DBG) console.log('handler: ' + key);
    });
    return handlers;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: Verify that message exists
   */
  HasMessageName(msg = '') {
    return this.handlerMap.has(msg);
  }
} // class Messager

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Messager;
