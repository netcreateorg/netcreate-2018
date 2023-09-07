/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  description

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { EXIT_CODES } = require('./declare-errors');
const { ERR_UR } = EXIT_CODES;
const PROMPTS = require('./prompts');
const { makeTerminalOut } = PROMPTS;
const ERROUT = makeTerminalOut('ERR', 'TagRed');

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DIE = (...args) => {
  Error.stackTraceLimit = 20;
  let errs = new Error(`UR Process Terminated (${ERR_UR})`).stack.split('\n');
  let myErrs = errs
    .filter(line => {
      if (line.includes('at Module.')) return false;
      if (line.includes('at require ')) return false;
      return true;
    })
    .join('\n');
  ERROUT(`\x1b[93m${args.join(' ')}\x1b[0m`);
  ERROUT(myErrs);
  process.exit(ERR_UR);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NewConsoleError = (label = '_ERR_', tagColor = 'TagRed') => {
  const fn = 'NewConsoleError';
  if (typeof label !== 'string') DIE(fn, `arg must be a string`);
  const OUT = makeTerminalOut(label, tagColor);
  return OUT;
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  DIE,
  NewConsoleError
};
