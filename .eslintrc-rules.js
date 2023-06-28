/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  These are the specific overrides we use. It's imported in our
  .eslintrc.js file

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const LINT_LEVEL = process.env.GS_LINT_LEVEL || 1;

/// RULE OVERRIDES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const URSYS_STYLE = {
  /* ursys style overrides */
  'spaced-comment': 'off',
  'camelcase': 'off',
  'comma-dangle': ['error', 'never'],
  'no-underscore-dangle': 'off',
  'lines-between-class-members': 'off',
  'no-bitwise': 'off',
  'import/prefer-default-export': 'off',
  'object-shorthand': 'off'
};
/* allow classroom debugging by researchers */
const CLASSROOM = {
  'no-console': 'off',
  'no-debugger': 'warn',
  'no-alert': 'warn',
  'no-restricted-syntax': 'off'
};
/* turn off typescript recommendations */
const HELP_TSJS = {
  'no-undef': 'off', // TS handles this better; works with global types
  'no-unused-vars': 'off',
  'no-shadow': 'off',
  'no-param-reassign': 'off',
  'object-curly-newline': 'off',
  'react/jsx-props-no-spreading': 'off',
  'arrow-body-style': 'off',
  'no-plusplus': 'off',
  'prefer-const': 'off',
  'prefer-destructuring': 'off',
  'class-methods-use-this': 'off',
  'jsx-a11y/label-has-associated-control': 'off'
};
/* disable rules for material-ui sanity */
const YUCK_MUI = {
  'react/forbid-prop-types': 'off',
  'react/prop-types': 'off'
};
/* disable prettier conflicts manually */
const YUCK_PRETTIER = {
  'arrow-parens': 'off'
};
/* these are our specific overrides of the recommended rules */
const RULES = {
  ...URSYS_STYLE,
  ...CLASSROOM,
  ...HELP_TSJS,
  ...YUCK_MUI,
  ...YUCK_PRETTIER
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  RULES
};
