/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Base File System Helpers

  note: this has not been extensively bullet-proofed

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NDIR = require('node-dir');
const FSE = require('fs-extra');
const PATH = require('path');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = require('./prompts').makeTerminalOut(' FILES', 'TagGreen');
const ERR_UR = 444;
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
    FSE.ensureDirSync(dirpath);
    return true;
  } catch (err) {
    TERM(`EnsureDir: <${dirpath}> failed w/ error ${err}`);
    throw new Error(errmsg);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RemoveDir(dirpath) {
  try {
    if (IsDir(dirpath)) FSE.removeSync(dirpath);
    return true;
  } catch (err) {
    TERM(`EnsureDir: <${dirpath}> failed w/ error ${err}`);
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
  let result = await m_PromiseReadDir(dirpath);
  if (DBG) {
    if (result.files.length && paths.files.length > 0) TERM('Files: success');
    else TERM('Files: fail');
  }
  return result.files.map(p => PATH.basename(p));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function Subdirs(dirpath) {
  const result = await m_PromiseReadDir(dirpath);
  return result.dirs;
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function Test() {
  const files = await Files(__dirname);
  if (files.length && files.length > 0) TERM('FM.Files: success');
  else TERM('Files: fail');
  TERM(`found ${files.length} files`);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  FileExists,
  DirExists,
  IsDir,
  IsFile,
  EnsureDir,
  RemoveDir,
  Files,
  Subdirs,
  //
  ReadFile,
  ReadJSON,
  WriteJSON,
  //
  Test
};
