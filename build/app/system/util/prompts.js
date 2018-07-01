/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  String Prompts for server

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const REFLECT   = require('./reflection');
var   PROMPTS   = {};

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// detect node environment and set padsize accordingly
const IS_NODE   = ((typeof process!=='undefined') && (process.release) &&
                  (process.release.name==='node'));
const PAD_MAX   = 20;
var   PAD_SIZE  = (IS_NODE)
                  ? 9   // nodejs
                  : 0; // not nodejs

/// PROMPT STRING HELPERS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ return a string padded to work as a prompt for either browser or node
    console output
/*/ PROMPTS.Pad = function( prompt='' ) {
      let len = prompt.length;
      if (IS_NODE) return prompt.padEnd(PAD_SIZE,' ')+'-';
      // must be non-node environment, so do dynamic string adjust
      if ((len>PAD_SIZE)&&(len<PAD_MAX)) PAD_SIZE = len;
      if (len>PAD_MAX) prompt = prompt.substr(0,PAD_MAX-1);
      return prompt.padEnd(PAD_SIZE,' ')+': ';
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ return string of calling object's name
/*/ PROMPTS.FunctionName = function() {
      return REFLECT.FunctionName(2);
    };


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PROMPTS;
