/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Base File System Helpers

  note: this has not been extensively bullet-proofed

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NDIR = require('node-dir');
const FSE = require('fs-extra');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = require('./prompts').makeTerminalOut(' FILES', 'TagGreen');
const DBG = false;

/// SYNCHRONOUS FILE METHODS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function FileExists(filepath) {
  try {
    // accessSync only throws an error; doesn't return a value
    FSE.accessSync(filepath);
    return true;
  } catch (e) {
    return false;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DirExists(dirpath) {
  try {
    const stat = FSE.statSync(dirpath);
    if (stat.isFile()) {
      TERM(`DirExists: ${dirpath} is a file, not a directory`);
      return false;
    }
    return stat.isDirectory();
  } catch {
    return false;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsDir(dirpath) {
  try {
    const stat = FSE.statSync(dirpath);
    if (stat.isDirectory()) return true;
    return false;
  } catch (e) {
    TERM(`IsDir: ${dirpath} does not exist`);
    return false;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsFile(filepath) {
  try {
    const stat = FSE.statSync(filepath);
    if (stat.isFile()) return true;
    return false;
  } catch (e) {
    TERM(`IsFile: ${filepath} does not exist`);
    return false;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function EnsureDir(dirpath) {
  try {
    FSE.ensureDirSync(path);
    return true;
  } catch (err) {
    TERM(`EnsureDir: <${path}> failed w/ error ${err}`);
    throw new Error(errmsg);
  }
}

/// ASYNC DIRECTORY METHODS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns { files, dirs } of files and directories fou blo nd in dirpath */
function m_PromiseReadDir(dirpath) {
  return new Promise((resolve, reject) => {
    NDIR.paths(dirpath, (err, paths) => {
      if (err) {
        reject(err);
        return;
      }
      if (paths) {
        resolve(paths);
      }
    });
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a dirpath, return all files. optional match extension */
async function Files(dirpath, opt = {}) {
  let paths = await m_PromiseReadDir(dirpath);
  if (paths.files.length && paths.files.length > 0) TERM('Files: success');
  else TERM('Files: fail');
  return paths.files;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function Subdirs(dirpath) {
  const { dirs } = await m_PromiseReadDir(dirpath);
  return dirs;
}

/// FILE READING //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function ReadFile(filepath, opt = { encoding: 'utf8' }) {
  return new Promise((resolve, reject) => {
    FSE.readFile(filepath, opt.encoding, (err, data) => {
      if (err) reject(err);
      else {
        resolve(data);
        if (typeof opt.callback === 'function') opt.callback(data);
      }
    });
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function WriteFile(filepath, rawdata) {
  let file = FSE.createWriteStream(filepath, { emitClose: true });
  file.write(rawdata);
  file.on('error', () => TERM('error on write'));
  file.end(); // if this is missing, close event will never fire.
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function ReadJSON(filepath) {
  const rawdata = await ReadFile(filepath);
  return JSON.parse(rawdata);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function WriteJSON(filepath, obj) {
  if (typeof obj !== 'string') obj = JSON.stringify(obj, null, 2);
  await WriteFile(filepath, obj);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  FileExists,
  DirExists,
  IsDir,
  IsFile,
  EnsureDir,
  Files,
  Subdirs,
  //
  ReadFile,
  ReadJSON,
  WriteJSON
};
