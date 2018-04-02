/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Monkeypatches - Object Hacks

    Utility functions that are monkey-patched onto global objects.
    It is automatically loaded by index.html before other libs

    Methods that are defined in this file all being with HACK to make
    it easier for developers new to this codenbase to find them.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var UTIL = {};


/*/ Returns the name of the constructor for the current class
    https://stackoverflow.com/questions/22777181/typescript-get-to-get-class-name-at-runtime
/*/ UTIL.ExtractClassName = function(obj) {
       var funcNameRegex = /function (.{1,})\(/;
       var results = (funcNameRegex).exec((obj).constructor.toString());
       return (results && results.length > 1) ? results[1] : "";
    };

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UTIL;
