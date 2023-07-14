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
StartAppServer();
const peggy = fork('./_ur/modules/parse/_parse');

/// WATCH FOR CHANGES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const watcher = chockidar.watch('./app-*');
watcher.on('change', path => {
  ExecPeg();
});
