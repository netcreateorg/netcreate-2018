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
const { PreprocessDataText } = require('../_sys/text');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = require('../_sys/prompts').makeTerminalOut(' GRAPH', 'TagPurple');

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
function Run() {
  const filename = 'test-ncgraphdata.txt';
  LOG(`.. loading ${filename}...`);
  const graph = new Graph({ multi: true });
  let out = '';
  const results = ParseGraphData(filename);
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
  LOG(`.. parsed ${results.length} entries from ${filename}`);
}

/// DATAEX CONTROL LOGIC //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** run control logic test **/
process.on('message', controlMsg => {
  const { dataex, data } = controlMsg;
  LOG('received DATAEX:', controlMsg);
  if (dataex === '_CONFIG_REQ') {
    process.send({ dataex: '_CONFIG_ACK', data: { name: 'graph/@init' } });
    Run();
  }
});

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {};
