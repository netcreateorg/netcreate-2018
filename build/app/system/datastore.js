/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    DATASTORE
    stub for testing module loading
    eventually will load data from database
    data.json is { nodes: [ {} ... {} ] }

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = { load: true };

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TOML = require("@iarna/toml");
const SETTINGS = require("settings");
const SESSION = require("unisys/common-session");
const UNISYS = require("unisys/client");
const PROMPTS = require("system/util/prompts");
const PR = PROMPTS.Pad("Datastore");
const NetMessage = require("unisys/common-netmessage-class");

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const HASH_ABET = "ABCDEFGHIJKLMNPQRSTVWXYZ23456789";
const HASH_MINLEN = 3;

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let DSTOR = UNISYS.NewModule(module.id);
let UDATA = UNISYS.NewDataLink(DSTOR);
let NCDATA = {};

/// LIFECYCLE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ establish message handlers during INITIALIZE phase
/*/
DSTOR.Hook("INITIALIZE", () => {
  // DBUPDATE_ALL is a local call originating from within the app
  // Used to update the full NCDATA object during template updates
  UDATA.HandleMessage("DBUPDATE_ALL", function(data) {
    DSTOR.UpdateDataPromise(data);
  });

  // DB_UPDATE is a local call originating from within the app
  // Generally used to update individual nodes and edges
  UDATA.HandleMessage("DB_UPDATE", function(data) {
    DSTOR.UpdateServerDB(data);
  });

  // DB_INSERT is a local call originating from within the app
  // Generally used to add new nodes and edges after an import
  UDATA.HandleMessage("DB_INSERT", function(data) {
    DSTOR.InsertServerDB(data);
  });

  // DB_MERGE is a local call originating from within the app
  // Generally used to update or add new nodes and edges after an import
  // Unlike DB_INSERT, it'll update existing nodes/edges
  UDATA.HandleMessage("DB_MERGE", DSTOR.MergeServerDB);

  UDATA.OnAppStateChange('SESSION', function( decodedData ) {
    let { isValid, token } = decodedData;
    console.log('Handling SESSION',isValid);
    if (isValid) DSTOR.SetSessionGroupID(decodedData);
  });

});


/// SESSION ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ datastore needs to set NetMessage GroupID property on behalf of SESSIONS
    because SESSION can't include NetMessage (or vice versa)
/*/
DSTOR.SetSessionGroupID = function ( decodedData ) {
  let { token, isValid } = decodedData;
  if (isValid) {
    NetMessage.GlobalSetGroupID(token);
    console.log('setting NetMessage group id',token);
  } else {
    console.warn('will not set bad group id:',token);
  }
};

/// DB INTERFACE //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Placeholder DATA access function
/*/
DSTOR.Data = function() {
  return NCDATA;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Write update to database
/*/
DSTOR.UpdateServerDB = function(data) {
  // check that network is online
  if (UNISYS.IsStandaloneMode()) {
    console.warn(PR,`STANDALONE MODE: UpdateServerDB() suppressed!`);
    return;
  }
  // it is!
  UDATA.Call("SRV_DBUPDATE", data).then(res => {
    if (res.OK) {
      console.log(PR, `server db transaction`, data, `success`);
    } else {
      console.log(PR, "error updating server db", res);
    }
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ get a unique NodeID
/*/
DSTOR.PromiseNewNodeID = function() {
  return new Promise((resolve, reject) => {
    UDATA.NetCall("SRV_DBGETNODEID").then(data => {
      if (data.nodeID) {
        if (DBG) console.log(PR, "server allocated node_id", data.nodeID);
        resolve(data.nodeID);
      } else {
        if (UNISYS.IsStandaloneMode()) {
          reject(new Error("STANDALONE MODE: UI should prevent PromiseNewNodeID() from running!"));
        } else {
          reject(new Error("unknown error" + JSON.stringify(data)));
        }
      }
    });
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ get a unique Edge
/*/
DSTOR.PromiseNewEdgeID = function() {
  return new Promise((resolve, reject) => {
    UDATA.NetCall("SRV_DBGETEDGEID").then(data => {
      if (data.edgeID) {
        if (DBG) console.log(PR, "server allocated edge_id:", data.edgeID);
        resolve(data.edgeID);
      } else {
        if (UNISYS.IsStandaloneMode()) {
          reject(new Error("STANDALONE MODE: UI should prevent PromiseNewEdgeID() from running!"));
        } else {
          reject(new Error("unknown error" + JSON.stringify(data)));
        }
      }
    });
  });
};

/// DATABASE LOADER ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Load default data set from a JSON file in /assets/data
/*/
DSTOR.PromiseJSONFile = function(jsonFile) {
  if (typeof jsonFile !== "string") {
    throw new Error("pass arg <filename_in_assets/data>");
  }
  let promise = new Promise((resolve, reject) => {
    let xobj = new XMLHttpRequest();
    xobj.addEventListener("load", event => {
      if (event.target.status === 404) {
        reject(new Error(`file not found`));
        return;
      }
      let data = event.target.responseText;
      NCDATA = Object.assign(NCDATA, JSON.parse(data));
      resolve(NCDATA);
    });
    xobj.open("GET", `${jsonFile}`, true);
    xobj.send();
  });
  return promise;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Load default data set from a TOML file in /assets/data
/*/
DSTOR.PromiseTOMLFile = function (tomlFile) {
  if (typeof tomlFile !== "string") {
    throw new Error("pass arg <filename_in_assets/data>");
  }
  let promise = new Promise((resolve, reject) => {
    let xobj = new XMLHttpRequest();
    xobj.addEventListener("load", event => {
      if (event.target.status === 404) {
        reject(new Error(`file not found`));
        return;
      }
      const data = event.target.responseText;
      const tomlData = Object.assign(NCDATA, TOML.parse(data));
      resolve(tomlData);
    });
    xobj.open("GET", `${tomlFile}`, true);
    xobj.send();
  });
  return promise;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Load D3 Database
/*/
DSTOR.PromiseD3Data = function() {
  // UDATA.Call() returns a promise
  return UDATA.Call("SRV_DBGET", {}); // server.js
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Write Template file to Server
/*/
DSTOR.SaveTemplateFile = template => {
  // UDATA.Call() returns a promise
  return UDATA.Call("SRV_TEMPLATESAVE", {template}); // server.js
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Get Template File Path.
    Called by template-logic when downloading template file.
/*/
DSTOR.GetTemplateTOMLFileName = () => {
  return UDATA.Call("SRV_GET_TEMPLATETOML_FILENAME");
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Update database from d3data-formatted object
/*/
DSTOR.UpdateDataPromise = function (d3data) {
  return new Promise((resolve, reject) => {
    UDATA.Call("SRV_DBUPDATE_ALL", d3data).then(res => {
      if (res.OK) {
        console.log(PR, `database update OK`);
        resolve(res);
      } else {
        reject(new Error(JSON.stringify(res)));
      }
    });
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Insert new records into database from d3data-formatted object
/*/
DSTOR.InsertServerDB = function (d3data) {
  return new Promise((resolve, reject) => {
    UDATA.Call("SRV_DBINSERT", d3data).then(res => {
      if (res.OK) {
        console.log(PR, `database update OK`);
        resolve(res);
      } else {
        reject(new Error(JSON.stringify(res)));
      }
    });
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * API: Add or Insert records into database from d3data-formatted object
 * @param {object} mergeData
 * @param {array} mergeData.nodes
 * @param {array} mergeData.edges
 * @returns
 */
DSTOR.MergeServerDB = function (mergeData) {
  return new Promise((resolve, reject) => {
    UDATA.Call("SRV_DBMERGE", mergeData).then(res => {
      if (res.OK) {
        console.log(PR, `database update OK`);
        resolve(res);
      } else {
        reject(new Error(JSON.stringify(res)));
      }
    });
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: (WIP) write database from d3data-formatted object
/*/
DSTOR.OverwriteDataPromise = function (d3data) {
  return new Promise((resolve, reject) => {
    UDATA.Call("SRV_DBSET", d3data).then(res => {
      if (res.OK) {
        console.log(PR, `database set OK`);
        resolve(res);
      } else {
        reject(new Error(JSON.stringify(res)));
      }
    });
  });
};

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = DSTOR;
