if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  JS CLI

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const SETTINGS = require('settings');
const UNISYS = require('unisys/client');
const PROMPTS = require('system/util/prompts');
const PR = PROMPTS.Pad('JSCLI');

/// CONSTANTS & DECLARATIONS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const SHOW_DOM = true;

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let JSCLI = UNISYS.NewModule(module.id);
let UDATA = UNISYS.NewDataLink(JSCLI);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let CMD = [];

/// DEFINE CLI FUNCTIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
JSCLI.AddFunction = f => {
  if (typeof f !== 'function') throw Error('AddFunction() arg is Function object');
  CMD.push(f);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
JSCLI.HelpString = () => {
  let out = 'The following CLI commands are available\n\n';
  CMD.forEach(f => {
    out += `  ${f.name}()\n`;
  });
  out += '\n';
  out += 'Mac shortcuts to open console\n';
  out += '  Chrome  : cmd-option-j\n';
  out += '  Firefox : cmd-option-k\n';
  out += 'PC use ctrl-shift instead\n';
  return out;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initialize registered functions
 */
JSCLI.Hook('RESET', () => {
  JSCLI.AddFunction(function ncHelp() {
    return JSCLI.HelpString();
  });
  CMD.forEach(f => {
    window[f.name] = f;
  });
  if (SHOW_DOM) JSCLI.DOM_ShowInstructions();
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
JSCLI.DOM_ShowInstructions = () => {
  var E_SHELL = document.getElementById('fdshell');
  if (!E_SHELL) {
    // console.warn(PR,"DOM_ShowInstructions() found no id 'fdshell' to append instructions. Type 'ncHelp()' to list available JSCLI functions.");
    return;
  }
  var E_OUT = document.createElement('pre');
  var E_HEADER = document.createElement('h4');
  E_SHELL.appendChild(E_HEADER);
  E_SHELL.appendChild(E_OUT);
  E_HEADER.innerHTML = 'Command Information';
  E_OUT.innerHTML = JSCLI.HelpString();
};

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = JSCLI;
