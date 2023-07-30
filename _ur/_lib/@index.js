const files = require('./files');
const appserv = require('./files');
const prompts = require('./prompts');
const text = require('./text');
const proxymise = require('./proxymise');
const ipc = require('./ipc');
const validate = require('./validate');

module.exports = {
  appserv, // express appserver
  files, // file and directory utilities
  prompts, // console prompt utilities
  text, // text utilities
  proxymise, // fluid interface
  ipc, // lifecycle and communication
  validate // object validators
};
