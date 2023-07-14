/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  TESTBED

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const peggy = require('peggy');
const fs = require('fs');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let grammar;
let data;
let parser;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const F_GRAMMAR = '_ur/modules/parse/graph-parser.peg';
const F_DATA = '_ur/modules/parse/graph-data.txt';
const F_TEST = '_ur/modules/parse/graph-test.txt';
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
    lines[i] = processDelimited(lines[i], ',', { preserve: true });
    lines[i] = processDelimited(lines[i], ':', { preserve: true });
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
    grammar = fs.readFileSync(F_GRAMMAR, 'utf8');
  } catch (err) {
    console.error('file error', err);
  }
  let lines = input.split('\n');
  let table = [];
  let lastLine = 0;
  try {
    parser = peggy.generate(grammar, { trace: false });
    out = parser.parse(input, {
      tracer: {
        trace: obj => {
          const { type, rule, location } = obj;
          const { line: startLine, column: startCol } = location.start;
          const { column: endCol } = location.end;

          if (lastLine !== startLine) {
            // console.log('');
            table.push({});
            lastLine = startLine;
          }
          // console.log(`rule:${rule} type:${type} L${startLine} `);
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
      console.log(lines[line - 1]);
      console.log(cursor, `line:${line} col:${column}`);
    }
    process.exit();
  }
  return out;
}

/// DO THE WORK ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
console.log('\nRaw Input:\n---');
data = fs.readFileSync(F_DATA, 'utf8');
console.log(data);
console.log('\nNormalized Input:\n---');
// data = fs.readFileSync(F_TEST, 'utf8');
let text = normalizeForPEG(data);
console.log(text);
console.log('---');
console.log('result:', ProcessGrammar(text));
