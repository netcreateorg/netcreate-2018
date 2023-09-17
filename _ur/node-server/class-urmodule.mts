/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  All declare modules are dependency-free so can be imported by anyone

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { EventEmitter } from 'node:events';
import { Readable, Writable, Duplex, Transform } from 'node:stream';
import D_ASYNC from '../common/declare-async.js';
const { URDEX } = D_ASYNC.UR_EVENTS;
import { ChildProcess } from 'node:child_process';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import { makeTerminalOut } from '../common/prompts.js';
const LOG = makeTerminalOut(' URMOD', 'TagYellow');
const DBG = true;

/// CLASS UR MODULE ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** standardized interface for modules that are capable of
 *  chaining stream-style operations as well as providing an API interface
 */
class UrModule {
  //
  id = undefined;
  modObj = undefined; // the wrapped module
  modName = ''; // descriptive name (optional)
  modType = ''; // modType of module object implementation
  modIn = undefined; // instance of UrModule
  modOut = undefined; // instance of UrModule
  //
  protocol = undefined;
  inputBuffer = [];
  outputBuffer = [];
  error = '';
  //
  static modtype_enum = ['null', 'event', 'fork', 'stream', 'urnet'];
  static buffer_size = 100;
  static id_counter = 100;

  /** constructor
   *  this class wraps the provided object with a standardized interface,
   *  supporting the types defined in this.modtype_enum. It performs a runtime
   *  check to determine the modType of the provided object.
   *  @param {object} obj an eventEmitter, process, or stream
   *  @param {object} modIn instance of UrModule
   *  @param {object} modOut instance of UrModule
   */
  constructor(mobj, opt) {
    this.protocol = undefined;
    this.modType = UrModule.modtype_enum[0];
    this.id = UrModule.id_counter++;
    this.manageFork = this.manageFork.bind(this);
    const { input, output, name } = opt || {};
    if (typeof name === 'string') this.setName(name);
    //
    LOG(`UrModule '${u_modname(this)}' constructing`);
    //
    if (mobj instanceof ChildProcess) {
      this.modType = 'fork';
      this.modObj = mobj;
      this.manageFork();
    } else if (u_is_stream(mobj)) {
      // placeholder test for stream
      this.modType = 'stream';
    } else if (mobj.HandleMessage && mobj.Call) {
      // placeholder test for ur messager
      this.modType = 'urnet';
    } else if (mobj instanceof EventEmitter) {
      // placeholder test for eventEmitters
      this.modType = 'event';
    } else {
      this.error = 'UrModule(): not an eventEmitter, process, or stream';
      console.log(this.error);
      throw new Error(this.error);
    }
    LOG('linking');
    this.linkModules(input, output);
    LOG('*** TODO *** process running goes here');
  }

  /** set the name of the module */
  setName(name) {
    if (typeof name !== 'string')
      throw new Error('UrModule.setName(): name must be a string');
    this.modName = name;
  }

  /** set up the handler for a child process that is compatible with
   *  the UrModule interface.
   */
  manageFork() {
    if (this.modObj === undefined) throw new Error('manageFork(): modObj undefined');
    // (1) set up message handler
    this.modObj.on('message', msg => {
      LOG(`[${u_modname(this)}] DATAEX:`, msg);

      const { dataex, data } = msg;
      if (dataex === '_CONFIG_ACK') {
        const { protocol } = data;
        if (typeof protocol === 'string') {
          this.protocol = protocol;
          // activate connections set on startup
          this.activateInput();
          this.activateOutput();
        }
      }
    });
    // initiate configuration
    this.modObj.send({ dataex: '_CONFIG_REQ', data: {} });
  }

  /** initializes datalink for connected modules. it's called
   *  by the constructor implictly.
   */
  linkModules(modIn, modOut) {
    if (this.modIn !== undefined || this.modOut !== undefined) {
      this.error = 'UrModule.linkModules(): already linked';
      throw new Error(this.error);
    }
    if (modIn !== undefined) {
      if (modIn instanceof UrModule) {
        this.modIn = modIn;
      } else {
        this.error = 'UrModule.connect(): invalid modIn';
        throw new Error(this.error);
      }
    }
    if (modOut !== undefined) {
      if (modOut instanceof UrModule) {
        this.modOut = modOut;
      } else {
        this.error = 'UrModule.connect(): invalid modOut';
        throw new Error(this.error);
      }
    }
  }

  /** the input modules are a data source, so we expect to
   *  receive data messages as well as handshake information.
   *  Uses URDEX protocol: expects 'DATA' message
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
   *  Uses URDEX protocol
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

  /** URDEX PROTOCOL *********************************************************/

  /** used to buffer input data as it is received, but not processed. Each
   *  chunk of data is of whatever modType is to be expected from the upstream
   *  module.
   *  @param {object} data the data to be buffered
   */
  bufferInput(data = {}) {
    this.inputBuffer.push(data);
    if (this.inputBuffer.length > UrModule.buffer_size) {
      this.error = 'overflow';
    }
  }
  /** retrieve buffered data one chunk at a time */
  getInputData() {
    if (this.inputBuffer.length === 0) {
      this.error = 'underflow';
      return undefined;
    }
    this.error = '';
    return this.inputBuffer.shift();
  }
}

/// UTILITY FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const u_is_stream = obj =>
  obj instanceof Readable ||
  obj instanceof Writable ||
  obj instanceof Duplex ||
  obj instanceof Transform;

const u_modname = instance => instance.modName || instance.id;

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default UrModule;
