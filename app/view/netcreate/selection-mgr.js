/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SELECTION MANAGER

  selection-mgr handles UI selection events like:
  * mouse over graph node
  * Others TBD as selection is rewritten.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/


/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS = require("unisys/client");

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MOD = UNISYS.NewModule(module.id);
var UDATA = UNISYS.NewDataLink(MOD);

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = "selection-mgr: ";

/// UNISYS HANDLERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ lifecycle INITIALIZE handler
/*/
MOD.Hook("INITIALIZE", () => {
  UDATA.HandleMessage('USER_HILITE_NODE', m_UserHighlightNode);
  UDATA.HandleMessage('AUTOSUGGEST_HILITE_NODE', m_AutoSuggestHiliteNode);
}); // end UNISYS_INIT


/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_UserHighlightNode(data) {
  // console.log('mouseover', data.nodeId)
  const SELECTION = UDATA.AppState('SELECTION');
  SELECTION.userHighlightNodeId = data.nodeId;
  UDATA.SetAppState('SELECTION', SELECTION);
}

function m_AutoSuggestHiliteNode(data) {
  const SELECTION = UDATA.AppState('SELECTION');
  SELECTION.autosuggestHiliteNodeId = data.nodeId;
  UDATA.SetAppState('SELECTION', SELECTION);
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
