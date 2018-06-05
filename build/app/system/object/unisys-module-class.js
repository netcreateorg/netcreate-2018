/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS MODULE SHELL

    A simple shell with a unique id and unique name. Currently this is just
    a utility class for maintaining naming convention for modules, and
    also ensuring they all have the same properties.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG            = true;
const BAD_NAME       = "name parameter must be a string or unisys module";
const NOT_UNIQUE     = "name must be unique";

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LIFECYCLE      = require('system/unisys-lifecycle');

/// MODULE DECLARATIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MODULES          = new Map(); // unisys modules map
var MODULES_COUNTER  = 1;         // unisys modules counter

/// UNISYS MODULE CLASS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Instances of this class can register/unregister message handlers and also
    send messages. Constructor receives an owner, which is inspected for
    properties to determine how to classify the created messager for debugging
    purposes
/*/ class UnisysModule {

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ initializer is the value module.id or another instance of UnisysModule,
      which is used to create a derivative name of form 'initializer name:0'
  /*/ constructor( module ) {

        if (module===undefined) throw Error(BAD_NAME);
        // can pass another unisys modules to create derived name
        if (module instanceof UnisysModule) {
          this.module_id = module.AutoName();
        } else if (typeof module==='string') {
        // otherwise, copy the initializer
          this.module_id = module;
        }
        if (MODULES.has( this.name )) throw Error(NOT_UNIQUE);

        // save unique information
        this.uid = `UMOD_${MODULES_COUNTER++}`;

        // save derivative subname counter
        this.subnameCounter = 0;

        // save module in the global module list
        MODULES.set( this.module_id, this );
      }

  /// PROPERTIES //////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ this is used to differentiate sources of events so they don't echo
  /*/ UID() {
        return this.uid;
      }
  /*/ this is used for identifying the module. It must be unique across all
  /*/ ModuleID() {
        return this.module_id;
      }
  /*/ used to create a derivative name
  /*/ AutoName() {
        return `${this.module_id}:${this.subnameCounter++}`;
      }
  /*/ check if the name already exists in the MODULES collection
  /*/ HasModule( name ) {
        return MODULES.has(name);
      }

  /// LIFECYCLE /////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ wrap Hook function to include the ModuleID
  /*/ Hook( phase, f ) {
        LIFECYCLE.Hook(phase,f,this.ModuleID());
      }


  } // end UnisysModule


/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UnisysModule;
