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

'use strict';
const DBG = true;

/// MODULE VARS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var   MSGR_IDCOUNT = 0;

/// UNISYS EMITTER CLASS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class Messager { 

/*/ Instances of this class can be used to implement a UNISYS-style message
    passing scheme with shared semantics. It maintains a Map keyed by mesgName
    strings, containing a Set object filled with handlers for that mesgName.
/*/ constructor() {
      this.handlerMap   = new Map(); // message map storing sets of functions
      this.messager_id  = ++MSGR_IDCOUNT;
    }

/// FIRE ONCE EVENTS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: subscribe a handlerFunc function with a particular unisys id
    to receive a particular message.
/*/ HandleMessage( mesgName, handlerFunc, options={} ) {
      let { handlerUID } = options;
      if (typeof handlerFunc !== 'function') {
        throw new TypeError('arg2 must be a function');
      }
      if (typeof handlerUID==='string') {
        if (DBG) console.log(`saving udata_id with handlerFunc`);
        // bind the udata uid to the handlerFunc function for convenient access
        // by the message dispatcher
        handlerFunc.udata_id = handlerUID;
      }
      let handlers = this.handlerMap.get(mesgName);
      if (!handlers) {
        handlers = new Set();
        this.handlerMap.set( mesgName, handlers );
      }
      handlers.add(handlerFunc);
      return this;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: unsubscribe a handlerFunc function from a particular event
/*/ UnhandleMessage( mesgName, handlerFunc ) {
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
/*/ API: trigger a message with the data object payload, sending to all handlers
    that implement that event. Includer sender's unisys id to prevent the sender
    to receiving its own message back if it happens to implement the message as
    well.
/*/ Send( mesgName, data, options={} ) {
      let { srcUID } = options;
      let etype = (src_uid===undefined) ? 'MessagerSignal' : 'MessagerSend';
      if (DBG) console.log(`${etype}: [${mesgName}] data:`,data);
      const handlers = this.handlerMap.get(mesgName);
      if (handlers) {
        for (let handlerFunc of handlers) {
          if (src_uid && handlerFunc.udata_id===src_uid) continue;
          handlerFunc(mesgName, data, src_uid);
        }
      }
      return this;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: wrapper for Send() used when you want every handlerFunc, including
    the sender, to receive the event even if it is the one who sent it
/*/ Signal( mesgName, data ) {
      this.Send(mesgName,data);
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: The Remote Method Invocation version of Send(). It does not include 
    the 'mesgName' in calling subscriber function, so handlers declare one less
    param (I like conciseness in function declarations)
    TODO: handle asynchronous events, collect results, and work seamlessly
    across the network
    TODO: Enable callback support by adding to options, callobjs dict, etc
/*/ Call( mesgName, inData, options={} ) {
      let { srcUID, dataReturnFunc } = options;
      if (DBG) console.log(`MessagerCall: [${mesgName}] inData:`,inData);
      const handlers = this.handlerMap.get(mesgName);
      if (handlers) {
        for (let handlerFunc of handlers) {
          if (srcUID && handlerFunc.udata_id===srcUID) {
            if (DBG) console.warn(`MessagerCall: [${mesgName}] skip call since origin = destination; use Broadcast() if intended`);
            continue;
          }
          // invoke a registered handler, passing inData and a UDATA_API function collection
          let hasFunction = typeof dataReturnFunc==='function' ? "w/callback":"w/out callback";
          console.log('.. MessagerCall: CALLING HANDLER for',mesgName,hasFunction);
          handlerFunc(inData,{
            "return" : dataReturnFunc
          });
        }
      }
      return this;
    }

}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Messager;
