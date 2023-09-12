var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// _ur/common/declare-console.js
var require_declare_console = __commonJS({
  "_ur/common/declare-console.js"(exports, module2) {
    var TERM_COLORS = {
      // TOUT = makeTerminalOut(str); TOUT('hi')
      Reset: "\x1B[0m",
      Bright: "\x1B[1m",
      Dim: "\x1B[2m",
      Underscore: "\x1B[4m",
      Blink: "\x1B[5m",
      Reverse: "\x1B[7m",
      Hidden: "\x1B[8m",
      //
      Black: "\x1B[30m",
      White: "\x1B[37m",
      Red: "\x1B[31m",
      Yellow: "\x1B[33m",
      Green: "\x1B[32m",
      Cyan: "\x1B[36m",
      Blue: "\x1B[34m",
      Magenta: "\x1B[35m",
      //
      BgBlack: "\x1B[40m",
      BgRed: "\x1B[41m",
      BgYellow: "\x1B[43m",
      BgCyan: "\x1B[46m",
      BgGreen: "\x1B[42m",
      BgBlue: "\x1B[44m",
      BgPurple: "\x1B[45m",
      BgWhite: "\x1B[47m",
      // FORMATS
      TagYellow: "\x1B[43;30m",
      TagRed: "\x1B[41;37m",
      TagGreen: "\x1B[42;30m",
      TagCyan: "\x1B[46;37m",
      TagBlue: "\x1B[44;37m",
      TagPurple: "\x1B[45;37m",
      TagPink: "\x1B[105;1m",
      TagGray: "\x1B[100;37m",
      TagNull: "\x1B[2;37m"
    };
    var CSS_COMMON = "padding:3px 5px;border-radius:2px;";
    var CSS_COLORS = {
      Reset: "color:auto;background-color:auto",
      // COLOR FOREGROUND
      Black: "color:black",
      White: "color:white",
      Red: "color:red",
      Yellow: "color:orange",
      Green: "color:green",
      Cyan: "color:cyan",
      Blue: "color:blue",
      Magenta: "color:magenta",
      // COLOR BACKGROUND
      TagRed: `color:#000;background-color:#f66;${CSS_COMMON}`,
      TagYellow: `color:#000;background-color:#fd4;${CSS_COMMON}`,
      TagGreen: `color:#000;background-color:#5c8;${CSS_COMMON}`,
      TagCyan: `color:#000;background-color:#2dd;${CSS_COMMON}`,
      TagBlue: `color:#000;background-color:#2bf;${CSS_COMMON}`,
      TagPurple: `color:#000;background-color:#b6f;${CSS_COMMON}`,
      TagPink: `color:#000;background-color:#f9f;${CSS_COMMON}`,
      TagGray: `color:#fff;background-color:#999;${CSS_COMMON}`,
      TagNull: `color:#999;border:1px solid #ddd;${CSS_COMMON}`,
      // COLOR BACKGROUND DARK (BROWSER ONLY)
      TagDkRed: `color:white;background-color:red;${CSS_COMMON}`,
      TagDkGreen: `color:white;background-color:green;${CSS_COMMON}`,
      TagDkBlue: `color:white;background-color:blue;${CSS_COMMON}`,
      TagDkOrange: `color:white;background-color:orange;${CSS_COMMON}`
    };
    TERM_COLORS.TagSystem = TERM_COLORS.TagGray;
    TERM_COLORS.TagUR = TERM_COLORS.TagBlue;
    TERM_COLORS.TagNetwork = TERM_COLORS.TagCyan;
    TERM_COLORS.TagApp = TERM_COLORS.TagPink;
    TERM_COLORS.TagTest = TERM_COLORS.TagRed;
    TERM_COLORS.TagDebug = TERM_COLORS.TagRed;
    TERM_COLORS.TagData = TERM_COLORS.TagGreen;
    TERM_COLORS.TagInput = TERM_COLORS.TagBlue;
    CSS_COLORS.TagSystem = CSS_COLORS.TagGray;
    CSS_COLORS.TagUR = `color:CornflowerBlue;border:1px solid CornflowerBlue;${CSS_COMMON}`;
    CSS_COLORS.TagUR2 = `color:#fff;background-color:Navy;${CSS_COMMON}`;
    CSS_COLORS.TagNetwork = CSS_COLORS.TagCyan;
    CSS_COLORS.TagApp = CSS_COLORS.TagPink;
    CSS_COLORS.TagTest = CSS_COLORS.TagRed;
    CSS_COLORS.TagDebug = `color:#fff;background-color:IndianRed;${CSS_COMMON}`;
    CSS_COLORS.TagData = CSS_COLORS.TagDkOrange;
    CSS_COLORS.TagInput = CSS_COLORS.TagDkOrange;
    CSS_COLORS.TagMessage = `color:#fff;background-color:MediumSlateBlue;${CSS_COMMON}`;
    CSS_COLORS.TagPhase = `color:#fff;background-color:MediumVioletRed;${CSS_COMMON}`;
    CSS_COLORS.TagAlert = `color:#fff;background:linear-gradient(
  -45deg,
  rgb(29,161,242),
  rgb(184,107,107),
  rgb(76,158,135)
);${CSS_COMMON}`;
    CSS_COLORS.TagUR3 = `color:#fff;background:linear-gradient(
  -45deg,
  CornflowerBlue 0%,
  LightSkyBlue 25%,
  RoyalBlue 100%
);${CSS_COMMON}`;
    function m_ExtractNames(dict) {
      const tags = [];
      const ansi = [];
      Object.keys(dict).forEach((k) => {
        if (k.startsWith("Tag"))
          tags.push(k);
        else
          ansi.push(k);
      });
      return [tags, ansi];
    }
    var [SUPPORTED_TAG_NAMES, SUPPORTED_ANSI_NAMES] = m_ExtractNames(TERM_COLORS);
    module2.exports = {
      TERM_COLORS,
      CSS_COLORS,
      //
      SUPPORTED_TAG_NAMES,
      SUPPORTED_ANSI_NAMES
    };
  }
});

// _ur/common/prompts.js
var require_prompts = __commonJS({
  "_ur/common/prompts.js"(exports, module2) {
    var IS_NODE = typeof window === "undefined";
    var IS_MOBILE = !IS_NODE && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    var D_CONSOLE = require_declare_console();
    var { TERM_COLORS, CSS_COLORS } = D_CONSOLE;
    var DEFAULT_PADDING = IS_NODE ? 10 : 8;
    var DEFAULT_SPACE = IS_NODE ? " ".padStart(DEFAULT_PADDING, " ") : " ".padStart(DEFAULT_PADDING + 4, " ");
    var DEFAULT_COLOR = "TagNull";
    var HTCONSOLES = {};
    var SHOW = true;
    var PROMPT_DICT = {
      // URSYS-RELATED MODULES
      "UR": [SHOW, "TagRed"],
      // SERVERS
      "APPSRV": [SHOW, "Yellow"],
      "GEMSRV": [SHOW, "Yellow"],
      // SPECIAL
      "-": [SHOW, "TagNull"]
    };
    function padString(str, padding = DEFAULT_PADDING) {
      let len = str.length;
      const nbsp = String.fromCharCode(160);
      if (IS_NODE)
        return `${str.padEnd(padding, " ")}`;
      if (padding === 0)
        return `${str}`;
      if (len >= padding)
        str = str.substr(0, padding);
      else
        str = str.padEnd(padding, nbsp);
      return `${str}`;
    }
    function m_SetPromptColors(match, color = DEFAULT_COLOR) {
      if (typeof match !== "string")
        throw Error("match prompt must be string");
      match = match.trim();
      if (match === "")
        throw Error("match prompt cannot be empty");
      let colorTable = IS_NODE ? TERM_COLORS : CSS_COLORS;
      let validColor = false;
      validColor = colorTable[color] !== void 0;
      if (!validColor)
        colorTable = IS_NODE ? CSS_COLORS : TERM_COLORS;
      validColor = colorTable[color] !== void 0;
      if (!validColor)
        throw Error(`prompt color ${color} is not defined in either table`);
      PROMPT_DICT[match] = [true, color];
      return colorTable;
    }
    function m_GetEnvColor(prompt, tagColor) {
      const colorTable = m_SetPromptColors(prompt, tagColor);
      const [dbg_mode, defcol] = PROMPT_DICT[prompt.trim()] || [SHOW, DEFAULT_COLOR];
      const ucolor = colorTable[tagColor];
      const dcolor = colorTable[defcol];
      const color = ucolor || dcolor;
      const reset = colorTable.Reset;
      return [dbg_mode, color, reset];
    }
    function m_MakeColorArray(prompt, colorName) {
      const [dbg, color, reset] = m_GetEnvColor(prompt, colorName);
      if (!(dbg || IS_NODE))
        return [];
      return IS_NODE ? [`${color}${padString(prompt)}${reset}   `] : [`%c${padString(prompt)}%c `, color, reset];
    }
    function m_MakeColorPromptFunction(prompt, colorName, resetName = "Reset") {
      return IS_NODE ? (str, ...args) => {
        if (args === void 0)
          args = "";
        console.log(
          `${TERM_COLORS[colorName]}${padString(prompt)}${TERM_COLORS.Reset}${TERM_COLORS[resetName]}    ${str}`,
          ...args
        );
      } : (str, ...args) => {
        if (args === void 0)
          args = "";
        console.log(
          `%c${padString(prompt)}%c%c ${str}`,
          CSS_COLORS.Reset,
          CSS_COLORS[resetName],
          ...args
        );
      };
    }
    function m_GetDivText(id) {
      const el = document.getElementById(id);
      if (!el) {
        console.log(`GetDivText: element ${id} does not exist`);
        return void 0;
      }
      const text = el.textContent;
      if (text === void 0) {
        console.log(`HTMLTextOut: element ${id} does not have textContent`);
        return {};
      }
      el.style.whiteSpace = "pre";
      el.style.fontFamily = "monospace";
      return { element: el, text };
    }
    function m_HTMLTextJumpRow(row, lineBuffer, id) {
      const { element, text } = m_GetDivText(id);
      if (text === void 0)
        return lineBuffer;
      if (lineBuffer.length === 0) {
        console.log(`initializing linebuffer from element id='${id}'`);
        lineBuffer = text.split("\n");
      }
      if (row > lineBuffer.length - 1) {
        const count = row + 1 - lineBuffer.length;
        for (let i = count; i > 0; i--)
          lineBuffer.push("");
      }
      return lineBuffer;
    }
    function m_HTMLTextPrint(str = "", lineBuffer, id) {
      const { element, text } = m_GetDivText(id);
      if (!text)
        return lineBuffer;
      lineBuffer.push(str);
      element.textContent = lineBuffer.join("\n");
      return lineBuffer;
    }
    function m_HTMLTextPlot(str = "", lineBuffer, id, row = 0, col = 0) {
      const { element, text } = m_GetDivText(id);
      if (!element)
        return lineBuffer;
      if (text === void 0) {
        console.log(`HTMLTextOut: element ${id} does not have textContent`);
        return lineBuffer;
      }
      lineBuffer = m_HTMLTextJumpRow(row, lineBuffer, id);
      let line = lineBuffer[row];
      if (line === void 0) {
        console.log(`HTMLTextOut: unexpected line error for line ${row}`);
        return lineBuffer;
      }
      if (col + str.length > line.length + str.length) {
        for (let i = 0; i < col + str.length - line.length; i++)
          line += " ";
      }
      let p1 = line.substr(0, col);
      let p3 = line.substr(col + str.length, line.length - (col + str.length));
      lineBuffer[row] = `${p1}${str}${p3}`;
      element.textContent = lineBuffer.join("\n");
      return lineBuffer;
    }
    function makeStyleFormatter(prompt, tagColor) {
      if (prompt.startsWith("UR") && tagColor === void 0)
        tagColor = "TagUR";
      let outArray = m_MakeColorArray(prompt, tagColor);
      if (outArray.length === 0)
        return () => [];
      if (IS_MOBILE)
        outArray = [`${prompt}:`];
      const f = (str, ...args) => [...outArray, str, ...args];
      f._ = `
${DEFAULT_SPACE}`;
      return f;
    }
    function makeErrorFormatter(pr = "") {
      const bg = "rgba(255,0,0,1)";
      const bga = "rgba(255,0,0,0.15)";
      pr = `ERROR ${pr}`.trim();
      return (str, ...args) => [
        `%c${pr}%c${str}`,
        `color:#fff;background-color:${bg};padding:3px 7px 3px 10px;border-radius:10px 0 0 10px;`,
        `color:${bg};background-color:${bga};padding:3px 5px;`,
        ...args
      ];
    }
    function makeWarningFormatter(pr = "") {
      const bg = "rgba(255,150,0,1)";
      const bga = "rgba(255,150,0,0.15)";
      pr = `WARN ${pr}`.trim();
      return (str, ...args) => [
        `%c${pr}%c${str}`,
        `color:#fff;background-color:${bg};padding:3px 7px 3px 10px;border-radius:10px 0 0 10px;`,
        `color:${bg};background-color:${bga};padding:3px 5px;`,
        ...args
      ];
    }
    function dbgPrint(pr, bg = "MediumVioletRed") {
      return [
        `%c${pr}%c`,
        `color:#fff;background-color:${bg};padding:3px 10px;border-radius:10px;`,
        "color:auto;background-color:auto"
      ];
    }
    function colorTagString(str, tagColor) {
      return m_MakeColorArray(str, tagColor);
    }
    function makeTerminalOut3(prompt, tagColor = DEFAULT_COLOR) {
      const wrap = m_MakeColorPromptFunction(prompt, tagColor);
      wrap.warn = m_MakeColorPromptFunction(prompt, "TagGreen", "Green");
      wrap.error = m_MakeColorPromptFunction(prompt, "TagRed", "Red");
      return wrap;
    }
    function makeHTMLConsole(divId, row = 0, col = 0) {
      const ERP = makeStyleFormatter("makeHTMLConsole", "Red");
      let buffer = [];
      if (typeof divId !== "string")
        throw Error("bad id");
      if (!document.getElementById(divId)) {
        console.warn(...ERP(`id '${divId}' doesn't exist`));
        return {
          print: () => {
          },
          plot: () => {
          },
          clear: () => {
          },
          gotoRow: () => {
          }
        };
      }
      let hcon;
      if (HTCONSOLES[divId]) {
        hcon = HTCONSOLES[divId];
      } else {
        hcon = {
          buffer: [],
          plot: (str, y = row, x = col) => {
            buffer = m_HTMLTextPlot(str, buffer, divId, y, x);
          },
          print: (str) => {
            buffer = m_HTMLTextPrint(str, buffer, divId);
          },
          clear: (startRow = 0, endRow = buffer.length) => {
            buffer.splice(startRow, endRow);
          },
          gotoRow: (row2) => {
            buffer = m_HTMLTextJumpRow(row2, buffer, divId);
          }
        };
        HTCONSOLES[divId] = hcon;
      }
      return hcon;
    }
    function printTagColors() {
      const colortable = IS_NODE ? TERM_COLORS : CSS_COLORS;
      const colors = Object.keys(colortable).filter((element) => element.includes("Tag"));
      const reset = colortable.Reset;
      const out = "dbg_colors";
      if (!IS_NODE)
        console.groupCollapsed(out);
      colors.forEach((key) => {
        const color = colortable[key];
        const items = IS_NODE ? [`${padString(out)} - (node) ${color}${key}${reset}`] : [`(browser) %c${key}%c`, color, reset];
        console.log(...items);
      });
      if (!IS_NODE)
        console.groupEnd();
    }
    module2.exports = {
      TERM: TERM_COLORS,
      CSS: CSS_COLORS,
      padString,
      makeStyleFormatter,
      makeErrorFormatter,
      makeWarningFormatter,
      dbgPrint,
      makeTerminalOut: makeTerminalOut3,
      makeHTMLConsole,
      printTagColors,
      colorTagString
    };
  }
});

// _ur/common/declare-async.js
var require_declare_async = __commonJS({
  "_ur/common/declare-async.js"(exports, module2) {
    var APP_LIFECYCLE = {
      SETUP: [
        "INITIALIZE",
        // module data structure init
        "NETWORK",
        // connected to network
        "CONNECT",
        // connected as registered UR application
        "LOAD",
        // load any external data, make connections
        "CONFIG",
        // configure runtime data structures
        "ALLOCATE"
        // alloca
      ],
      RUN: [
        "READY",
        // when viewsystem has completely composed
        "START",
        // start normal execution run
        "RUN",
        // system starts running
        "UPDATE",
        // system is running (periodic call w/ time)
        "STATUS",
        // system status message
        "STOP"
        // system wants to stop current rons
      ],
      ASYNC: [
        "FREEZE",
        // system wants to pause run
        "UNFREEZE"
        // system has paused (periodic call w/ time)
      ],
      SHUTDOWN: [
        "DEALLOCATE",
        // release memory resourcesun
        "UNLOAD",
        // system releases any connecti
        "SHUTDOWN",
        // system is shutting down
        "ZOMBIE",
        // system is dead and needs to reinitialize
        "EXIT"
        // system has ended
      ],
      EXCEPTION: [
        "DISCONNECT",
        // unisys server has gone offline
        "RECONNECT",
        // unisys server has reconnected
        "NETWORK_LOST",
        // network connection lost
        "APP_HALT"
        // system and thrown an error
      ]
    };
    var UR_EVENTS = {
      // dataex module events appear in {dataex,data} message object
      DATAEX: [
        // UrModule initial handshake
        "_CONFIG_REQ",
        // Receive UrModule setup data
        "_CONFIG_ACK",
        // on configuration, return config data to UrModule instance
        // upstream module messages to downstream module
        "DATA",
        // data: chunk from upstream module
        "RESPONSE",
        // control: response from upstream module
        // downstream module messages to upstream module
        "initialize",
        // status: downstream module init
        "start",
        // status:about to start
        "run",
        // status: has started running
        "status",
        // status: periodic update
        "error",
        // status: process-terminating error, w status
        "stop",
        // status: process stoppeed
        "exit",
        // status: process terminated w/ errcode
        "result",
        // data: result of operation
        "request"
        // control: request upstream RESPONSE
      ]
    };
    module2.exports = {
      APP_LIFECYCLE,
      UR_EVENTS
    };
  }
});

// _ur/node/all-node.mts
var all_node_exports = {};
__export(all_node_exports, {
  default: () => all_node_default
});
module.exports = __toCommonJS(all_node_exports);

// _ur/node/appserver.mts
var appserver_exports = {};
__export(appserver_exports, {
  default: () => appserver_default
});
var import_chokidar = require("chokidar");
var import_express = __toESM(require("express"), 1);
var import_prompts = __toESM(require_prompts(), 1);
var TERM = (0, import_prompts.makeTerminalOut)("UR", "TagBlue");
var APP_OUT = [];
var GetAppOut = () => APP_OUT.join("\n");
var WriteAppOut = (msg) => APP_OUT.push(msg);
var ClearAppOut = () => APP_OUT = [];
function StartAppServer() {
  const app = (0, import_express.default)();
  app.get("/", (req, res) => {
    let text = GetAppOut();
    res.send(`<pre>${text}</pre>`);
  });
  const server = app.listen(3e3, () => {
    TERM("Example app listening on port 3000!");
  });
  process.on("exit", () => {
    TERM("exiting express app");
    server.close();
  });
  process.on("SIGINT", () => {
    console.log("exiting express app");
    server.close((err) => {
      if (err) {
        TERM.error(err);
        process.exit(1);
      }
      process.exit();
    });
  });
}
function Watch() {
  const watcher = (0, import_chokidar.watch)("./_ur/**");
  watcher.on("change", (path) => {
    TERM("watcher: path changed", path);
  });
}
var appserver_default = {
  StartAppServer,
  Watch,
  //
  GetAppOut,
  WriteAppOut,
  ClearAppOut
};

// _ur/node/class-urmodule.mts
var import_node_events = require("node:events");
var import_node_stream = require("node:stream");
var import_declare_async = __toESM(require_declare_async(), 1);
var import_node_child_process = require("node:child_process");
var import_prompts2 = __toESM(require_prompts(), 1);
var { URDEX } = import_declare_async.default.UR_EVENTS;
var LOG = (0, import_prompts2.makeTerminalOut)(" URMOD", "TagYellow");
var UrModule = class _UrModule {
  //
  id = void 0;
  modObj = void 0;
  // the wrapped module
  modName = "";
  // descriptive name (optional)
  modType = "";
  // modType of module object implementation
  modIn = void 0;
  // instance of UrModule
  modOut = void 0;
  // instance of UrModule
  //
  protocol = void 0;
  inputBuffer = [];
  outputBuffer = [];
  error = "";
  //
  static modtype_enum = ["null", "event", "fork", "stream", "urnet"];
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
    this.protocol = void 0;
    this.modType = _UrModule.modtype_enum[0];
    this.id = _UrModule.id_counter++;
    this.manageFork = this.manageFork.bind(this);
    const { input, output, name } = opt || {};
    if (typeof name === "string")
      this.setName(name);
    LOG(`UrModule[${u_modname(this)}] constructing`);
    if (mobj instanceof import_node_child_process.ChildProcess) {
      this.modType = "fork";
      this.modObj = mobj;
      this.manageFork();
    } else if (u_is_stream(mobj)) {
      this.modType = "stream";
    } else if (mobj.HandleMessage && mobj.Call) {
      this.modType = "urnet";
    } else if (mobj instanceof import_node_events.EventEmitter) {
      this.modType = "event";
    } else {
      this.error = "UrModule(): not an eventEmitter, process, or stream";
      console.log(this.error);
      throw new Error(this.error);
    }
    this.linkModules(input, output);
  }
  /** set the name of the module */
  setName(name) {
    if (typeof name !== "string")
      throw new Error("UrModule.setName(): name must be a string");
    this.modName = name;
  }
  /** set up the handler for a child process that is compatible with
   *  the UrModule interface.
   */
  manageFork() {
    if (this.modObj === void 0)
      throw new Error("manageFork(): modObj undefined");
    this.modObj.on("message", (msg) => {
      LOG(`[${u_modname(this)}] DATAEX:`, msg);
      const { dataex, data } = msg;
      if (dataex === "_CONFIG_ACK") {
        const { protocol } = data;
        if (typeof protocol === "string") {
          this.protocol = protocol;
          this.activateInput();
          this.activateOutput();
        }
      }
    });
    this.modObj.send({ dataex: "_CONFIG_REQ", data: {} });
  }
  /** initializes datalink for connected modules. it's called
   *  by the constructor implictly.
   */
  linkModules(modIn, modOut) {
    if (this.modIn !== void 0 || this.modOut !== void 0) {
      this.error = "UrModule.linkModules(): already linked";
      throw new Error(this.error);
    }
    if (modIn !== void 0) {
      if (modIn instanceof _UrModule) {
        this.modIn = modIn;
      } else {
        this.error = "UrModule.connect(): invalid modIn";
        throw new Error(this.error);
      }
    }
    if (modOut !== void 0) {
      if (modOut instanceof _UrModule) {
        this.modOut = modOut;
      } else {
        this.error = "UrModule.connect(): invalid modOut";
        throw new Error(this.error);
      }
    }
  }
  /** the input modules are a data source, so we expect to
   *  receive data messages as well as handshake information.
   *  Uses URDEX protocol: expects 'DATA' message
   */
  activateInput() {
    this.modIn.on("message", (msg) => {
      const { dataex, data } = msg;
      switch (dataex) {
        case "DATA":
          this.bufferInput(data);
          break;
        default:
          LOG("unhandled input dataex:", dataex);
          break;
      }
    });
    LOG("awaiting input");
  }
  /** the output modules will communicate their status back
   *  to this module, providing events to signal what's going
   *  on.
   *  Uses URDEX protocol
   */
  activateOutput() {
    LOG("connecting to output module");
    this.modOut.on("message", (msg) => {
      const { dataex, data } = msg;
      switch (dataex) {
        case "exit":
          break;
        default:
          LOG("unknown output dataex:", dataex);
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
    if (this.inputBuffer.length > _UrModule.buffer_size) {
      this.error = "overflow";
    }
  }
  /** retrieve buffered data one chunk at a time */
  getInputData() {
    if (this.inputBuffer.length === 0) {
      this.error = "underflow";
      return void 0;
    }
    this.error = "";
    return this.inputBuffer.shift();
  }
};
var u_is_stream = (obj) => obj instanceof import_node_stream.Readable || obj instanceof import_node_stream.Writable || obj instanceof import_node_stream.Duplex || obj instanceof import_node_stream.Transform;
var u_modname = (instance) => instance.modName || instance.id;
var class_urmodule_default = UrModule;

// _ur/node/all-node.mts
var all_node_default = {
  APPSERVER: appserver_exports,
  UrModule: class_urmodule_default
};
//# sourceMappingURL=ur-node.cjs.map
