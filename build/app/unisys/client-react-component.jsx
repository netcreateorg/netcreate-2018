if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Add UNISYS functions to REACT component to hide UDATA and UMODULE details
  To use, extend components from UNISYS.Component instead of REACT.Component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React     = require('react');
const UDATA     = require('unisys/client-datalink-class');
const UMODULE   = require('unisys/client-module-class');
const REFLECT   = require('system/util/reflection');

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let UnisysComponent = class extends React.Component {
  constructor() {
    super();
    this.UMODULE = new UMODULE(module.id);
    this.UDATA = new UDATA(this.UMODULE);
  }

  /// MESSAGE HANDLING API METHODS
  HandleMessage( m, lis ) { this.UDATA.HandleMessage(m,lis) }
  UnhandleMessage( m, lis ) { f_deprecated('DropMessage'); this.UDATA.UnhandleMessage(m,lis) }
  DropMessage( m, lis ) { this.UDATA.UnhandleMessage(m,lis) }
  /// MESSAGE INVOCATION API METHODS
  Call( m, d, o ) { return this.UDATA.Call(m,d,o) }
  Send( m, d, o ) { this.UDATA.Send(m,d,o) }
  Signal( m, d, o ) { this.UDATA.Signal(m,d,o) }
  AppCall( m, d, o ) { return this.UDATA.LocalCall(m,d,o) }
  AppSend( m, d, o ) { this.UDATA.LocalSend(m,d,o) }
  AppSignal( m, d, o ) { this.UDATA.LocalSignal(m,d,o) }
  NetSend( m, d, o ) { this.UDATA.NetSend(m,d,o) }
  NetCall( m, d, o ) { return this.UDATA.NetCall(m,d,o) }
  NetSignal( m, d, o ) { this.UDATA.NetSignal(m,d,o) }
  LocalCall( m, d, o ) { f_deprecated('AppCall'); return this.UDATA.LocalCall(m,d,o) }
  LocalSend( m, d, o ) { f_deprecated('AppSend'); this.UDATA.LocalSend(m,d,o) }
  LocalSignal( m, d, o ) { f_deprecated('AppSignal'); this.UDATA.LocalSignal(m,d,o) }
  /// STATE API METHODS
  State( ns ) { f_deprecated('AppState'); return this.UDATA.State(ns) }
  SetState( ns, so ) { f_deprecated('SetAppState'); this.UDATA.SetState(ns,so) }
  OnStateChange( ns, lis ) { f_deprecated('OnAppStateChange'); this.UDATA.OnStateChange(ns,lis) }
  OffStateChange( ns, lis ) { f_deprecated('AppStateChangeOff'); this.UDATA.OffStateChange(ns,lis) }
  /// NEW STATE API METHODS
  AppState( ns ) { return this.UDATA.State(ns) }
  SetAppState( ns, so ) { this.UDATA.SetState(ns,so) }
  OnAppStateChange( ns, lis ) { this.UDATA.OnStateChange(ns,lis) }
  AppStateChangeOff( ns, lis ) { this.UDATA.OffStateChange(ns,lis) }
  NetState( ns ) { f_unimplemented() }
  SetNetState( ns, so ) { f_unimplemented() }
  OnNetStateChange( ns, lis ) { f_unimplemented() }
  NetStateChangeOff( ns, lis ) { f_unimplemented() }
  /// LIFECYCLE API
  Hook( p, f ) { f_unsupported('is not available in React components') }

} // UnisysComponent

function f_deprecated(repl) {
  let out = `${REFLECT.FunctionName(2)}() is deprecated.`;
  if (typeof repl==='string') out+=` Use ${repl}() instead.`;
  console.warn(out);
}

function f_unimplemented() {
  console.warn(`${REFLECT.FunctionName(2)}() is not yet implemented.`);
}

function f_unsupported(reason) {
  console.warn(`${REFLECT.FunctionName(2)}() ${reason}`);
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UnisysComponent;
