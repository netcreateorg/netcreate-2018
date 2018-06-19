/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Messager - Handle a collection of named events and their receivers
    https://en.wikipedia.org/wiki/Event-driven_architecture#JavaScript

    This class is often wrapped by other UNISYS modules that manage
    a unique ID (such as the unique unisys datalink id) that hide that
    implementation detail from local users (e.g. unisys-data-class)

    /// NORMAL EVENT TRIGGERS ///

    On('EVENT_NAME',receiverFunction,sub_uid)
      Add a receiver with a particular subscriber UDATA id
    Off('EVENT_NAME',receiverFunction)
      Remove a receiver associated with the receiverFunction
    Emit('EVENT_NAME',data,src_id)
      Trigger an event+data to all receivers from a particular UDATA id
      If no src_id is specified, may echo back to UDATA
    Broadcast('EVENT_NAME',data)
      Similar to emit, but will always broadcast to all implementors
      (even ones on the sending UDATA link)

    /// RPC-STYLE MESSAGE PASSING ///

    Register('EVENT_NAME',receiverFunction,handler_id)
      Register a handler that possibly can return a value
    Call('EVENT_NAME',data,caller_uid)
      Invoke remote handler and possibly expect a return value

    When providing a receiver, make sure that it is bound to a specific
    'this' value using bind()
    e.g. handlerFunction = handlerFunction.bind(this);

    To keep a code module from receiving its own emitted event back,
    emitters can do simple filtering with an optional UNISYS uid string.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

'use strict';
const DBG = true;

/// MODULE VARS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var   MSG_IDCOUNT = 0;

/// UNISYS EMITTER CLASS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class Messager {

/*/ Instances of this class can be used to implement a UNISYS-style message
    passing scheme with shared semantics. It maintains a Map keyed by mesgName
    strings, containing a Set object filled with receivers for that mesgName.
/*/ constructor() {
      this.recvmap = new Map();     // message map storing sets of functions
      this.eid     = ++MSG_IDCOUNT;
    }

/// FIRE ONCE EVENTS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: subscribe a receiver function with a particular unisys id
    to receive a particular message.
/*/ HandleMessage( mesgName, handlerFunc, options={} ) {
      let { handlerUID } = options;
      if (typeof handlerFunc !== 'function') {
        throw new TypeError('arg2 must be a function');
      }
      if (typeof handlerUID==='string') {
        if (DBG) console.log(`saving udata_id with receiver`);
        // bind the udata uid to the receiver function for convenient access
        // by the message dispatcher
        handlerFunc.udata_id = handlerUID;
      }
      let receivers = this.recvmap.get(mesgName);
      if (!receivers) {
        receivers = new Set();
        this.recvmap.set( mesgName, receivers );
      }
      receivers.add( handlerFunc );
      return this;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: unsubscribe a receiver function from a particular event
/*/ UnhandleMessage( mesgName, handlerFunc ) {
      if (!arguments.length) {
        this.recvmap.clear();
      } else if (arguments.length === 1) {
        this.recvmap.delete(mesgName);
      } else {
        const receivers = this.recvmap.get(mesgName);
        if (receivers) {
          receivers.delete(handlerFunc);
        }
      }
      return this;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: trigger a message with the data object payload, sending to all receivers
    that implement that event. Includer sender's unisys id to prevent the sender
    to receiving its own message back if it happens to implement the message as
    well.
/*/ Send( mesgName, data, options={} ) {
      let { senderUID } = options;
      let etype = (senderUID===undefined) ? 'MessagerSignal' : 'MessagerSend';
      if (DBG) console.log(`${etype}: [${mesgName}] data:`,data);
      const receivers = this.recvmap.get(mesgName);
      if (receivers) {
        for (let receiver of receivers) {
          if (senderUID && receiver.udata_id===senderUID) continue;
          receiver(mesgName, data, senderUID);
        }
      }
      return this;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: wrapper for Send() used when you want every receiver, including
    the sender, to receive the event even if it is the one who sent it
/*/ Signal( mesgName, data ) {
      this.Send( mesgName, data );
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: The Remote Method Invocation version of Send(). It does not include 
    the 'mesgName' in calling subscriber function, so handlers declare one less
    paramter for conciseness.
    TODO: handle asynchronous events, collect results, and work seamlessly
    across the network
    TODO: Enable callback support by adding to options, callobjs dict, etc
/*/ Call( mesgName, data, options={} ) {
      let caller_uid = options.caller_uid;
      let callback   = options.callback;
      if (DBG) console.log(`MessagerCall: [${mesgName}] data:`,data);
      const receivers = this.recvmap.get(mesgName);
      if (receivers) {
        for (let receiver of receivers) {
          if (caller_uid && receiver.udata_id===caller_uid) {
            if (DBG) console.warn(`MessagerCall: [${mesgName}] skip call since origin = destination; use Broadcast() if intended`);
            continue;
          }
          receiver( data, options );
        }
      }
      return this;
    }

}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Messager;
