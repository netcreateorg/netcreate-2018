/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Reflection and other Object Inspection Utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var REFLECT = {};


/*/ Returns the name of the constructor for the current class
    https://stackoverflow.com/questions/22777181/typescript-get-to-get-class-name-at-runtime
/*/ REFLECT.ExtractClassName = function(obj) {
       var funcNameRegex = /function (.{1,})\(/;
       var results = (funcNameRegex).exec((obj).constructor.toString());
       return (results && results.length > 1) ? results[1] : "";
    };


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = REFLECT;
