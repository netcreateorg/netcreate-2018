/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GRAPHDATA

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { stdin: input, stdout: output } = require('node:process');
const readline = require('node:readline');
const fs = require('node:fs');
//
const Graph = require('graphology');
const Peggy = require('peggy');
const { PreprocessDataText } = require('../_lib/text');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = require('../_lib/prompts').makeTerminalOut(' DATA', 'TagPurple');

/// METHODS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const GRAMMAR = fs.readFileSync('parser.peg', 'utf8');
const PARSER = Peggy.generate(GRAMMAR, { trace: false });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ParseGraphData(filename) {
  let data = fs.readFileSync(filename, 'utf8');
  data = PreprocessDataText(data);
  let result = PARSER.parse(data);
  return result;
}

/// RUNTIME ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// const rl = readline.createInterface({ input, output });

const graph = new Graph({ multi: true });

let out = '';
const results = ParseGraphData('test-ncgraphdata.txt');
results.forEach(entry => {
  const { node: source, edges: targets } = entry;
  if (source) {
    out += `\nSOURCE ${source} `;
    if (!graph.hasNode(source)) graph.addNode(source, { type: 'message' });
  }
  if (targets)
    targets.forEach(target => {
      out += ` -> ${target}`;
      if (!graph.hasNode(target)) graph.addNode(target, { type: 'consumer' });
      graph.addEdge(source, target);
    });
});

// Iterating over nodes
// graph.forEachNode(node => {
//   console.log(node);
// });

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {};
