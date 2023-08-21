/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ESLINT CONFIGURATION for NETCREATE ITEST (2023)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const { RULES } = require('./.eslintrc-rules');

/// BASE CONFIGURATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const config = {
  /*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
    We want to support both node-style 'require' and es6 module 'import'.
  :*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
  env: {
    browser: true,
    es6: true,
    node: true
  },
  parserOptions: {
    'ecmaVersion': 2022,
    'sourceType': 'module'
  },
  /*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
    Plugins are packages that rules and sets of rules, but could also be
    something else (e.g. parser) that ESLINT can make use of.
    See: eslint.org/docs/user-guide/configuring#use-a-plugin
  :*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
  plugins: ['react'],
  extends: [
    'eslint:recommended', // standard recommendations
    'plugin:react/recommended', // handle jsx syntax
    'prettier' // prettier overrides
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  settings: {
    'react': {
      'version': 'detect'
    }
  },
  /*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:
    The "rules" field can override what was set in the "extends" field.
    I am turning off the rules that I find annoying or trigger false warnings
    in some code structures.
  :*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
  rules: RULES
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = config;
