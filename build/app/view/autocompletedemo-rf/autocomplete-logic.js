/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG      = true;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS   = require('system/unisys');

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MOD        = UNISYS.NewModule(module.id);
var UNODE      = UNISYS.NewConnector(MOD);

MOD.Hook('INITIALIZE',()=>{
  console.log(`*** initialize ${MOD.ModuleName()}`);

  UNODE.On('SOURCE_SELECT',function(data) {
    console.log('SOURCE_SELECT',data);
  });
  UNODE.On('SOURCE_DRAG',function(data) {
    console.log('SOURCE_DRAG',data);
  });
  UNODE.On('FILTER_SOURCES',function(data) {
    console.log('FILTER_SOURCES',data);
  });
  UNODE.On('SOURCE_HILITE',function(data) {
    console.log('SOURCE_HILITE',data);
  });
  UNODE.On('SOURCE_UPDATE',function(data) {
    console.log('SOURCE_UPDATE',data);
  });


});





/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
