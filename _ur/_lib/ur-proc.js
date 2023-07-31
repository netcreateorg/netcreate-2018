#!/usr/bin/env node
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UR PROCESS

  a forked module or an imported module that implements our version of
  streaming data communcations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const { fork } = require('child_process');
const path = require('path');
const FILES = require('./files');
const { DIE } = require('./error-mgr');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = require('./prompts').makeTerminalOut(' UPROC', 'TagCyan');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LAUNCH_PREFIX = '@';
const URDIR = '_ur';

/// WIP FUNCTIONS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function m_GetLaunchFiles(modname) {
  const fn = 'FindLaunchFile';
  const modulePath = path.join(__dirname, URDIR, modname);
  if (!FILES.DirExists(modulePath))
    DIE(fn, 'error:', modname, `not found in ${URDIR} directory`);
  const files = await FILES.Files(modulePath);
  const launchFiles = files.filter(file => file.startsWith(LAUNCH_PREFIX));
  return launchFiles;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_CheckModName(modname, fn = 'm_CheckModName') {
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
function m_ValidateOptions(obj) {
  return true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const u_isUrStream = obj => typeof obj.on === 'function';
const u_isOptions = obj => m_ValidateOptions(obj);
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

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a variable number of args, return all the possibilities
 *  the order is input stream, output stream, options. throws error
 *  and exits process on error
 *  @param {array} args 0,1,2,3 arguments to parse
 *  @returns {object} input, output, options props if found
 */
function m_ParseForkArgs(args) {
  const fn = 'm_ParseForkArgs';
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
  return parsed;
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: fork a module and setup its IPC
 *  @param {string} modname "moduleDir/@entryFile"
 *  @param input input file or stream
 *  @param output output file or stream
 */
async function UR_Fork(modname, ...args) {
  const fn = 'UR_Fork';
  let { modpath, entry } = m_CheckModName(modname, fn);
  const { input, output, options } = m_ParseForkArgs(args);
}

/// PROTOTYPE API METHODS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function m_ForkMe(modname) {
  const fn = 'ForkMe';
  let { modpath, entry } = m_CheckModName(modname, fn);
  const u_fork = () => fork(entry, { cwd: `./${URDIR}/${modname}/` });
  // required argument
  if (typeof modname !== 'string')
    DIE(fn, 'error: arg1 must be a string not', modname);
  // make sure entry is a string or undefined
  if (entry !== undefined && typeof entry !== 'string')
    DIE(fn, 'error: arg2 must be a string if defined');

  const launchFiles = await m_GetLaunchFiles(modname);
  if (entry) {
    if (!launchFiles.includes(entry))
      DIE(fn, `error: %{entry} is not in ${URDIR}/${modname}`);
    /* SUCCESS */
    if (DBG) LOG(fn, `launching ${URDIR}/${modname}/${entry}`);
    return u_fork();
  }
  if (launchFiles.length === 0)
    DIE(fm, `error: no @entry modules found in ${URDIR}/${modname}`);

  /* SUCCESS */
  entry = launchFiles[0];
  if (DBG) LOG(fn, `autolaunching ${URDIR}/${modname}/${entry}`);
  return u_fork();
}

/// RUNTIME TESTS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// m_ForkMe('graph');
// m_ForkMe('parse');

// create ingester
// const proc_graph = fork('@test', { cwd: './_ur/graph/' });
// proc_graph.on('message', message => {
//   LOG('graph@test message:', message);
//   APPSERV.WriteAppOut(message);
// });
// // create peg grapher
// const proc_peggy = fork('@init', { cwd: './_ur/parse/' });
// proc_peggy.on('message', message => {
//   LOG('peggy@init message:', message);
//   APPSERV.WriteAppOut(message);
// });

// // initiate the test
// proc_graph.send('test');

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  UR_Fork
};
