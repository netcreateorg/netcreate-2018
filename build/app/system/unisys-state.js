/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS STATE CLASS

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG         = true;
const BAD_NSPACE  = "namespace must be string without _ chars";
const BAD_LISTENR = "listener must be function";
const NO_UID_FLTR = "UNISYS.OnStateChange: pass DST_UID parameter to enable echo cancellation";

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const REACT       = require('react');
const Messager    = require('system/object/messager-class');

/// MODULE DECLARATIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var USTATE        = {};
var STATES        = new Map(); // namespace str => shallow state object
var STATES_LISTEN = new Map(); // namespace str => emitter

/// STATE /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UNISYS namespaces are transformed to uppercase.
    A namespace must be a string that does not contain reserved char '_'
/*/ function m_ConformNamespace (nspace) {
      // must be a string
      if (typeof nspace!=='string') return undefined;
      // disallow empty string
      if (!nspace) return undefined;
      // always uppercase
      nspace = nspace.toUpperCase();
      // expand * shortcut to _ROOT
      if (nspace==='*') return '_ROOT';
      // disallow _ reserved names
      if (nspace.indexOf('_')>(-1)) return undefined;
      // ok we're good
      return nspace;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Retrieve the emitter associated with a namespace, which contains handles
    all the listeners associated with a namespace. Always returns a valid
    emitter, creating it if the passed namespace is valid.
/*/ function m_GetStateMessager (nspace) {
      nspace = m_ConformNamespace(nspace);
      if (!nspace) throw Error(BAD_NSPACE);
      let msgr = STATES_LISTEN.get(nspace);
      if (!msgr) {
        msgr = new Messager();
        STATES_LISTEN.set(nspace,msgr);
      }
      return msgr;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: update the selected namespace state with new state
/*/ USTATE.SetState = (namespace, newState, src_uid) => {
      namespace = m_ConformNamespace(namespace);
      if (!namespace) throw Error(BAD_NSPACE);
      // update old state by partially overwrite of oldstate
      if (!STATES.has(namespace)) STATES.set(namespace,{});
      Object.assign(STATES.get(namespace),newState);
      // forward new state to namespace listeners
      let msgr = m_GetStateMessager(namespace);
      // don't pass with source_id because state should go everywhere
      // a register exists, even if it's the originating module
      msgr.Call(namespace,newState);
      // future: forward also to network
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: retrieve a COPY of state object of namespace
/*/ USTATE.State = (namespace) => {
      namespace = m_ConformNamespace(namespace);
      if (!namespace) throw Error(BAD_NSPACE);
      return Object.assign({},STATES.get(namespace));
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: subscribe to namestate updates
/*/ USTATE.OnStateChange = (namespace, listener, src_uid) => {
      namespace = m_ConformNamespace(namespace);
      if (!namespace) throw Error(BAD_NSPACE);
      if (typeof listener!=='function') throw Error(BAD_LISTENR);
      if (src_uid===undefined) console.warn(NO_UID_FLTR);
      let namespaceMessager = m_GetStateMessager(namespace);
      namespaceMessager.HandleMessage(namespace,listener,{handlerUID:src_uid});
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: unsubscribe to namestate updates
/*/ USTATE.OffStateChange = (namespace, listener) => {
      namespace = m_ConformNamespace(namespace);
      if (!namespace) throw Error(BAD_NSPACE);
      if (typeof listener!=='function') throw Error(BAD_LISTENR);
      let namespaceMessager = m_GetStateMessager(namespace);
      namespaceMessager.UnhandleMessage(namespace,listener);
    };



/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = USTATE;
