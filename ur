#!/usr/bin/env node
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYNK RUNNER

  URSYNK is the name of the set of communication tools Sri is making to
  support modular asynchronous communication frameworks, based on 
  previous URSYS and UNISYS versions.

  WIP

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const { fork } = require('child_process');
const chockidar = require('chokidar');
const express = require('express');

/// STATE /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let OUT = 'ExecPeg';
let PEGGY;

/// RUN NODE COMMAND /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ExecPeg() {
  try {
    PEGGY = fork('_ur/peggy.js');
  } catch (err) {
    console.log(err.toString());
  }
  PEGGY.on('message', msg => {
    console.log('peggy:', msg);
  });
  PEGGY.on('error', err => {
    console.error('peggy:error:', err);
  });
}

/// WEBSERVER STUFF ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function StartAppServer() {
  const app = express();
  app.get('/', (req, res) => {
    res.send(`<pre>${OUT}</pre>`);
  });
  const server = app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
  });
  // close express app on process exit
  process.on('exit', () => {
    console.log('exiting express app');
    server.close();
  });
  // close express app on ctrl-c event
  process.on('SIGINT', () => {
    console.log('exiting express app');
    server.close(err => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      process.exit();
    });
  });
}

/// FIRST RUN /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ExecPeg();
StartAppServer();

/// WATCH FOR CHANGES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const watcher = chockidar.watch('./ncgo-*');
watcher.on('change', path => {
  ExecPeg();
});
