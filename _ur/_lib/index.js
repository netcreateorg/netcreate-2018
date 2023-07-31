const files = require('./files');
const appserv = require('./files');
const prompts = require('./prompts');
const text = require('./text');
const proxymise = require('./proxymise');
const ipc = require('./ipc');
const validate = require('./validate');
const errormgr = require('./error-mgr');
const uproc = require('./ur-proc');

module.exports = {
  appserv, // express appserver
  files, // file and directory utilities
  prompts, // console prompt utilities
  text, // text utilities
  proxymise, // fluid interface
  ipc, // lifecycle and communication
  errormgr, // errormgr
  uproc, // ur process helper
  validate // object validators
};
