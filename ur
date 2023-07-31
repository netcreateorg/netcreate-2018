#!/usr/bin/env node
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYNK RUNNER

  URSYNK is the name of the set of communication tools Sri is making to
  support modular asynchronous communication frameworks, based on 
  previous URSYS and UNISYS versions.

  WIP

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const APPSERV = require('./_ur/_lib/appserv');
const IPC = require('./_ur/_lib/ipc');
const FILES = require('./_ur/_lib/files');
const { UR_Fork } = require('./_ur/_lib/ur-proc');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = require('./_ur/_lib/prompts').makeTerminalOut('UR', 'TagBlue');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// RUNTIME ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** TEST **/
const child = {
  on: () => {}
};
const options = {};
LOG('testing UR_Fork');
UR_Fork('graph', child, child, {});

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
