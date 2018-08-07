/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

DATABASE SERVER

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = true;

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const Loki              = require('lokijs');
const NetMessage        = require('../unisys/common-netmessage-class');

/// CONSTANTS /////////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS           = require('../system/util/prompts');
const PR                = PROMPTS.Pad('SRV-DB');
const ERR               = PROMPTS.Pad('!!!');
const DB_FILE           = './runtime/netcreate.json';

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var   m_db;
var   m_options;

/// API MEHTHODS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var   DB = {};

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Initializez the database
/*/ DB.InitializeDatabase = function( options={} ) {
      let ropt = {
        autoload         : true,
        autoloadCallback : m_DatabaseInitialize,
        autosave         : true,
        autosaveCallback : m_AutosaveStatus,
        autosaveInterval : 4000  // save every four seconds
      };
      ropt = Object.assign(ropt,options);
      m_db = new Loki(DB_FILE,ropt);
      m_options = ropt;
      console.log(PR,`Initialized LokiJS Database '${DB_FILE}'`);
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    DB.PKT_SetDatabase = function ( pkt ) {
      console.log(PR,`PKT_SetDatabase`);
    }

/// SUPPORTING FUNCTIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function m_DatabaseInitialize() {
      // on the first load of (non-existent database), we will have no
      // collections so we can detect the absence of our collections and
      // add (and configure) them now.
      var entries = m_db.getCollection("entries");
      if (entries === null) {
        entries = m_db.addCollection("entries");
      }
      // kick off any program logic or start listening to external events
      m_RunProgramLogic(m_options);
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function m_RunProgramLogic() {
      var entries = m_db.getCollection("entries");
      entries.clear();
      var entryCount = entries.count();
      var now = new Date();
      console.log(PR,`Entries in database: ${entryCount}`);

      if (m_options.testPeriodicInsert) {
        setInterval(function() {
          entryCount = entries.count();
          entries.insert({ x: now.getTime(), y: 100 - entryCount });
        },1000);
      }

    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function m_AutosaveStatus( ) {
      var entries = m_db.getCollection("entries");
      if (m_options.testPeriodicInsert) {
        var entryCount = entries.count();
        console.log(PR,`autosaving ${entryCount} entries...`);
      }
    }


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = DB;
