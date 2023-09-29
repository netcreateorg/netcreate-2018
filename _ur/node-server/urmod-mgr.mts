#!/usr/bin/env node
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UR PROCESS

  a forked module or an imported module that implements our version of
  streaming data communcations

  UR_Fork() - returns an UrModule instance of type 'fork'

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { fork } from 'node:child_process';
import { join } from 'node:path';
// MTS
import { DirExists, Files } from './files.mts';
import UrModule from './class-urmodule.mts';
import { DIR_URMODS, ShortPath as u_short } from './env-node.mts';
// JS imports are assumed to be CJS and cannot be destructured
import ERROR from '../common/error-mgr.js';
import PROMPT from '../common/prompts.js';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = PROMPT.makeTerminalOut(' UPROC', 'TagCyan');
const DBG = true;
const { DIE } = ERROR;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LAUNCH_PREFIX = '@';
let URDIR = '';

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\
/** API: fork a module and setup its IPC
 *  @param {string} modname "moduleDir/@entryFile"
 *  @param input input file or stream
 *  @param output output file or stream
 *  @returns {object} input, output, options props if found
 */
async function UR_Fork(modname, opt = {}) {
  const fn = `UR_Fork ${modname}:`;
  LOG(fn, 'starting');
  let child; // hold ur module instance
  //
  const { input, output, cwd } = m_ParseOptions(opt);
  if (cwd) URDIR = cwd;
  if (URDIR.endsWith('/')) URDIR = URDIR.slice(0, -1);
  let { modpath, entry } = m_ParseModulePathString(modname, fn);
  let forkPath = `${URDIR}/${modpath}`;
  if (DBG) LOG('searching', u_short(forkPath), 'for modules');
  const entryFiles = m_ReadModuleEntryFiles(modpath);
  if (DBG) LOG('found entryfiles', entryFiles);
  if (entry) {
    if (!entryFiles.includes(entry))
      DIE(fn, `error: %{entry} is not in ${URDIR}${modpath}`);
    /* SUCCESS */
    if (DBG) LOG(`launching '${u_short(forkPath)}/${entry}'`);
    child = fork(entry, { cwd: forkPath });
    return child;
  }
  if (entryFiles.length === 0)
    DIE(fn, `error: no @entry modules found in ${URDIR}${modpath}`);

  /* SUCCESS */
  entry = entryFiles[0];
  if (DBG) LOG(`launching '${modpath}/${entry}'`);
  child = fork(entry, { cwd: `${URDIR}${modpath}/` });
  const urmod = new UrModule(child, { name: `${modpath}/${entry}` });
  return urmod;
}

/// SUPPORT FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Used by UR_Fork: given a variable number of args, return all the
 *  possibilities the order is input stream, output stream, options. throws
 *  error and exits process on error
 *  @param {array} args 0,1,2,3 arguments to parse
 *  @returns {object} input, output, cwd if defined
 */
function m_ParseOptions(opt) {
  const fn = 'm_ParseOptions';
  let { input, output, cwd = '' } = opt;
  if (input) {
    if (!(input instanceof UrModule))
      throw new Error(`${fn}: input must be UrModule instance or undefined`);
  }
  if (output) {
    if (!(output instanceof UrModule))
      throw new Error(`${fn}: output must be UrModule instance or undefined`);
  }
  if (cwd) {
    if (typeof cwd !== 'string')
      throw new Error(`${fn}: cwd must be string or undefined`);
  } else {
    cwd = DIR_URMODS;
  }
  return {
    input,
    output,
    cwd
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
function m_ReadModuleEntryFiles(modname) {
  const fn = 'm_ReadModuleEntryFiles:';
  const modulePath = join(URDIR, modname);
  // if (DBG) LOG(fn, 'searching', u_short(modulePath), 'for entry files');
  if (!DirExists(modulePath)) {
    console.log('error', modulePath);
    DIE(fn, 'error:', modname, `not found in ${URDIR} directory`);
  }
  const files = Files(modulePath);
  const entryFiles = files.filter(file => file.startsWith(LAUNCH_PREFIX));
  // if (DBG) LOG(fn, 'found entry files', entryFiles);
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
  const fn = 'u_argType:';
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

function ProcTest() {
  console.log('proc test');
}
/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { UR_Fork, ProcTest };
