/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  String Prompts for server

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const REFLECT = require('./reflection');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// detect node environment and set padsize accordingly
const IS_NODE =
  typeof process !== 'undefined' &&
  process.release &&
  process.release.name === 'node';
var PAD_SIZE = IS_NODE
  ? 9 // nodejs
  : 0; // not nodejs
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// module declaration
var PROMPTS = {};

/// PROMPT STRING HELPERS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a string padded to work as a prompt for either browser or node
 *  console output
 */
PROMPTS.Pad = function (prompt = '', psize = PAD_SIZE) {
  let len = prompt.length;
  if (IS_NODE) return prompt.padEnd(psize, ' ') + '-';
  // must be non-node environment, so do dynamic string adjust
  if (!psize) return prompt + ':';
  // if this far, then we're truncating
  if (len >= psize) prompt = prompt.substr(0, psize - 1);
  else prompt.padEnd(psize, ' ');
  return prompt + ':';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns PAD_SIZE stars
 */
PROMPTS.Stars = function (count) {
  if (count !== undefined) return ''.padEnd(count, '*');
  return ''.padEnd(PAD_SIZE, '*');
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return string of calling object's name
 */
PROMPTS.FunctionName = function () {
  return REFLECT.FunctionName(2);
};

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PROMPTS;
