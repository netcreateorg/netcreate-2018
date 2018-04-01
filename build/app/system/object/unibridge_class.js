/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS BRIDGE
    Instances of this class are created by UNISYS.NewBridge(srcObj).

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG         = true;
const BAD_CONFIG  = "must pass minimum config object with 'name' property unique string";
const BAD_NAME    = "name parameter must be a unique string";

/// MODULE DECLARATIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var BRIDGE_ID     = 100;
var BRIDGES       = new Map();

/// UNISYS BRIDGE CLASS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ This class implements a UNISYS ID that is unique in the system.
/*/ class UniBridge {

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// CONSTRUCTOR

      constructor(parent) {
        // save unique id
        this.uid = `UBR_${BRIDGE_ID++}`;
        this.parent = parent;
        // save bridge in global bridge list
        BRIDGES.set(this.uid,this);
      }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UNIQUE UNISYS ID for local application
  /// this is used to differentiate sources of events so they don't echo

      UID() { return this.uid; }

    } // end UniModule

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    UniBridge.GetBridge = function ( uid ) {
      return BRIDGES.get(uid);
    };


/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UniBridge;
