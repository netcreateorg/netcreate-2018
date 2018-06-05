/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS MODULE SHELL

    A simple shell with a unique id and unique name.




\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG            = true;
const BAD_NAME       = "name parameter must be a string or unisys module";
const NOT_UNIQUE     = "name must be unique";

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
  /// initializer is a string or another instance of UnisysModule, which is
  /// used to create a derivative name of form 'initializer name:0'
      constructor( initializer ) {

        if (initializer===undefined) throw Error(BAD_NAME);
        if (initializer instanceof UnisysModule) {
          this.name = initializer.AutoName();
        } else if (typeof initializer==='string') {
          this.name = initializer;
        }
        if (MODULES.has( this.name )) throw Error(NOT_UNIQUE);

        // save unique information
        this.uid = `UMOD_${MODULES_COUNTER++}`;

        // save derivative subname counter
        this.subnameCounter = 0;

        // save module in the global module list
        MODULES.set( this.name, this );
      }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Properties
  /// this is used to differentiate sources of events so they don't echo
      UID() {
        return this.uid;
      }
      Name() {
        return this.name;
      }
      AutoName() {
        return `${this.name}:${this.subnameCounter++}`;
      }
      HasModule( name ) {
        return MODULES.has(name);
      }

  } // end UnisysModule


/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UnisysModule;
