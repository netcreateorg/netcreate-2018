/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  LOGGER
  ported from PLAE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const Loki              = require('lokijs');
const PATH              = require('path');
const FSE               = require('fs-extra');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const PROMPTS           = require('../system/util/prompts');
const PR                = PROMPTS.Pad('SRV-LOG');

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

const LOG_DIR           = '../../runtime/logs';
const Tracer 			      = require('tracer');
const LOG_DELIMITER     = '\t';
const LOG_CONFIG = {
  format : "{{line}}  {{message}}",
  dateformat : "HH:MM:ss.L",
  preprocess : function (data) {
    data.line = 'C '+Number(data.line).zeroPad(4);
  }
};
const LOGGER = Tracer.colorConsole(LOG_CONFIG);
let   fs_log 		= null;
// enums for outputing dates
const e_weekday = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];

// initialize event logger
var dir = PATH.resolve(PATH.join(__dirname,LOG_DIR));
FSE.ensureDir(dir, function (err) {
  if (err) throw new Error('could not make '+dir+' directory');
  var logname = str_TimeDatedFilename('log')+'.txt';
  var pathname = dir+'/'+logname;
  fs_log = FSE.createWriteStream(pathname);
  LogLine(`NETCREATE APPSERVER SESSION LOG for ${str_DateStamp()} ${str_TimeStamp()}`);
  LogLine('---');
});

/**	LOGGING FUNCTIONS ******************************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	Log a standard system log message
/*/	function LogLine ( ...args ) {
    if (!fs_log) return;

    var out = str_TimeStamp()+' ';
    var c = args.length;
    // arguments are delimited
    if (c) {
      for (let i=0; i<c; i++) {
        if (i>0) out += LOG_DELIMITER;
        out += args[i];
      }
    }
    out += '\n';
    fs_log.write(out);
  }

/////////////////////////////////////////////////////////////////////////////
/**	UTILITY FUNCTIONS ******************************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function str_TimeStamp () {
      var date = new Date();
      var hh = ("0"+date.getHours()).slice(-2);
      var mm = ("0"+date.getMinutes()).slice(-2);
      var ss = ("0"+date.getSeconds()).slice(-2);
      return hh+':'+mm+':'+ss;
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function str_DateStamp() {
      var date = new Date();
      var mm = ("0"+(date.getMonth()+1)).slice(-2);
      var dd = ("0"+date.getDate()).slice(-2);
      var day = e_weekday[date.getDay()];
      var yyyy = date.getFullYear();
      return yyyy+'/'+mm+'/'+dd+' '+day;
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function str_TimeDatedFilename   ( ...args ) {
      // construct filename
      var date = new Date();
      var dd = ("0"+date.getDate()).slice(-2);
      var mm = ("0"+(date.getMonth()+1)).slice(-2);
      var hms = ("0"+date.getHours()).slice(-2);
      hms += ("0"+date.getMinutes()).slice(-2);
      hms += ("0"+date.getSeconds()).slice(-2);
      var filename;
      filename = 	date.getFullYear().toString();
      filename += '-'+mm+dd;
      var c = arguments.length;
      if (c) filename += filename.concat('-',...args);
      filename += '-'+hms;
      return filename;
  }

/// API METHODS ///////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
let LOG = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Handle incoming log events
/*/ LOG.PKT_LogEvent = function ( pkt ) {
      let {event,items} = pkt.Data();
      if (DBG) console.log(PR,pkt.Info(),event,...items);
      LogLine(pkt.Info(),event||'-',...items);
      return { OK : true };
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Write to log as delimited arguments
/*/ LOG.Write = LogLine;


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
module.exports = LOG;
