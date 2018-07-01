/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    NETCREATE CUSTOM APP SERVER
    brunch-config.js specifies this custom server

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const EXPRESS    = require('express');
const COOKIEP    = require('cookie-parser');
const APP        = EXPRESS();
const UNISYS     = require('./app/unisys/server');
const PATH       = require('path');
const IP         = require('ip');
const EXEC       = require('child_process').exec;

/// LOCAL CONSTANTS, VARS AND FLAGS ///////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS    = require('./app/system/util/prompts');
const PR         = PROMPTS.Pad('BSRV');
const DP         = PROMPTS.Stars(3);
const GIT        = PROMPTS.Pad('GIT');
var   UKEY_IDX   = 0;
const USRV_START = new Date(Date.now()).toISOString();


/// STARTUP UNISYS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ This happens early because we need to inject UNISYS connection parameters
    into index.ejs
/*/ let unetOptions = UNISYS.Initialize();
    console.log(PR,'Created Network',unetOptions);

/// CONFIGURE EXPRESS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// declare paths used by Express configuration
    const PATH_PUBLIC   = PATH.join(__dirname,'/public');
    const PATH_TEMPLATE = PATH.join(__dirname,'/app/assets');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// configure cookies middleware (appears in req.cookies)
    APP.use(COOKIEP());
/// configure headers to allow cross-domain requests of media elements
		APP.use(function(req, res, next) {
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			next();
		});
/// configure template engine then serve templated index.ejs page
    APP.set('view engine','ejs');
    APP.get('/', (req, res, next) => {
      // path to the index.ejs file
      let indexFile = PATH.join(PATH_TEMPLATE,'/index');
      // gather important information for client so it
      // can establish a socket connection to UNISYS
      let uaddr = IP.address();      // this server LAN ip
      let uport = unetOptions.port;  // unisys listening port
      let { ip, hostname } = req;    // remote ip, hostname
      // rewrite shortcut localhost into long form
      if (ip==='::1') ip = '127.0.0.1';
      // ukey increments everytime the index page is served
      let ukey = 'UHT_'+String(UKEY_IDX++).padStart(5,'0');
      // ustart is when the server last started;
      // ustart+ukey should be adequate to distinguish unique instance
      // on the network
      let ustart = USRV_START;
      // render template, passing-in template-accessible vars
      res.render(indexFile,{
        // server
        ustart,
        // client
        ip,
        hostname,
        ukey,
        // socket
        uaddr,
        uport
      });
      next();
    });
/// serve everything else out of public as static files
/// our app uses ejs templates
    APP.use('/',EXPRESS.static(PATH_PUBLIC));
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ additional route: /action (placeholder)
/*/ APP.use('/action', (req, res, next) => {
      res.send('POST action completed!');
    });

/// BRUNCH CUSTOM SERVER START FUNCTION ///////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ the brunch build tool will call this exported function to start the server
/*/ module.exports = (config, callback) => {
      APP.listen(config.port, function () {
        // prompt
        console.log(PR);
        console.log(PR,DP,'GO TO ONE OF THESE URLS in CHROME WEB BROWSER',DP);
        console.log(PR,DP,'MAINAPP - http://localhost:'+config.port);
        console.log(PR,DP,'CLIENTS - http://'+IP.address()+':'+config.port);
        console.log(PR);
        // git branch information
        EXEC('git symbolic-ref --short -q HEAD',(error,stdout,stderr) => {
          if (error) {
            // console.error(BP,'git symbolic-ref query error',error);
            console.log(GIT,'You are running a <detached> branch');
          }
          if (stdout) {
            stdout = stdout.trim();
            console.log(GIT,'You are running the "'+stdout+'" branch');
          }
        });
        callback();
      }).
      on('error', function(err) {
        let errstring = `### NETCREATE STARTUP ERROR: '${err.errno}'\n`;
        switch (err.errno) {
          case 'EADDRINUSE':
            errstring += `Another program is already using port ${config.port}.\n`;
            errstring += `Go to "http://localhost:${config.port}" to check if NetCreate is already running.\n\n`;
            errstring += `Still broken? See https://github.com/daveseah/netcreate-2018/issues/4\n`;
            break;
          default:
            errstring += `${err}`;
            console.log(err);
        }
        console.log(`\n\n${errstring}\n### PROGRAM STOP\n`);
        throw new Error(err.errno);
      });

      // now start the UNISYS network
      UNISYS.CreateNetwork();
      // Return the APP; it has the `close()` method, which would be ran when
      // Brunch server is terminated. This is a requirement.
      return APP;

    };
