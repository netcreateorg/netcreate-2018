/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UR IPC
  there are integer codes assigned to each of the dictionary property names,
  but in use we don't use the integer codes when hooking into lifecycle
  methods.

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

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import { makeTerminalOut } from '../common/prompts.js';
const TERM = makeTerminalOut(' URPC', 'TagGreen');
import * as UR_EVENTS from '../common/declare-async.js';

/// METHODS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  ...UR_EVENTS
};
