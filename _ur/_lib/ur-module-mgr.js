/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  All declare modules are dependency-free so can be imported by anyone

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const { EventEmitter } = require('node:events');
const { UR_EVENTS } = require('./declare-async');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const EVENTS = UR_EVENTS.DATAEX;
const LOG = require('./prompts').makeTerminalOut(' URMOD', 'TagYellow');
const DBG = true;

/// CLASS UR MODULE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** standardized interface for modules that are capable of
 *  chaining stream-style operations as well as providing an API interface
 */
class UrModule {
  modIn = undefined;
  modOut = undefined;
  inputBuffer = [];
  outputBuffer = [];
  MAX_BUFFER = 100;
  error = '';

  constructor(modIn, modOut) {
    this.modIn = modIn;
    this.modOut = modOut;

    this.connectToInput();
    this.activateOutput();
  }

  bufferInput(data = {}) {
    this.inputBuffer.push(data);
    if (this.inputBuffer.length > this.MAX_BUFFER) {
      error = 'overflow';
    }
  }

  getInputData() {
    if (this.inputBuffer.length === 0) {
      error = 'underflow';
      return undefined;
    }
    error = '';
    return this.inputBuffer.shift();
  }

  /** the input modules are a data source, so we expect to
   *  receive data messages as well as handshake information
   */
  activateInput() {
    LOG('connecting to input module');
    this.modIn.on('message', msg => {
      const { dataex, data } = msg;

      // handler of data and control messages from upstream module
      switch (dataex) {
        case 'data':
          this.bufferInput(data);
          break;
        case 'exit':
          break;
        default:
          LOG('unknown input dataex:', dataex);
          break;
      }
    });
  }

  /** the output modules will communicate their status back
   *  to this module, providing events to signal what's going
   *  on. Unlike input modules, we don't expect data to be
   *  returned to us.
   */
  activateOutput() {
    LOG('connecting to output module');

    // handler of control messages from downstream module
    // note difference between stream and child process events
    // child uses 'message'
    this.modOut.on('message', msg => {
      const { dataex, data } = msg;
      switch (dataex) {
        case 'exit':
          break;
        default:
          LOG('unknown output dataex:', dataex);
          break;
      }
    });
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UrModule;
