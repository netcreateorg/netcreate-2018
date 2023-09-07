/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ANSI TERMINAL color codes and utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const IS_NODE = typeof window === 'undefined';
const IS_MOBILE =
  !IS_NODE &&
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
const D_CONSOLE = require('./declare-console.js');
const { TERM_COLORS, CSS_COLORS } = D_CONSOLE;

const DEFAULT_PADDING = IS_NODE
  ? 10 // nodejs
  : 8; // not nodejs
const DEFAULT_SPACE = IS_NODE
  ? ' '.padStart(DEFAULT_PADDING, ' ')
  : ' '.padStart(DEFAULT_PADDING + 4, ' ');

const DEFAULT_COLOR = 'TagNull';

// div console
const HTCONSOLES = {};

/// OUTPUT CONTROL ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** define
 */
const SHOW = true;
const HIDE = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPT_DICT = {
  // URSYS-RELATED MODULES
  'UR': [SHOW, 'TagRed'],
  // SERVERS
  'APPSRV': [SHOW, 'Yellow'],
  'GEMSRV': [SHOW, 'Yellow'],
  // SPECIAL
  '-': [SHOW, 'TagNull']
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Pad string to fixed length, with default padding depending on
 *  whether the environment is node or browser
 */
function padString(str, padding = DEFAULT_PADDING) {
  let len = str.length;
  const nbsp = String.fromCharCode(0x00a0); // unicode non-break space
  if (IS_NODE) return `${str.padEnd(padding, ' ')}`;
  // must be non-node environment, so do dynamic string adjust
  if (padding === 0) return `${str}`;
  // if this far, then we're truncating
  if (len >= padding) str = str.substr(0, padding);
  else str = str.padEnd(padding, nbsp);
  return `${str}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** add a color to the PROMPT_DICT for a particular PREFIX */
function m_SetPromptColors(match, color = DEFAULT_COLOR) {
  if (typeof match !== 'string') throw Error('match prompt must be string');
  match = match.trim();
  if (match === '') throw Error('match prompt cannot be empty');
  let colorTable = IS_NODE ? TERM_COLORS : CSS_COLORS;
  let validColor = false;
  validColor = colorTable[color] !== undefined;
  if (!validColor) colorTable = IS_NODE ? CSS_COLORS : TERM_COLORS;
  validColor = colorTable[color] !== undefined;
  if (!validColor)
    throw Error(`prompt color ${color} is not defined in either table`);
  // turn on color prompt
  PROMPT_DICT[match] = [true, color];
  return colorTable;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Based on current detected enviroment, return either ANSI terminal or
 *  css based color markers for use in debugging messages. If tagColor is
 *  defined and corresponds to color definition, it is used to set the color.
 *  This is so users can set their own color prompts without editing
 *  PROMPTS_DICT structure.
 */
function m_GetEnvColor(prompt, tagColor) {
  const colorTable = m_SetPromptColors(prompt, tagColor);
  const [dbg_mode, defcol] = PROMPT_DICT[prompt.trim()] || [SHOW, DEFAULT_COLOR];
  const ucolor = colorTable[tagColor];
  const dcolor = colorTable[defcol];
  const color = ucolor || dcolor;
  const reset = colorTable.Reset;
  return [dbg_mode, color, reset];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns an array suitable for destructuring inside console.log() in
 *  either Node or the browser with color
 */
function m_MakeColorArray(prompt, colorName) {
  const [dbg, color, reset] = m_GetEnvColor(prompt, colorName);
  // return empty array if debugging disabled in browser
  // or debugging is enabled but it's node (de morgan's law)
  if (!(dbg || IS_NODE)) return [];
  return IS_NODE
    ? [`${color}${padString(prompt)}${reset}   `] // server
    : [`%c${padString(prompt)}%c `, color, reset]; // browser
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns an environment-specific color wrapper function suitable for use
 *  in debug output
 */
function m_MakeColorPromptFunction(prompt, colorName, resetName = 'Reset') {
  return IS_NODE
    ? (str, ...args) => {
        if (args === undefined) args = '';
        console.log(
          `${TERM_COLORS[colorName]}${padString(prompt)}${TERM_COLORS.Reset}${
            TERM_COLORS[resetName]
          }    ${str}`,
          ...args
        );
      }
    : (str, ...args) => {
        if (args === undefined) args = '';
        console.log(
          `%c${padString(prompt)}%c%c ${str}`,
          CSS_COLORS.Reset,
          CSS_COLORS[resetName],
          ...args
        );
      };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetDivText(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.log(`GetDivText: element ${id} does not exist`);
    return undefined;
  }
  const text = el.textContent;
  if (text === undefined) {
    console.log(`HTMLTextOut: element ${id} does not have textContent`);
    return {};
  }
  el.style.whiteSpace = 'pre';
  el.style.fontFamily = 'monospace';
  return { element: el, text };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_HTMLTextJumpRow(row, lineBuffer, id) {
  const { element, text } = m_GetDivText(id);
  if (text === undefined) return lineBuffer;
  // convert content to line buffer
  if (lineBuffer.length === 0) {
    console.log(`initializing linebuffer from element id='${id}'`);
    lineBuffer = text.split('\n'); // creates a NEW array
  }
  // handle line underflow in buffer if row exceeds line buffer
  if (row > lineBuffer.length - 1) {
    const count = row + 1 - lineBuffer.length;
    for (let i = count; i > 0; i--) lineBuffer.push('');
  }
  return lineBuffer;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_HTMLTextPrint(str = '', lineBuffer, id) {
  const { element, text } = m_GetDivText(id);
  if (!text) return lineBuffer;
  // append text
  lineBuffer.push(str);
  element.textContent = lineBuffer.join('\n');
  return lineBuffer;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Function to modify the text area of a passed HTML element. Always return
 *  lineBuffer so we can reassign the reference, as the array often changes.
 */
function m_HTMLTextPlot(str = '', lineBuffer, id, row = 0, col = 0) {
  const { element, text } = m_GetDivText(id);
  if (!element) return lineBuffer;
  if (text === undefined) {
    console.log(`HTMLTextOut: element ${id} does not have textContent`);
    return lineBuffer;
  }
  // ensure row exists
  lineBuffer = m_HTMLTextJumpRow(row, lineBuffer, id);
  // fetch line
  let line = lineBuffer[row];
  if (line === undefined) {
    console.log(`HTMLTextOut: unexpected line error for line ${row}`);
    return lineBuffer;
  }
  // handle column underflow in line if col exceeds line length
  if (col + str.length > line.length + str.length) {
    for (let i = 0; i < col + str.length - line.length; i++) line += ' ';
  }
  // insert str into line
  let p1 = line.substr(0, col);
  let p3 = line.substr(col + str.length, line.length - (col + str.length));
  lineBuffer[row] = `${p1}${str}${p3}`;
  // write buffer back out
  element.textContent = lineBuffer.join('\n');
  return lineBuffer;
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return a function that will prompt strings for you. The function will
 *  returns an array to destructure into console.log(). This is supported
 *  in Chrome and Safari (somewhat), but not in Firefox as of last testing.
 *
 *  To create the function, provide a short PROMPT. This will be color coded
 *  according to the PROMPTS_DICT table, or gray otherwise. You can turn off the
 *  debug output for all PROMPTS in a category also for centralized debug
 *  statement control.
 *
 *  The prompt function accepts a string followed by any number of parameters.
 *  It returns an array of values that are destructured inside of console.log()
 *    const promptFunction = makeLoginHelper('APP');
 *    console.log(...promptFunction('huzzah'));
 *
 *  NOTE: This doesn't work as expected on NodeJS, because empty arrays
 *  render as linefeeds so we just output it regardless. If you want to
 *  disable output, use the makeTerminalOut() function instead.
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** allow modification of the PROMPT_DICT
 */
function makeStyleFormatter(prompt, tagColor) {
  if (prompt.startsWith('UR') && tagColor === undefined) tagColor = 'TagUR';
  let outArray = m_MakeColorArray(prompt, tagColor);
  if (outArray.length === 0) return () => [];
  if (IS_MOBILE) outArray = [`${prompt}:`];
  const f = (str, ...args) => [...outArray, str, ...args];
  f._ = `\n${DEFAULT_SPACE}`;
  return f;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return an array that can be spread like console.log(...arr) */
function makeErrorFormatter(pr = '') {
  const bg = 'rgba(255,0,0,1)';
  const bga = 'rgba(255,0,0,0.15)';
  pr = `ERROR ${pr}`.trim();
  return (str, ...args) => [
    `%c${pr}%c${str}`,
    `color:#fff;background-color:${bg};padding:3px 7px 3px 10px;border-radius:10px 0 0 10px;`,
    `color:${bg};background-color:${bga};padding:3px 5px;`,
    ...args
  ];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return an array that can be spread like console.log(...arr) */
function makeWarningFormatter(pr = '') {
  const bg = 'rgba(255,150,0,1)';
  const bga = 'rgba(255,150,0,0.15)';
  pr = `WARN ${pr}`.trim();
  return (str, ...args) => [
    `%c${pr}%c${str}`,
    `color:#fff;background-color:${bg};padding:3px 7px 3px 10px;border-radius:10px 0 0 10px;`,
    `color:${bg};background-color:${bga};padding:3px 5px;`,
    ...args
  ];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** use like console.log(...debugFormatter('prompt'), 'la la la'); */
function dbgPrint(pr, bg = 'MediumVioletRed') {
  return [
    `%c${pr}%c`,
    `color:#fff;background-color:${bg};padding:3px 10px;border-radius:10px;`,
    'color:auto;background-color:auto'
  ];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function colorTagString(str, tagColor) {
  return m_MakeColorArray(str, tagColor);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return function to directly print to console instead of returning an array.
 *  This works better for NodeJS since the empty [] still results in output
 *  unlike the browser. Use makeStyleFormatter for browsers
 */
function makeTerminalOut(prompt, tagColor = DEFAULT_COLOR) {
  const wrap = m_MakeColorPromptFunction(prompt, tagColor);
  wrap.warn = m_MakeColorPromptFunction(prompt, 'TagGreen', 'Green');
  wrap.error = m_MakeColorPromptFunction(prompt, 'TagRed', 'Red');
  return wrap;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return function to print a string, given a DIV id and optional row/column.
 */
function makeHTMLConsole(divId, row = 0, col = 0) {
  const ERP = makeStyleFormatter('makeHTMLConsole', 'Red');
  let buffer = [];
  if (typeof divId !== 'string') throw Error('bad id');
  if (!document.getElementById(divId)) {
    console.warn(...ERP(`id '${divId}' doesn't exist`));
    return {
      print: () => {},
      plot: () => {},
      clear: () => {},
      gotoRow: () => {}
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
      print: str => {
        buffer = m_HTMLTextPrint(str, buffer, divId);
      },
      clear: (startRow = 0, endRow = buffer.length) => {
        buffer.splice(startRow, endRow);
      },
      gotoRow: row => {
        buffer = m_HTMLTextJumpRow(row, buffer, divId);
      }
    };
    HTCONSOLES[divId] = hcon;
  }
  return hcon;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Print all Tag Colors
 */
function printTagColors() {
  const colortable = IS_NODE ? TERM_COLORS : CSS_COLORS;
  const colors = Object.keys(colortable).filter(element => element.includes('Tag'));
  const reset = colortable.Reset;
  const out = 'dbg_colors';
  if (!IS_NODE) console.groupCollapsed(out);
  colors.forEach(key => {
    const color = colortable[key];
    const items = IS_NODE
      ? [`${padString(out)} - (node) ${color}${key}${reset}`]
      : [`(browser) %c${key}%c`, color, reset];
    console.log(...items);
  });
  if (!IS_NODE) console.groupEnd();
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  TERM: TERM_COLORS,
  CSS: CSS_COLORS,
  padString,
  makeStyleFormatter,
  makeErrorFormatter,
  makeWarningFormatter,
  dbgPrint,
  makeTerminalOut,
  makeHTMLConsole,
  printTagColors,
  colorTagString
};
