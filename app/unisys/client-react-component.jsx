if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Add UNISYS functions to REACT component to hide UDATA and UMODULE details
  To use, extend components from UNISYS.Component instead of REACT.Component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const UDATA = require('unisys/client-datalink-class');
const UMODULE = require('unisys/client-module-class');
const REFLECT = require('system/util/reflection');

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let UnisysComponent = class extends React.Component {
  constructor() {
    super();
    this.UMODULE = new UMODULE(module.id);
    this.UDATA = new UDATA(this.UMODULE);
  }

  /// MESSAGE HANDLING API METHODS
  HandleMessage(m, lis) {
    this.UDATA.HandleMessage(m, lis);
  }
  UnhandleMessage(m, lis) {
    f_deprecated('DropMessage');
    this.UDATA.UnhandleMessage(m, lis);
  }
  DropMessage(m, lis) {
    this.UDATA.UnhandleMessage(m, lis);
  }

  /// SPECIAL EVENTS
  OnDOMReady(lis) {
    this.UMODULE.Hook('DOM_READY', lis);
  }
  OnReset(lis) {
    this.UMODULE.Hook('RESET', lis);
  }
  OnStart(lis) {
    this.UMODULE.Hook('START', lis);
  }
  OnAppReady(lis) {
    this.UMODULE.Hook('APP_READY', lis);
  }
  OnRun(lis) {
    this.UMODULE.Hook('RUN', lis);
  }
  OnDisconnect(lis) {
    this.UMODULE.Hook('DISCONNECT', lis);
  }

  /// MESSAGE INVOCATION API METHODS
  Call(m, d, o) {
    return this.UDATA.Call(m, d, o);
  }
  Send(m, d, o) {
    this.UDATA.Send(m, d, o);
  }
  Signal(m, d, o) {
    this.UDATA.Signal(m, d, o);
  }
  AppCall(m, d, o) {
    return this.UDATA.LocalCall(m, d, o);
  }
  AppSend(m, d, o) {
    this.UDATA.LocalSend(m, d, o);
  }
  AppSignal(m, d, o) {
    this.UDATA.LocalSignal(m, d, o);
  }
  NetSend(m, d, o) {
    this.UDATA.NetSend(m, d, o);
  }
  NetCall(m, d, o) {
    return this.UDATA.NetCall(m, d, o);
  }
  NetSignal(m, d, o) {
    this.UDATA.NetSignal(m, d, o);
  }
  LocalCall(m, d, o) {
    f_deprecated('AppCall');
    return this.UDATA.LocalCall(m, d, o);
  }
  LocalSend(m, d, o) {
    f_deprecated('AppSend');
    this.UDATA.LocalSend(m, d, o);
  }
  LocalSignal(m, d, o) {
    f_deprecated('AppSignal');
    this.UDATA.LocalSignal(m, d, o);
  }
  /// STATE API METHODS
  State(ns) {
    f_deprecated('AppState');
    return this.AppState(ns);
  }
  SetState(ns, so) {
    f_deprecated('SetAppState');
    this.SetAppState(ns, so);
  }
  OnStateChange(ns, lis) {
    f_deprecated('OnAppStateChange');
    this.OnAppStateChange(ns, lis);
  }
  OffStateChange(ns, lis) {
    f_deprecated('AppStateChangeOff');
    this.AppStateChangeOff(ns, lis);
  }
  /// NEW STATE API METHODS
  AppState(ns) {
    return this.UDATA.AppState(ns);
  }
  SetAppState(ns, so) {
    this.UDATA.SetAppState(ns, so);
  }
  OnAppStateChange(ns, lis) {
    this.UDATA.OnAppStateChange(ns, lis);
  }
  AppStateChangeOff(ns, lis) {
    this.UDATA.AppStateChangeOff(ns, lis);
  }
  NetState(ns) {
    f_unimplemented();
  }
  SetNetState(ns, so) {
    f_unimplemented();
  }
  OnNetStateChange(ns, lis) {
    f_unimplemented();
  }
  NetStateChangeOff(ns, lis) {
    f_unimplemented();
  }
  /// LIFECYCLE API
  Hook(p, f) {
    f_unsupported('is not available for UNISYS.Component');
  }
}; // UnisysComponent

function f_deprecated(repl) {
  let out = `${REFLECT.FunctionName(2)} is deprecated.`;
  if (typeof repl === 'string') out += ` Use ${repl}() instead.`;
  console.warn(out);
}

function f_unimplemented() {
  let out = `${REFLECT.FunctionName(2)} is not yet implemented.`;
  alert(`${out}\n\nCrashing now! Use javascript console to debug`);
  console.error(out);
  debugger;
}

function f_unsupported(reason) {
  let out = `${REFLECT.FunctionName(2)} ${reason}`;
  alert(`${out}\n\nCrashing now! Use javascript console to debug`);
  console.error(out);
  debugger;
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UnisysComponent;
