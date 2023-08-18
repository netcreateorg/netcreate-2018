/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  All declare modules are dependency-free so can be imported by anyone

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const { EventEmitter } = require('node:events');
const { DATAEX } = require('./declare-async').UR_EVENTS;
const { UR_Fork } = require('./ur-proc');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const LOG = require('./prompts').makeTerminalOut(' URMOD', 'TagYellow');
const DBG = true;

/// CLASS UR MODULE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** standardized interface for modules that are capable of
 *  chaining stream-style operations as well as providing an API interface
 */
class UrModule {
  modIn = undefined; // instance of UrModule
  modOut = undefined; // instance of UrModule
  type = '';
  inputBuffer = [];
  outputBuffer = [];
  buffSize = 100;
  type_enum = ['event', 'fork', 'stream'];
  error = '';

  /** constructor
   *  @param {object} obj an eventEmitter, process, or stream
   *  @param {object} modIn instance of UrModule
   *  @param {object} modOut instance of UrModule
   */
  constructor(obj, modIn, modOut) {
    if (obj instanceof EventEmitter) {
      this.type = 'event';
    } else if (obj.send && obj.on) {
      this.type = 'fork';
    } else if (obj.write && obj.on) {
      this.type = 'stream';
    } else {
      this.error = 'UrModule(): not an eventEmitter, process, or stream';
      throw new Error(this.error);
    }
    this.connect(modIn, modOut);
  }

  /** initializes datalink for connected modules */
  connect(modIn, modOut) {
    if (modIn !== undefined && modIn instanceof UrModule) {
      this.modIn = modIn;
      this.activateInput();
    } else {
      this.error = 'UrModule.connect(): invalid modIn';
      throw new Error(this.error);
    }
    if (modOut !== undefined && modOut instanceof UrModule) {
      this.modOut = modOut;
      this.activateOutput();
    } else {
      this.error = 'UrModule.connect(): invalid modOut';
      throw new Error(this.error);
    }
  }

  /** the input modules are a data source, so we expect to
   *  receive data messages as well as handshake information.
   *  Uses DATAEX protocol: expects 'DATA' message
   */
  activateInput() {
    this.modIn.on('message', msg => {
      const { dataex, data } = msg;
      // handler of data and control messages from upstream module
      switch (dataex) {
        case 'DATA':
          this.bufferInput(data);
          break;
        default:
          LOG('unhandled input dataex:', dataex);
          break;
      }
    });
    LOG('awaiting input');
  }

  /** the output modules will communicate their status back
   *  to this module, providing events to signal what's going
   *  on.
   *  Uses DATAEX protocol
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

  bufferInput(data = {}) {
    this.inputBuffer.push(data);
    if (this.inputBuffer.length > this.buffSize) {
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
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UrModule;
