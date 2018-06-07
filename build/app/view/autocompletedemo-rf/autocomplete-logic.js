/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG      = true;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS   = require('system/unisys');

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MOD        = UNISYS.NewModule(module.id);
var UDATA      = UNISYS.NewDataLink(MOD);

MOD.Hook('INITIALIZE',()=>{

  console.log(`*** initialize ${MOD.ModuleName()}`);

  UDATA.Register('SOURCE_SELECT',function(data) {
    console.log('SOURCE_SELECT',data);
  });
  UDATA.Register('SOURCE_DRAG',function(data) {
    console.log('SOURCE_DRAG',data);
  });
  UDATA.Register('FILTER_SOURCES',function(data) {
    console.log('FILTER_SOURCES',data);
  });
  UDATA.Register('SOURCE_HILITE',function(data) {
    console.log('SOURCE_HILITE',data);
  });
  UDATA.Register('SOURCE_UPDATE',function(data) {
    console.log('SOURCE_UPDATE',data);
  });

});





/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
