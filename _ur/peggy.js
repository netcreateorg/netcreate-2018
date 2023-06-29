/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  TESTBED

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const peggy = require('peggy');
const fs = require('fs');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let grammar;
let parser;
const INPUT = `
this is test input
there are only identifiers
away
`.trim();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FILENAME = '_ur/graph-parser.peg';

/// PARSER STUFF //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ProcessGrammar(input) {
  let out;
  try {
    grammar = fs.readFileSync(FILENAME, 'utf8');
  } catch (err) {
    console.error('file error', err);
  }
  try {
    parser = peggy.generate(grammar);
    out = parser.parse(input);
  } catch (err) {
    console.error('Parser', err.toString());
    const lines = INPUT.split('\n');
    const { start } = err.location;
    const { offset, line, column } = start;
    const cursor = '^'.padStart(column - 1);
    console.log(lines[line - 1]);
    console.log(cursor, `line:${line} col:${column}`);
    process.exit();
  }
  return out;
}

/// DO THE WORK ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
console.log('processing input:\n---');
console.log(INPUT);
console.log('---');
console.log('result:', ProcessGrammar(INPUT));
