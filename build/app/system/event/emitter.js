/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Emitter - Handle a collection of named events and their listeners
    https://en.wikipedia.org/wiki/Event-driven_architecture#JavaScript

    .. on('eventName',listenerFunction) to add a listener
    .. off('eventName',listenerFunction) to remove a listener
    .. emit('eventName',args) to send the event to listeners

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

'use strict';

class Emitter {
  constructor() {
    this.events = new Map();
  }

  On( event, listener ) {
    if (typeof listener !== 'function') {
      throw new TypeError('The listener must be a function');
    }
    let listeners = this.events.get(event);
    if (!listeners) {
      listeners = new Set();
      this.events.set(event, listeners);
    }
    listeners.add(listener);
    return this;
  }

  Off( event, listener ) {
    if (!arguments.length) {
      this.events.clear();
    } else if (arguments.length === 1) {
      this.events.delete(event);
    } else {
      const listeners = this.events.get(event);
      if (listeners) {
        listeners.delete(listener);
      }
    }
    return this;
  }

  Emit( event, ...args ) {
    const listeners = this.events.get(event);
    if (listeners) {
      for (let listener of listeners) {
        listener.apply(this, args);
      }
    }
    return this;
  }
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Emitter;
