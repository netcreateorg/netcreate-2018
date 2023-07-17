/// PRETTIER //////////////////////////////////////////////////////////////////
/*/- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\*\
    Handles formatting on save to enforce code style. Works in conjunction with
    ESLINT, which has to have its format-related rules disabled to not conflict
    with Prettier.

\*\- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - /*/

module.exports = {
  semi: true,
  printWidth: 80,
  tabWidth: 2,
  singleQuote: true,
  quoteProps: 'preserve',
  arrowParens: 'avoid',
  trailingComma: 'none'
};
