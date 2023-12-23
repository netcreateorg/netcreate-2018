/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  placeholder appserver library

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { watch } from 'chokidar';
import express from 'express';
import { makeTerminalOut } from '../common/prompts.js';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = makeTerminalOut('UR', 'TagBlue');

/// WEBSERVER STUFF ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let APP_OUT = [];
const GetAppOut = () => APP_OUT.join('\n');
const WriteAppOut = msg => APP_OUT.push(msg);
const ClearAppOut = () => (APP_OUT = []);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function StartAppServer() {
  const app = express();
  app.get('/', (req, res) => {
    let text = GetAppOut();
    res.send(`<pre>${text}</pre>`);
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Watch() {
  /** watch for changes to path **/
  const watcher = watch('./_ur/**');
  watcher.on('change', path => {
    TERM('watcher: path changed', path);
    // proc_peggy.send('test');
  });
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export {
  StartAppServer,
  Watch,
  //
  GetAppOut,
  WriteAppOut,
  ClearAppOut
};
