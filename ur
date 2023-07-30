#!/usr/bin/env node
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYNK RUNNER

  URSYNK is the name of the set of communication tools Sri is making to
  support modular asynchronous communication frameworks, based on 
  previous URSYS and UNISYS versions.

  WIP

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const { fork } = require('child_process');
const path = require('path');
const APPSERV = require('./_ur/_lib/appserv');
const FILES = require('./_ur/_lib/files');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = require('./_ur/_lib/prompts').makeTerminalOut('UR', 'TagBlue');
const DBG = false;

/// TESTING NOW ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/

  MINI FORK REFERENCE

  .. child.send (messageData)
  .. child.on('close', (code, signal) => {})
  .. child.on('disconnect', () => {})
  .. child.on('error', (err) => {})
  .. child.on('exit', (code, signal) => {})
  .. child.on('message', (messageData, sendHandle) => {})
  .. child.stdin.write(data)
  .. child.stdin.end()
  .. child.stdout.on('data',data=>{})
  .. child.stderr.on('data',data=>{})

  after forking the process, the child process will send a message
  and then exit on completion. the message protocol itself may need
  to be standardized too with a ur-ipc module.
/*/
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LAUNCH_PREFIX = '@';
const ERR_UR = 444;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function m_GetLaunchFiles(modname) {
  const fn = 'FindLaunchFile';
  const modulePath = path.join(__dirname, '_ur', modname);
  if (!FILES.DirExists(modulePath)) {
    TERM(fn, 'error:', modname, 'not found in _urcmd directory');
    process.exit(ERR_UR);
  }
  const files = await FILES.Files(modulePath);
  const launchFiles = files.filter(file => file.startsWith(LAUNCH_PREFIX));
  return launchFiles;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function m_ForkMe(modname, entryJS) {
  const fn = 'ForkMe';
  if (typeof modname !== 'string') {
    TERM(fn, 'error: arg1 must be a string not', modname);
    process.exit(ERR_UR);
  }
  // make sure entryJS is a string or undefined
  if (entryJS !== undefined && typeof entryJS !== 'string') {
    TERM(fn, 'error: arg2 must be a string if defined');
    process.exit(ERR_UR);
  }
  const u_fork = () => fork(entryJS, { cwd: `./_ur/${modname}/` });
  const launchFiles = await m_GetLaunchFiles(modname);
  if (entryJS) {
    if (!launchFiles.includes(entryJS)) {
      TERM(fn, `error: %{entryJS} is not in _ur/${modname}`);
      process.exit(ERR_UR);
    }
    /* SUCCESS */
    if (DBG) TERM(fn, `launching _ur/${modname}/${entryJS}`);
    return u_fork();
  }
  if (launchFiles.length === 0) {
    TERM(fm, `error: no launch files beginning with @ found in _ur/${modname}`);
    process.exit(ERR_UR);
  }
  /* SUCCESS */
  entryJS = launchFiles[0];
  if (DBG) TERM(fn, `autolaunching _ur/${modname}/${entryJS}`);
  return u_fork();
}

/// RUNTIME ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
m_ForkMe('graph');
m_ForkMe('parse');

// create ingester
// const proc_graph = fork('@test', { cwd: './_ur/graph/' });
// proc_graph.on('message', message => {
//   TERM('graph@test message:', message);
//   APPSERV.WriteAppOut(message);
// });
// // create peg grapher
// const proc_peggy = fork('@init', { cwd: './_ur/parse/' });
// proc_peggy.on('message', message => {
//   TERM('peggy@init message:', message);
//   APPSERV.WriteAppOut(message);
// });

// // initiate the test
// proc_graph.send('test');
