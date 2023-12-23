/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Path Strings
  REGEX approach from https://stackoverflow.com/a/47212224

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var PATH = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const rx_dir = /(.*)\/+([^/]*)$/;
const rx_file = /()(.*)$/;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return the directory portion of a path
 */
PATH.Parse = function (str) {
  // [0] original string
  // [1] dirname
  // [2] filename
  return rx_dir.exec(str) || rx_file.exec(str);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return the directory portion of a path
 */
PATH.Dirname = function (str) {
  // return str.substring(0,str.lastIndexOf("/"));
  return (rx_dir.exec(str) || rx_file.exec(str))[1];
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return the file portion of a path
 */
PATH.Basename = function (str) {
  // return str.substring(str.lastIndexOf("/")+1);
  return (rx_dir.exec(str) || rx_file.exec(str))[2];
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return the string stripped of extension
 */
PATH.StripExt = function (str) {
  return str.substr(0, str.lastIndexOf('.'));
};

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PATH;
