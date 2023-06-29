#!/usr/bin/env node
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYNK RUNNER

  URSYNK is the name of the set of communication tools Sri is making to
  support modular asynchronous communication frameworks, based on 
  previous URSYS and UNISYS versions.

  WIP

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const { exec } = require('child_process');
const chockidar = require('chokidar');
const express = require('express');

/// STATE /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let OUT = 'ExecPeg';

/// RUN NODE COMMAND /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ExecPeg() {
  try {
    exec('FORCE_COLOR=1 node _ur/peggy.js', (error, stdout, stderr) => {
      if (error) {
        console.error('got error', error.toString());
        process.exit();
      }
      if (stdout) {
        OUT = stdout;
        console.log(OUT);
      }
      if (stderr) {
        console.error('***', stderr);
      }
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
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
