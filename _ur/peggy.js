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
Fishman:    One,, two   , three
once upon a   time there: was, a kind of,     cat

    leading : spaces cant exist, what
I: "am   a cat"   ,ok

`;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FILENAME = '_ur/graph-parser.peg';

/**
 * This function takes a multi-line string and performs the following operations:
 * - Replaces all newline types with '\n'
 * - Removes trailing whitespace from each line while preserving leading whitespace
 * - Removes all tab characters
 * - Processes comma and colon delimited sequences in each line:
 *   - Removes whitespace around each delimiter except when inside quotes
 *   - Collapses all internal whitespace to a single space, while preserving leading whitespace in each part
 * (written, with effort, by ChatGPT4)
 * @param {string} str - The input string to be normalized.
 * @return {string} - The normalized string.
 */
function normalizeText(str) {
  let normalizedStr = str.replace(/\r\n|\r/g, '\n'); // conform newlines
  normalizedStr = normalizedStr // remove trailing/preserve leading whitespace
    .split('\n')
    .map(line => line.replace(/\s+$/, ''))
    .join('\n');
  normalizedStr = normalizedStr.replace(/\t/g, '  '); // replace tabs with 2 spaces
  let lines = normalizedStr.split('\n'); // split string into lines
  /** process whitespace around delimiters */
  const processDelimited = (line, delimiter) => {
    let parts = line.split(delimiter); // split lines based on delimiter
    for (let i = 0; i < parts.length; i++) {
      // Ignore the string if it's inside quotes
      if (!parts[i].startsWith('"') && !parts[i].endsWith('"')) {
        // Preserve leading spaces for the first part
        if (i !== 0) parts[i] = parts[i].trim();
        else {
          // preserve space
          let leadingSpaces = parts[i].match(/^(\s*)/)[0];
          parts[i] = leadingSpaces + parts[i].trim();
          // Collapse whitespace to a single space, ignoring leading spaces
          let trail = parts[i].slice(leadingSpaces.length);
          trail = trail.replace(/\s+/g, ' ');
          parts[i] = leadingSpaces + trail;
        }
      }
    }
    return parts.join(delimiter);
  };
  for (let i = 0; i < lines.length; i++) {
    lines[i] = processDelimited(lines[i], ',', { preserve: true });
    lines[i] = processDelimited(lines[i], ':', { preserve: true });
  }
  normalizedStr = lines.join('\n');
  return normalizedStr;
}

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
    parser = peggy.generate(grammar, { trace: false });
    out = parser.parse(input, {
      tracer: {
        trace: obj => {
          console.log(obj.rule);
        }
      }
    });
  } catch (err) {
    console.error('\nParser', err.toString());
    const lines = INPUT.split('\n');
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
console.log('processing input:\n---');
console.log(INPUT);
console.log('---');
console.log('cleaned input:\n---');
let CLEANED_INPUT = normalizeText(INPUT);
console.log(CLEANED_INPUT);
console.log('---');
console.log('result:', ProcessGrammar(CLEANED_INPUT));
