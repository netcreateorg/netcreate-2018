/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PARSER

  parser loads the parser.peg which knows how to parse my test text.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { readFileSync } from 'node:fs';
const { generate } = require('peggy'); // CJS library on node can do this

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let GRAMMAR_SRC; // the .peg input grammar (text)
let PARSER; // the parser using GRAMMAR_SRC created by PEGGY
let INPUT; // the text to parse with PARSER
let LINES; //
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This function takes a multi-line string and performs the following operations:
 *  - Makes sure all newline types with '\n'
 *  - Removes all tab characters
 *  - Processes comma and colon delimited sequences in each line:
 *  - Removes whitespace around each delimiter except when inside quotes
 *  - Collapses all internal whitespace to a single space
 *  - Ensures that there is a trailing newline
 *  (written, with effort, by ChatGPT4)
 *  @param {string} str - The input string to be normalized.
 *  @return {string} - The normalized string.
 */
function m_Normalize(str) {
  let normalizedStr = str.replace(/\r\n|\r/g, '\n'); // conform newlines
  normalizedStr = normalizedStr // remove trailing/preserve leading whitespace
    .split('\n')
    .map(line => line.replace(/\s+$/, '')) // remove trailing
    .map(line => line.replace(/^\s+/, '')) // remove leading
    .join('\n');
  normalizedStr = normalizedStr.replace(/\t/g, '  '); // replace tabs with 2 spaces
  let lines = normalizedStr.split('\n'); // split string into lines
  /** process whitespace around delimiters */
  const processDelimited = (line, delimiter) => {
    let parts = line.split(delimiter); // split lines based on delimiter
    for (let i = 0; i < parts.length; i++) {
      parts[i] = parts[i].trim();
      parts[i] = parts[i].replace(/\s+/g, ' ');
    }
    return parts.join(delimiter);
  };
  for (let i = 0; i < lines.length; i++) {
    lines[i] = processDelimited(lines[i], ',');
    lines[i] = processDelimited(lines[i], ':');
  }
  normalizedStr = lines.join('\n').trim();
  return normalizedStr + '\n';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function f_Trace(obj, table) {
  const { type, rule, location } = obj;
  const { line: startLine, column: startCol } = location.start;
  const { column: endCol } = location.end;
  let lastLine;
  if (lastLine !== startLine) {
    // console.log('');
    table.push({});
    lastLine = startLine;
  }
  // console.log(`rule:${rule} type:${type} L${startLine} `);
  const ch = LINES[startLine - 1][startCol - 1];
  const dbg = {
    match: '',
    pos: `${startLine}:${startCol}`,
    rule,
    type,
    char: ch
  };
  if (type === 'rule.match') dbg.match = '***';
  table.push(dbg);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function f_TraceOut(table, err) {
  console.table(table);
  console.error('\nParser', err.toString());
  if (err && err.location) {
    const { start } = err.location;
    const { line, column } = start;
    const cursor = '^'.padStart(column - 1);
    console.log(LINES[line - 1]);
    console.log(cursor, `line:${line} col:${column}`);
  }
}

/// PARSER STUFF //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function InitializeParser() {
  try {
    GRAMMAR_SRC = readFileSync('parser.peg', 'utf8');
    PARSER = generate(GRAMMAR_SRC, { trace: false });
  } catch (err) {
    console.error('file error', err);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Parse(input) {
  INPUT = input;
  LINES = INPUT.split('\n');
  let out;
  let table = [];
  try {
    out = PARSER.parse(INPUT, {
      tracer: {
        trace: obj => f_Trace(obj, table)
      }
    });
  } catch (err) {
    f_TraceOut(table, err);
  }
  return out;
}

/// TEST //////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Test() {
  if (PARSER === undefined) InitializeParser();
  console.log('\nRaw Input:\n---');
  let text = readFileSync('parser-test.txt', 'utf8');
  console.log(text);
  console.log('\nNormalized Input:\n---');
  text = m_Normalize(text);
  console.log(text);
  console.log('---');
  console.log('result:', Parse(text));
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  InitializeParser,
  Parse,
  Test
};
