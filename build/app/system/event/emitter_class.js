/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Emitter - Handle a collection of named events and their listeners
    https://en.wikipedia.org/wiki/Event-driven_architecture#JavaScript

    ... On('eventName',listenerFunction) to add a listener
    ... Off('eventName',listenerFunction) to remove a listener
    ... Emit('eventName',args) to send the event to listeners

    When providing a listener, make sure that it is bound to a specific
    'this' value using bind()
    e.g. handlerFunction = handlerFunction.bind(this);

    To keep a code module from receiving its own emitted event back,
    emitters can do simple filtering with an optional UNISYS uid string, which is
    generated by either creating a UniBridge (as for REACT components) or
    by creating a UniModule (for non-REACT code modules). The optional
    syntax is:

    ... On('eventName', listenerFunction, dst_uid)
        dst_uid is the UID provided by the subscribing code module
        and is saved with the listenerFunction
    ... Emit('eventName', listenerFunction, src_uid)
        src_uid is the UID provided by the event-generating code,
        used to avoid an event echoing back to the originating module

    Note that if you do want the event to echo back, just eliminate the
    optional parameters for On() and Emit(). You need BOTH of them set
    for the echo cancellation to work.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

'use strict';
const DBG        = false;

class Emitter {
  constructor() {
    this.events = new Map();
  }

  On( eventName, listener, dst_uid ) {
    if (typeof listener !== 'function') {
      throw new TypeError('The listener must be a function');
    }
    if (typeof dst_uid==='string') {
      if (DBG) console.log(`saving unisys_id with listener`);
      listener.unisys_id = dst_uid;
    }
    let listeners = this.events.get(eventName);
    if (!listeners) {
      listeners = new Set();
      this.events.set(eventName, listeners);
    }
    listeners.add(listener);
    return this;
  }

  Off( eventName, listener ) {
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

  Emit( eventName, data, src_uid ) {
    if (DBG) console.log(`EventEmitterClass: [${eventName}] data:`,data);
    const listeners = this.events.get(eventName);
    if (listeners) {
      for (let listener of listeners) {
        if (src_uid && listener.unisys_id===src_uid) continue;
        listener(eventName, data, src_uid);
      }
    }
    return this;
  }
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Emitter;