/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Emitter - Handle a collection of named events and their listeners
    https://en.wikipedia.org/wiki/Event-driven_architecture#JavaScript

    .. On('eventName',listenerFunction) to add a listener
    .. Off('eventName',listenerFunction) to remove a listener
    .. Emit('eventName',args) to send the event to listeners

    When providing a listener, make sure that it is bound to a specific
    'this' value using bind()
    e.g. handlerFunction = handlerFunction.bind(this);

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

'use strict';
const DBG        = false;

class Emitter {
  constructor() {
    this.events = new Map();
  }

  On( eventName, listener ) {
    if (typeof listener !== 'function') {
      throw new TypeError('The listener must be a function');
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

  Emit( eventName, data ) {
    if (DBG) console.log(`EventEmitterClass: [${eventName}] data:`,data);
    const listeners = this.events.get(eventName);
    if (listeners) {
      for (let listener of listeners) {
        // note: listener should have 'this' bound (see ABOUT)
        listener(eventName, data);
      }
    }
    return this;
  }
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Emitter;
