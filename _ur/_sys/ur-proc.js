#!/usr/bin/env node
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UR PROCESS

  a forked module or an imported module that implements our version of
  streaming data communcations

  UR_Fork() - returns an UrModule instance of type 'fork'

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const { fork } = require('child_process');
const path = require('path');
const FILES = require('./files');
const { DIE } = require('./error-mgr');
const UrModule = require('./class-urmodule');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = require('./prompts').makeTerminalOut(' UPROC', 'TagCyan');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LAUNCH_PREFIX = '@';
const URDIR = path.join(__dirname, '..');

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: fork a module and setup its IPC
 *  @param {string} modname "moduleDir/@entryFile"
 *  @param input input file or stream
 *  @param output output file or stream
 *  @returns {object} input, output, options props if found
 */
async function UR_Fork(modname, opt = {}) {
  const fn = `UR_Fork ${modname}:`;
  let child; // hold ur module instance
  //
  const { input, output } = m_ParseOptions(opt);
  let { modpath, entry } = m_ParseModulePathString(modname, fn);
  let forkPath = `${URDIR}/${modpath}`;
  const entryFiles = await m_ReadModuleEntryFiles(modpath);
  if (entry) {
    if (!entryFiles.includes(entry))
      DIE(fn, `error: %{entry} is not in ${URDIR}/${modpath}`);
    /* SUCCESS */
    if (DBG) LOG(`launching '${forkPath}/${entry}'`);
    child = fork(entry, { cwd: forkPath });
    return child;
  }
  if (entryFiles.length === 0)
    DIE(fm, `error: no @entry modules found in ${URDIR}/${modpath}`);

  /* SUCCESS */
  entry = entryFiles[0];
  if (DBG) LOG(`launching '${modpath}/${entry}'`);
  child = fork(entry, { cwd: `${URDIR}/${modpath}/` });
  const urmod = new UrModule(child, { name: `${modpath}/${entry}` });
  return urmod;
}

/// SUPPORT FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Used by UR_Fork: given a variable number of args, return all the
 *  possibilities the order is input stream, output stream, options. throws
 *  error and exits process on error
 *  @param {array} args 0,1,2,3 arguments to parse
 *  @returns {object} input, output if defined
 */
function m_ParseOptions(opt) {
  const fn = 'm_ParseOptions';
  const { input, output } = opt;
  if (input) {
    console.log('input', input);
    if (!(input instanceof UrModule))
      throw new Error(`${fn}: input must be UrModule instance or undefined`);
  }
  if (output) {
    if (!(output instanceof UrModule))
      throw new Error(`${fn}: output must be UrModule instance or undefined`);
  }
  return {
    input,
    output
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** (unused)
 *  parses variable number of arguments for (input,output,options,...extra)
 *  replace by m_ParseOptions() then variable args was replaced with options
 *  object to simplify logic, but retained because it's an interesting bit of
 *  code for this style of call.
 */
function m_ParseArgumentVariations(args) {
  const fn = 'm_ParseArgumentVariations';
  const argCount = args.reduce((ac, cv) => (cv !== undefined ? ac + 1 : ac), 0);

  let [a, b, c, ...d] = args;

  const parsed = {
    input: undefined,
    output: undefined,
    options: undefined,
    extra: undefined
  };
  switch (argCount) {
    case 0:
      break;
    case 1:
      if (u_argType(a).stream) parsed.input = a;
      else if (u_argType(a).options) parsed.options = a;
      break;
    case 2: // input, [ output | options ]
      // arg1
      if (u_argType(a).options) DIE(fn, `(2 args) arg1 must be urstream`);
      if (u_argType(a).stream) parsed.input = a;
      // arg2
      if (u_argType(b).stream) parsed.output = b;
      else if (u_argType(b).options) parsed.options = b;
      break;
    case 3: // input, output, options
      // arg1
      if (u_argType(a).options) DIE(fn, `(3 args) arg1 must be urstream`);
      if (u_argType(a).stream) parsed.input = a;
      // arg2
      if (u_argType(b).options) DIE(fn, `(3 args) arg2 must be urstream`);
      if (u_argType(b).stream) parsed.output = b;
      // arg3
      if (u_argType(c).options) parsed.options = c;
      else DIE(fn, `(3 args) arg3 must be an options object`);
      break;
    default:
      DIE(fn, `error: too many arguments`);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Used by UR_Fork: given a module path string, parse into a module path
 *  and an entry file if it is present.
 *  @param {string} modpath path relative to _ur directory
 *  @returns {object} modpath, entry
 */
function m_ParseModulePathString(modname, fn = 'm_ParseModulePathString') {
  let modpath, entry;
  // required argument
  if (typeof modname !== 'string')
    DIE(fn, 'error: arg1 must be a string path not', typeof modname);
  // handle modname and modname/@entry
  const pathbits = modname.split('/');
  if (pathbits.length === 2) {
    modpath = pathbits[0];
    entry = pathbits[1];
  } else if (pathbits.length === 1) {
    modpath = modname;
  } else DIE(fn, 'error: arg1 syntax path too deep');
  // make sure entryJS is a string or undefined
  if (entry !== undefined && typeof entry !== 'string')
    DIE(fn, 'error: bad module entry');
  // double-check entry has leading @ if it's a string
  if (entry && !entry.startsWith('@'))
    DIE(fn, `error: entrypoint '${entry}' must begin with @`);

  // success
  return { modpath, entry };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** look for files beginning with @ in the module directory modname.
 *  If an explicit entryFile is part of the path, that is returned,
 *  otherwise the first file found is returned.
 *  @param {string} modname format "moduleDir/[@entryFile]"
 *  @returns {string} path to the entryFile
 */
async function m_ReadModuleEntryFiles(modname) {
  const fn = 'm_ReadModuleEntryFiles';
  const modulePath = path.join(URDIR, modname);
  if (!FILES.DirExists(modulePath)) {
    DIE(fn, 'error:', modname, `not found in ${URDIR} directory`);
  }
  const files = await FILES.Files(modulePath);
  const entryFiles = files.filter(file => file.startsWith(LAUNCH_PREFIX));
  return entryFiles;
}

/// UTILITY FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const u_isUrStream = obj => typeof obj.on === 'function';
const u_isOptions = obj => {
  if (typeof obj !== 'object') return false;
  if (typeof obj.on === 'function') return false;
  return true;
};
const u_argType = arg => {
  let test = {
    stream: undefined,
    options: undefined
  };
  if (u_isUrStream(arg)) test.stream = arg;
  else if (u_isOptions(arg)) test.options = arg;
  else DIE(fn, `arg must be an urStream or options object`);
  //
  return test;
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  UR_Fork
};
