/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Emitter - Handle a collection of named events and their listeners
    https://en.wikipedia.org/wiki/Event-driven_architecture#JavaScript

    This class is often wrapped by other UNISYS modules that manage
    a unique ID (such as the unique unisys datalink id) that hide that
    implementation detail from local users (e.g. unisys-data-class)

    /// NORMAL EVENT TRIGGERS ///

    On('EVENT_NAME',listenerFunction,sub_uid)
      Add a listener with a particular subscriber UDATA id
    Off('EVENT_NAME',listenerFunction)
      Remove a listener associated with the listenerFunction
    Emit('EVENT_NAME',data,src_id)
      Trigger an event+data to all listeners from a particular UDATA id
      If no src_id is specified, may echo back to UDATA
    Broadcast('EVENT_NAME',data)
      Similar to emit, but will always broadcast to all implementors
      (even ones on the sending UDATA link)

    /// RPC-STYLE MESSAGE PASSING ///

    Register('EVENT_NAME',listenerFunction,handler_id)
      Register a handler that possibly can return a value
    Call('EVENT_NAME',data,caller_uid)
      Invoke remote handler and possibly expect a return value

    When providing a listener, make sure that it is bound to a specific
    'this' value using bind()
    e.g. handlerFunction = handlerFunction.bind(this);

    To keep a code module from receiving its own emitted event back,
    emitters can do simple filtering with an optional UNISYS uid string.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

'use strict';
const DBG = false;

/// MODULE VARS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var   EMITTER_COUNT = 0;

/// UNISYS EMITTER CLASS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

class Emitter {

/*/ Instances of this class can be used to implement a UNISYS-style event
    passing scheme with shared semantics. It maintains a Map keyed by eventName
    strings, containing a Set object filled with listeners for that eventName.
/*/ constructor() {
      this.events = new Map();
      this.eid    = ++EMITTER_COUNT;
    }

/// FIRE ONCE EVENTS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: subscribe a listener function with a particular unisys id
    to receive a particular event.
/*/ On( eventName, listener, sub_uid ) {
      if (typeof listener !== 'function') {
        throw new TypeError('The listener must be a function');
      }
      if (typeof sub_uid==='string') {
        if (DBG) console.log(`saving unisys_id with listener`);
        listener.unisys_id = sub_uid;
      }
      let listeners = this.events.get(eventName);
      if (!listeners) {
        listeners = new Set();
        this.events.set(eventName, listeners);
      }
      listeners.add(listener);
      return this;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: unsubscribe a listener function from a particular event
/*/ Off( eventName, listener ) {
      if (!arguments.length) {
        this.events.clear();
      } else if (arguments.length === 1) {
        this.events.delete(eventName);
      } else {
        const listeners = this.events.get(eventName);
        if (listeners) {
          listeners.delete(listener);
        }
      }
      return this;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: trigger an event with the data object payload, sending to all listeners
    that implement that event. Includer sender's unisys id to prevent the sender
    to receiving its own message back if it happens to implement the message as
    well.
/*/ Emit( eventName, data, sender_uid ) {
      let etype = (sender_uid===undefined) ? 'EmitterBroadcast' : 'EmitterEmit';
      if (sender_uid) e
      if (DBG) console.log(`${etype}: [${eventName}] data:`,data);
      const listeners = this.events.get(eventName);
      if (listeners) {
        for (let listener of listeners) {
          if (sender_uid && listener.unisys_id===sender_uid) continue;
          listener(eventName, data, sender_uid);
        }
      }
      return this;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: wrapper for Emit() used when you want every listener, including
    the sender, to receive the event even if it is the one who sent it
/*/ Broadcast( eventName, data ) {
      this.Emit(eventName,data);
    }

/// REMOTE CALL EVENT METHODS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: alias for this.On()
/*/ Register( message, handler, handler_uid ) {
      this.On( message, handler, handler_uid );
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: alias for this.Off()
/*/ UnRegister( message, handler ) {
      this.Off( message, handler );
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: variation of Emit() that does not include the 'eventName' passed to
    the subscriber function, so handlers can be written more succinctly.
    TODO: handle asynchronous events, collect results, and work seamlessly
    across the network
/*/ Call( eventName, data, caller_uid ) {
      if (DBG) console.log(`EmitterCall: [${eventName}] data:`,data);
      const listeners = this.events.get(eventName);
      if (listeners) {
        for (let listener of listeners) {
          if (caller_uid && listener.unisys_id===caller_uid) continue;
          listener(data, caller_uid);
        }
      }
      return this;
    }

}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Emitter;
