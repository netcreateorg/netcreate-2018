#!/usr/bin/env node
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYNK RUNNER

  URSYNK is the name of the set of communication tools Sri is making to
  support modular asynchronous communication frameworks, based on 
  previous URSYS and UNISYS versions.

  WIP

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const chockidar = require('chokidar');
const express = require('express');
const { fork } = require('child_process');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = require('./_ur/_util/prompts').makeTerminalOut('UR', 'TagBlue');
const DB = require('./_ur/sqlite/@test');
const DBG = false;

/// WEBSERVER STUFF ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function StartAppServer() {
  const app = express();
  app.get('/', (req, res) => {
    res.send(`<pre>${OUT}</pre>`);
  });
  const server = app.listen(3000, () => {
    TERM('Example app listening on port 3000!');
  });
  // close express app on process exit
  process.on('exit', () => {
    TERM('exiting express app');
    server.close();
  });
  // close express app on ctrl-c event
  process.on('SIGINT', () => {
    console.log('exiting express app');
    server.close(err => {
      if (err) {
        TERM.error(err);
        process.exit(1);
      }
      process.exit();
    });
  });
}

/// FIRST RUN /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// StartAppServer();
// const peggy = fork('@init', { cwd: './_ur/parse/' });
const FM = require('./_ur/_util/files');
(async () => {
  const files = await FM.Files(__dirname);
  if (files.length && files.length > 0) TERM('FM.Files: success');
  else TERM('FM.Files: fail');
  const watcher = chockidar.watch('./app-*');
  watcher.on('change', path => {
    ExecPeg();
  });
})();
// console.log(JSON.stringify(files));

/// WATCH FOR CHANGES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
