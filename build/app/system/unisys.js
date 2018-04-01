/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS API

    [x] UnisysModule = UNISYS.NewModule(name);
    [x] UNISYS.Hook('PHASENAME',functionHandler)
    -- network messages --
    [ ] UNISYS.RegisterCall('MESG', functionHandler(data)) - define handler for a message received
    [ ] UNISYS.LocalCall('MESG', data);
    [ ] UNISYS.NetworkCall('MESG', data);
    -- module event interface --
    [x] UnisysModule.On('EVENT',functionHandler(event)) - subscribe
    [x] UnisysModule.Off('EVENT',functionHandler(event)) - unsubscribe
    [x] UnisysModule.Emit('EVENT', eventData) - emit to subscribers
    -- shared state --
    [x] UNISYS.SetState('namespace', stateObj);
    [x] UNISYS.OnStateChange('namespace',functionHandler (stateObj));
    [x] UNISYS.OffStateChange('namespace',functionHandler (stateObj));

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG         = true;
const BAD_NSPACE  = "namespace must be string without _ chars";
const BAD_LISTENR = "listener must be function";
const NO_UID_FLTR = "UNISYS.OnStateChange: pass DST_UID parameter to enable echo cancellation";

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UniModule   = require('system/object/unimodule_class');
const UniBridge   = require('system/object/unibridge_class');
const LifeCycle   = require('system/event/lifecycle');
const Messager    = require('system/network/messager');
const Emitter     = require('system/event/emitter_class');


/// INITIALIZE MAIN MODULE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var UNISYS        = {};
var STATES        = new Map(); // namespace str => shallow state object
var STATES_LISTEN = new Map(); // namespace str => emitter

/// UNISYS MODULE MAKING //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: creates new umodule object for code modules that want access to
    UNISYS events, lifecycle, state, and messaging
/*/ UNISYS.NewModule = (config) => {
      return new UniModule(config);
    };
/*/ API: creates new umodule object solely for the purpose of getting a unique
    UNISYS ID (UID) for use with event tracking
/*/ UNISYS.NewBridge = (parent) => {
      return new UniBridge(parent);
    };
/*/ API: retrieve a bridge instance by UID
/*/ UNISYS.GetBridge = UniBridge.GetBridge;


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
/*/ function m_GetStateEmitter (nspace) {
      nspace = m_ConformNamespace(nspace);
      if (!nspace) throw Error(BAD_NSPACE);
      let em = STATES_LISTEN.get(nspace);
      if (!em) {
        em = new Emitter();
        STATES_LISTEN.set(nspace,em);
      }
      return em;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: update the selected namespace state with new state
/*/ UNISYS.SetState = (namespace, newState, src_uid) => {
      namespace = m_ConformNamespace(namespace);
      if (!namespace) throw Error(BAD_NSPACE);
      // update old state by partially overwrite of oldstate
      if (!STATES.has(namespace)) STATES.set(namespace,{});
      Object.assign(STATES.get(namespace),newState);
      // forward new state to namespace listeners
      let emitter = m_GetStateEmitter(namespace);
      emitter.Emit(namespace,newState,src_uid);
      // future: forward also to network
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: retrieve a COPY of state object of namespace
/*/ UNISYS.State = (namespace) => {
      namespace = m_ConformNamespace(namespace);
      if (!namespace) throw Error(BAD_NSPACE);
      return Object.assign({},STATES.get(namespace));
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: subscribe to namestate updates
/*/ UNISYS.OnStateChange = (namespace, listener, dst_uid) => {
      namespace = m_ConformNamespace(namespace);
      if (!namespace) throw Error(BAD_NSPACE);
      if (typeof listener!=='function') throw Error(BAD_LISTENR);
      if (dst_uid===undefined) console.warn(NO_UID_FLTR);
      let namespaceEmitter = m_GetStateEmitter(namespace);
      namespaceEmitter.On(namespace,listener,dst_uid);
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: unsubscribe to namestate updates
/*/ UNISYS.OffStateChange = (namespace, listener) => {
      namespace = m_ConformNamespace(namespace);
      if (!namespace) throw Error(BAD_NSPACE);
      if (typeof listener!=='function') throw Error(BAD_LISTENR);
      let namespaceEmitter = m_GetStateEmitter(namespace);
      namespaceEmitter.Off(namespace,listener);
    };



/// LIFECYCLE METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: LifeCycle Hook() functions,
/*/ UNISYS.Hook = LifeCycle.Hook;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: application startup
/*/ UNISYS.EnterApp = () => {
      return new Promise( async (resolve,reject)=>{
        await LifeCycle.Execute('INITIALIZE');
        await LifeCycle.Execute('LOADASSETS');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: configure system before run
/*/ UNISYS.SetupRun = () => {
      return new Promise( async (resolve,reject)=>{
        await LifeCycle.Execute('RESET');
        await LifeCycle.Execute('CONFIGURE');
        await LifeCycle.Execute('START');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: handle periodic updates for a simulation-driven timestep
/*/ UNISYS.Run = () => {
      return new Promise( async (resolve,reject)=>{
        await LifeCycle.Execute('UPDATE');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown lifecycle
/*/ UNISYS.BeforePause = async () => {
      return new Promise( async (resolve,reject)=>{
        await LifeCycle.Execute('PREPAUSE');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown lifecycle
/*/ UNISYS.Paused = async () => {
      return new Promise( async (resolve,reject)=>{
        await LifeCycle.Execute('PAUSE');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown lifecycle
/*/ UNISYS.PostPause = async () => {
      return new Promise( async (resolve,reject)=>{
        await LifeCycle.Execute('POSTPAUSE');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Shutdown lifecycle
/*/ UNISYS.CleanupRun = async () => {
      return new Promise( async (resolve,reject)=>{
        await LifeCycle.Execute('STOP');
        resolve();
      });
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: application shutdown
/*/ UNISYS.ExitApp = async () => {
      return new Promise( async (resolve,reject)=>{
        await LifeCycle.Execute('UNLOADASSETS');
        await LifeCycle.Execute('SHUTDOWN');
        resolve();
      });
    };


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNISYS;
