/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  read a loki database 

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Loki from 'lokijs';
import FSE from 'fs-extra';
import PATH from 'path';
// our library import
import { TerminalFormatter } from '@ursys/netcreate';
// import from local files require extensions
import * as SESSION from './session.ts';

/// CONTROL ///
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const READONLY = true;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// STATUSES ///
let m_datafile: string = '';
let m_db: Loki; // loki database
let m_db_loaded: boolean = false;
let m_max_edgeID: number;
let m_max_nodeID: number;
let m_options: any;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// COLLECTIONS ///
let NODES: Loki.Collection;
let EDGES: Loki.Collection;

/// INITIALIZATION ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = TerminalFormatter('LOKI', 'TagBlue');
if (DBG) LOG('module: import-lokidb.mts ');
LOG(JSON.stringify(SESSION));

/// HELPERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// utility function for getting a valid file path
const f_validname = (dataset: string): string => {
  // validate dataset name
  const regex = /^([A-z0-9-_+./])*$/; // Allow _ - + . /, so nested pathways are allowed
  // good dataset name
  if (regex.test(dataset)) {
    if (dataset.endsWith('.loki')) return dataset;
    return `${dataset}.loki`;
  }
  // not a valid dataset name
  const err = `bad dataset name: ${dataset}`;
  console.error(err);
  throw new Error(err);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** callback: create new collections if they don't exist */
const cb_loadComplete = () => {
  LOG('DATABASE LOADED!');
  // ensure collections if readonly
  NODES = m_db.getCollection('nodes');
  EDGES = m_db.getCollection('edges');
  if (!READONLY) {
    if (NODES === null) NODES = m_db.addCollection('nodes');
    if (EDGES === null) EDGES = m_db.addCollection('edges');
  }
  // get number of nodes
  const nodeCount = NODES.count();
  const edgeCount = EDGES.count();
  // get max ids
  m_max_nodeID = GetMaxIdIn(NODES);
  m_max_edgeID = GetMaxIdIn(EDGES);
  //
  LOG(`${nodeCount} NODES / ${edgeCount} EDGES`);
  LOG(`NODE MAX_ID ${m_max_nodeID} / EDGE MAX_ID ${m_max_edgeID}`);
  //
  m_db_loaded = true;
  if (m_options.resolve) {
    m_options.resolve();
    m_options.resolve = null;
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** callback: outputs notice to the screen when loki autosaves */
const cb_autosaveNotice = () => {
  const nodeCount = NODES.count();
  const edgeCount = EDGES.count();
  if (READONLY) {
    LOG(`unexpected AUTOSAVE encounter when READONLY = true`);
  } else {
    LOG(`AUTOSAVING! ${nodeCount} NODES / ${edgeCount} EDGES <3`);
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** asynchronously load database file */
function _LoadDatabase(dataset: string, options: any = {}) {
  m_datafile = f_validname(dataset);
  FSE.ensureDirSync(PATH.dirname(m_datafile));
  if (!FSE.existsSync(m_datafile)) {
    LOG(`DATABASE ${m_datafile} NOT FOUND`);
    if (!READONLY) LOG('creating blank database...');
    else if (m_options.reject) {
      m_options.reject();
      m_options.reject = null;
    }
  }
  LOG(`LOADING DATABASE ${m_datafile}`);
  let ropt = {
    autoload: true,
    autoloadCallback: cb_loadComplete
  };
  if (!READONLY) {
    LOG(`write mode: ensure collections and autosave`);
    ropt = Object.assign(ropt, {
      autosave: true,
      autosaveCallback: cb_autosaveNotice,
      autosaveInterval: 4000 // save every four seconds
    });
  }
  ropt = Object.assign(ropt, options);
  m_db = new Loki(m_datafile, ropt);
  m_options = ropt;
  m_options.m_datafile = m_datafile; // store for use by DB.WriteJSON
}

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Initialize the database
 */
function PromiseLoadDatabase(dataset: string, options: any = {}) {
  return new Promise((resolve, reject) => {
    _LoadDatabase(dataset, { resolve, reject, ...options });
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ListCollections() {
  if (!m_db_loaded) {
    LOG(`database not loaded...try later`);
    return;
  }
  m_db.listCollections().forEach(col => {
    LOG(`collection: ${col.name}`);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetMaxIdIn(col: Loki.Collection) {
  if (col.count() > 0) {
    return col.mapReduce(
      obj => obj.id,
      arr => Math.max(...arr)
    );
  }
  return 0;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { PromiseLoadDatabase, ListCollections };
