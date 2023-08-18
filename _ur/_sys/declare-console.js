/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  description

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// list of color formats ('tags') to support for both browser and ansi terms
const COMMON_FORMATS = [
  'TagYellow',
  'TagRed',
  'TagGreen',
  'TagCyan',
  'TagBlue',
  'TagPurple',
  'TagPink',
  'TagGray',
  'TagNull'
];

/// TERMINAL COLORS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM_COLORS = {
  // TOUT = makeTerminalOut(str); TOUT('hi')
  Reset: '\x1b[0m',
  Bright: '\x1b[1m',
  Dim: '\x1b[2m',
  Underscore: '\x1b[4m',
  Blink: '\x1b[5m',
  Reverse: '\x1b[7m',
  Hidden: '\x1b[8m',
  //
  Black: '\x1b[30m',
  White: '\x1b[37m',
  Red: '\x1b[31m',
  Yellow: '\x1b[33m',
  Green: '\x1b[32m',
  Cyan: '\x1b[36m',
  Blue: '\x1b[34m',
  Magenta: '\x1b[35m',
  //
  BgBlack: '\x1b[40m',
  BgRed: '\x1b[41m',
  BgYellow: '\x1b[43m',
  BgCyan: '\x1b[46m',
  BgGreen: '\x1b[42m',
  BgBlue: '\x1b[44m',
  BgPurple: '\x1b[45m',
  BgWhite: '\x1b[47m',

  // FORMATS
  TagYellow: '\x1b[43;30m',
  TagRed: '\x1b[41;37m',
  TagGreen: '\x1b[42;30m',
  TagCyan: '\x1b[46;37m',
  TagBlue: '\x1b[44;37m',
  TagPurple: '\x1b[45;37m',
  TagPink: '\x1b[105;1m',
  TagGray: '\x1b[100;37m',
  TagNull: '\x1b[2;37m'
};

/// CONSOLE CSS COLORS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const CSS_COMMON = 'padding:3px 5px;border-radius:2px;';
const CSS_COLORS = {
  Reset: 'color:auto;background-color:auto',
  // COLOR FOREGROUND
  Black: 'color:black',
  White: 'color:white',
  Red: 'color:red',
  Yellow: 'color:orange',
  Green: 'color:green',
  Cyan: 'color:cyan',
  Blue: 'color:blue',
  Magenta: 'color:magenta',
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
// CSS_COLORS.TagUR = `color:#fff;background-color:CornflowerBlue;${CSS_COMMON}`;
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

/// DERIVED DATA //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_ExtractNames(dict) {
  const tags = [];
  const ansi = [];
  Object.keys(dict).forEach(k => {
    if (k.startsWith('Tag')) tags.push(k);
    else ansi.push(k);
  });
  return [tags, ansi];
}
const [SUPPORTED_TAG_NAMES, SUPPORTED_ANSI_NAMES] = m_ExtractNames(TERM_COLORS);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  TERM_COLORS,
  CSS_COLORS,
  //
  SUPPORTED_TAG_NAMES,
  SUPPORTED_ANSI_NAMES
};
