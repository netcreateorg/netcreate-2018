/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Reflection and other Object Inspection Utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const STACKTRACE = require('stacktrace-js');
const PATH       = require('system/util/path');

/// INITIALIZE MAIN MODULE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var   REFLECT    = {};

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Returns the name of the constructor for the current class
    https://stackoverflow.com/questions/22777181/typescript-get-to-get-class-name-at-runtime
/*/ REFLECT.ExtractClassName = function( obj ) {
       var funcNameRegex = /function (.{1,})\(/;
       var results = (funcNameRegex).exec((obj).constructor.toString());
       return (results && results.length > 1) ? results[1] : "";
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Returns the name of the calling function
/*/ REFLECT.FunctionName = function( depth=1 ) {
      let stack = STACKTRACE.getSync();
      let frame = stack[depth];
      let fn = frame.functionName;
      if (!fn) {
        fn = PATH.Basename(frame.fileName);
        fn += `:${frame.lineNumber}:${frame.columnNumber}`;
      }
      return fn;
    };


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = REFLECT;
