/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  TESTBED for PEGGY PARSER

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/* added for pull request #81 so 'npm run lint' test appears clean */
/* eslint-disable no-unused-vars */

import { generate } from 'peggy';
import { readFileSync } from 'node:fs';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let grammar;
let data;
let parser;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const F_GRAMMAR = './graph-parser.peg';
const F_DATA = './graph-data.txt';
const F_TEST = './graph-test.txt';
const LOG = require('../_sys/prompts').makeTerminalOut(' PEGGY', 'TagPurple');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * This function takes a multi-line string and performs the following operations:
 * - Makes sure all newline types with '\n'
 * - Removes all tab characters
 * - Processes comma and colon delimited sequences in each line:
 *   - Removes whitespace around each delimiter except when inside quotes
 *   - Collapses all internal whitespace to a single space
 *   - Ensures that there is a trailing newline
 * (written, with effort, by ChatGPT4)
 * @param {string} str - The input string to be normalized.
 * @return {string} - The normalized string.
 */
function normalizeForPEG(str) {
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

/// PARSER STUFF //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Assumes a line-based input that has been normalized to remove extraneous
 *  spaces
 */
function ProcessGrammar(input) {
  try {
    grammar = readFileSync(F_GRAMMAR, 'utf8');
  } catch (err) {
    console.error('file error', err);
  }
  let lines = input.split('\n');
  let table = [];
  let lastLine = 0;
  let out;
  try {
    parser = generate(grammar, { trace: false });
    out = parser.parse(input, {
      tracer: {
        trace: obj => {
          const { type, rule, location } = obj;
          const { line: startLine, column: startCol } = location.start;
          const { column: endCol } = location.end;

          if (lastLine !== startLine) {
            // LOG('');
            table.push({});
            lastLine = startLine;
          }
          // LOG(`rule:${rule} type:${type} L${startLine} `);
          const ch = lines[startLine - 1][startCol - 1];
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
      }
    });
  } catch (err) {
    console.table(table);
    console.error('\nParser', err.toString());
    const lines = input.split('\n');
    if (err && err.location) {
      const { start } = err.location;
      const { offset, line, column } = start;
      const cursor = '^'.padStart(column - 1);
      LOG(lines[line - 1]);
      LOG(cursor, `line:${line} col:${column}`);
    }
    process.exit();
  }
  return out;
}

/// TEST //////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestDataExchange() {
  LOG('.. reading raw input');
  data = readFileSync(F_DATA, 'utf8');
  LOG('.. normalizing input');
  data = readFileSync(F_TEST, 'utf8');
  let text = normalizeForPEG(data);
  let result = ProcessGrammar(text);
  LOG('.. parsing input');
  process.send({ dataex: 'result', format: 'doc/dexf.graph', data: result });
}

/// DATAEX CONTROL LOGIC //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** run control logic test **/
process.on('message', (controlMsg: any) => {
  const { dataex, data } = controlMsg;
  LOG('<<< received DATAEX:', controlMsg);
  if (dataex === '_CONFIG_REQ') {
    process.send({ dataex: '_CONFIG_ACK', data: { name: 'parse/@init' } });
    TestDataExchange();
  }
});
LOG('*** TODO: message dataex enabled...can we receive messages?');
