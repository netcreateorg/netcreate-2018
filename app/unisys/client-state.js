if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UNISYS STATE CLASS

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const REACT = require('react');
const TYPEOF = require('type-detect');
const Messager = require('unisys/client-messager-class');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BAD_NSPACE = 'namespace must be string without _ chars';
const BAD_LISTENR = 'listener must be function';
const NO_UID_FLTR =
  'UNISYS.OnStateChange: pass DST_UID parameter to enable echo cancellation';
const WARN_PROP_MISMATCH = 'MergeState is changing a property type';

/// MODULE DECLARATIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var USTATE = {};
var STATES = new Map(); // namespace str => shallow state object
var STATES_LISTEN = new Map(); // namespace str => emitter

/// STATE /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ UNISYS namespaces are transformed to uppercase.
    A namespace must be a string that does not contain reserved char '_'
/*/ function m_ConformNamespace(namespace) {
  // must be a string
  if (typeof namespace !== 'string') return undefined;
  // disallow empty string
  if (!namespace) return undefined;
  // always uppercase
  namespace = namespace.toUpperCase();
  // expand * shortcut to _ROOT
  if (namespace === '*') return '_ROOT';
  // disallow _ reserved names
  if (namespace.indexOf('_') > -1) return undefined;
  // ok we're good
  return namespace;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Used for merging and concatenating state, when a simple copy-overwrite
    simply will not do.
/*/ function m_ConformState(namespace, newState, opt) {
  opt = opt || { merge: true };
  // make a copy of the old state
  let state = Object.assign({}, STATES.get(namespace));
  if (DBG) console.log(`merging state namespace '${namespace}' with`, newState);

  // iterate over all properties in newState and merge them
  // accordingly. This is *NOT* a deep merge.
  Object.entries(newState).forEach(entry => {
    let k = entry[0]; // current prop name in newstate
    let v = entry[1]; // current prop value in newstate
    let prop = state[k], // old prop value
      nprop = v, // new prop value
      t_old, // type to be filled-in
      t_new;

    // use type-detect library to get type
    t_old = TYPEOF(prop);
    t_new = TYPEOF(nprop);

    // A BUNCH OF SPECIAL CASE CHECKS //
    if (t_old === 'undefined' || t_old === 'null') {
      // if the value doesn't exist in current state
      // just update with new prop
      prop = nprop;
    } else if (t_old === t_new) {
      // if there is a type match, then figure
      // out how to merge based on type
      switch (t_old) {
        case 'Object':
          if (DBG) console.log(`merge objects`);
          // merge object props
          prop = Object.assign(prop, nprop);
          break;
        case 'Array': // note uppercase (type-detect)
          if (DBG) console.log(`merge arrays`);
          // merge arrays no dupes (https://stackoverflow.com/a/36469404)
          // ES6 fanciness using destructuring (...) and Sets
          if (opt.merge) prop = [...new Set([...prop, ...nprop])];
          else if (opt.concat) prop = prop.concat(nprop);
          break;
        default:
          if (DBG) console.log(`copy values`);
          // just overwrite otherwise
          prop = nprop;
      } // end switch t_old
    } else {
      // if there is a type mismatch, write
      console.warn(
        `${WARN_PROP_MISMATCH} key:${k}\n type '${t_new}' overwriting '${t_old}'`
      );
      prop = nprop;
    }
    // update state place
    state[k] = prop;
  }); // end Object.entries

  return state;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Retrieve the emitter associated with a namespace, which contains handles
    all the listeners associated with a namespace. Always returns a valid
    emitter, creating it if the passed namespace is valid.
/*/ function m_GetStateMessager(nspace) {
  nspace = m_ConformNamespace(nspace);
  if (!nspace) throw Error(BAD_NSPACE);
  let msgr = STATES_LISTEN.get(nspace);
  if (!msgr) {
    msgr = new Messager();
    STATES_LISTEN.set(nspace, msgr);
  }
  return msgr;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: update the selected namespace state with new state
/*/ USTATE.SetState = (namespace, newState, src_uid) => {
  namespace = m_ConformNamespace(namespace);
  if (!namespace) throw Error(BAD_NSPACE);
  // update old state by partially overwrite of state
  if (!STATES.has(namespace)) STATES.set(namespace, {});
  // NOTE Because we're using Object.assign:
  // * Objects already in the state will remain in the state
  //   if not overwritten by newState.  This can result in
  //   the mysterious re-appearance of old paramters.
  // * No deep clones
  Object.assign(STATES.get(namespace), newState);
  // forward new state to namespace listeners
  let msgr = m_GetStateMessager(namespace);
  // don't pass with source_id because state should go everywhere
  // a register exists, even if it's the originating module
  msgr.Send(namespace, newState, { type: 'state', toLocal: true, toNet: false });
  // future: forward also to network
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: merge objects and arrays in state
/*/ USTATE.MergeState = (namespace, newState, src_uid) => {
  namespace = m_ConformNamespace(namespace);
  if (!namespace) throw Error(BAD_NSPACE);
  // update old state by partially overwrite of state
  if (!STATES.has(namespace)) STATES.set(namespace, {});

  // merge the states with no duplicates in arrays
  let state = m_ConformState(namespace, newState, { merge: true });

  // update the namespace
  STATES.set(namespace, state);

  // forward new state to namespace listeners
  let msgr = m_GetStateMessager(namespace);
  // don't pass with source_id because state should go everywhere
  // a register exists, even if it's the originating module
  msgr.Send(namespace, newState, { type: 'state', toLocal: true, toNet: false });
  // future: forward also to network
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: merge objects and concat arrays in state
/*/ USTATE.ConcatState = (namespace, newState, src_uid) => {
  namespace = m_ConformNamespace(namespace);
  if (!namespace) throw Error(BAD_NSPACE);
  // update old state by partially overwrite of state
  if (!STATES.has(namespace)) STATES.set(namespace, {});

  // merge the states with no duplicates in arrays
  let state = m_ConformState(namespace, newState, { concat: true });

  // update the namespace
  STATES.set(namespace, state);

  // forward new state to namespace listeners
  let msgr = m_GetStateMessager(namespace);
  // don't pass with source_id because state should go everywhere
  // a register exists, even if it's the originating module
  msgr.Send(namespace, newState, { type: 'state', toLocal: true, toNet: false });
  // future: forward also to network
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: retrieve a COPY of state object of namespace
/*/ USTATE.State = namespace => {
  namespace = m_ConformNamespace(namespace);
  if (!namespace) throw Error(BAD_NSPACE);
  return Object.assign({}, STATES.get(namespace));
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: subscribe to namestate updates
/*/ USTATE.OnStateChange = (namespace, listener, src_uid) => {
  namespace = m_ConformNamespace(namespace);
  if (!namespace) throw Error(BAD_NSPACE);
  if (typeof listener !== 'function') throw Error(BAD_LISTENR);
  if (src_uid === undefined) console.warn(NO_UID_FLTR);
  let namespaceMessager = m_GetStateMessager(namespace);
  namespaceMessager.HandleMessage(namespace, listener, { handlerUID: src_uid });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: unsubscribe to namestate updates
/*/ USTATE.OffStateChange = (namespace, listener) => {
  namespace = m_ConformNamespace(namespace);
  if (!namespace) throw Error(BAD_NSPACE);
  if (typeof listener !== 'function') throw Error(BAD_LISTENR);
  let namespaceMessager = m_GetStateMessager(namespace);
  namespaceMessager.UnhandleMessage(namespace, listener);
};

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = USTATE;
