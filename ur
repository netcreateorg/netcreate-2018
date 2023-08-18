#!/usr/bin/env node
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYNK RUNNER

  URSYNK is the name of the set of communication tools Sri is making to
  support modular asynchronous communication frameworks, based on 
  previous URSYS and UNISYS versions.

  WIP

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const APPSERV = require('./_ur/_sys/appserver');
const IPC = require('./_ur/_sys/ipc');
const FILES = require('./_ur/_sys/files');
const { UR_Fork } = require('./_ur/_sys/ur-proc');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = require('./_ur/_sys/prompts').makeTerminalOut('UR', 'TagBlue');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// RUNTIME ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** TEST **/
const child = {
  on: () => {}
};
const options = {};
LOG('ur parent process started');
const proc_graph = UR_Fork('graph');
const proc_parse = UR_Fork('parse', proc_graph);
LOG('parent process ended');
