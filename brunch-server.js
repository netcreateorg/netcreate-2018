/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    NETCREATE CUSTOM APP SERVER
    automatically loaded by 'brunch watch -s' from package.json

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const COMPRESS = require('compression');
const EXPRESS = require('express');
const COOKIEP = require('cookie-parser');
const FS = require('fs');
const APP = EXPRESS();
const UNISYS = require('./app/unisys/server');
const PATH = require('path');
const IP = require('ip');
const EXEC = require('child_process').exec;

/// LOCAL CONSTANTS, VARS AND FLAGS ///////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS = require('./app/system/util/prompts');
const PR = PROMPTS.Pad('APP_SERV');
const DP = PROMPTS.Stars(3);
const GIT = PROMPTS.Pad('GIT');
var UKEY_IDX = 0;
const USRV_START = new Date(Date.now()).toISOString();
const NC_CONFIG = require('./app-config/netcreate-config');

let NODE_VER;
try {
  NODE_VER = FS.readFileSync('./.nvmrc', 'utf8').trim();
} catch (err) {
  console.error('could not read .nvmrc', err);
  throw Error(`Could not read .nvmrc ${err}`);
}

/// BRUNCH CUSTOM SERVER START FUNCTION ///////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = (config, callback) => {
  /// STARTUP UNISYS ////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ This happens early because we need to inject UNISYS connection parameters
  into index.ejs
/*/ let nc_options = {
    port: NC_CONFIG.netport
  };
  let unetOptions = UNISYS.InitializeNetwork(nc_options);

  /// CONFIGURE EXPRESS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// declare paths used by Express configuration
  const PATH_PUBLIC = PATH.join(__dirname, '/public');
  const PATH_TEMPLATE = PATH.join(__dirname, '/app/assets');

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// compress all responses
  APP.use(COMPRESS());
  /// configure cookies middleware (appears in req.cookies)
  APP.use(COOKIEP());
  /// configure headers to allow cross-domain requests of media elements
  APP.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
  });
  /// configure template engine then serve templated index.ejs page
  APP.set('view engine', 'ejs');
  APP.get('/', function (req, res, next) {
    // gather important information for client so it
    // can establish a socket connection to UNISYS
    let uaddr;
    let hostip;
    let ipOverride = NC_CONFIG.ip;
    if (ipOverride) {
      uaddr = ipOverride;
      hostip = ipOverride;
    } else {
      uaddr = IP.address(); // this server LAN ip
      hostip = IP.address(); // this gets copied to server properties to
    }
    let uport = unetOptions.port; // unisys listening port
    let { ip, hostname } = req; // remote ip, hostname
    // rewrite shortcut localhost into long form
    if (ip === '::1') ip = '127.0.0.1';
    // ukey increments everytime the index page is served
    let ukey = 'UHT_' + String(UKEY_IDX++).padStart(5, '0');
    // ustart is when the server last started;
    // ustart+ukey should be adequate to distinguish unique instance
    // on the network
    let ustart = USRV_START;
    // path to the index.ejs file
    let indexFile = PATH.join(PATH_TEMPLATE, '/index');
    // render template, passing-in template-accessible vars
    let templateProps = {
      // server information
      ustart,
      hostname,
      hostip,
      // client information
      ip,
      ukey,
      // socket address
      uaddr,
      uport
    };
    res.render(indexFile, templateProps);
    // adding next() causes 'headers already sent' error
    // it might be called internally by res.render()?
  });
  /// serve everything else out of public as static files
  /// our app uses ejs templates
  APP.use('/', EXPRESS.static(PATH_PUBLIC));
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ additional route: /action (placeholder)
/*/ APP.use('/action', (req, res, next) => {
    res.send('POST action completed!');
  });

  /// START APP SERVER //////////////////////////////////////////////////////////
  APP.listen(config.port, function () {
    // setup prompts
    console.log(PR);
    console.log(PR, DP, 'GO TO ONE OF THESE URLS in CHROME WEB BROWSER', DP);
    console.log(PR, DP, 'MAINAPP - http://localhost:' + config.port);

    let ipOverride = NC_CONFIG.ip;
    if (ipOverride) {
      console.log(PR, DP, 'CLIENTS - http://' + ipOverride + ':' + config.port);
    } else {
      console.log(PR, DP, 'CLIENTS - http://' + IP.address() + ':' + config.port);
    }

    console.log(PR);
    // git branch information
    EXEC('git symbolic-ref --short -q HEAD', (error, stdout, stderr) => {
      if (error) {
        // console.error(BP,'git symbolic-ref query error',error);
        console.log(PR, 'GIT STATUS:');
        console.log(PR, '.. You are running a <detached> branch');
      }
      if (stdout) {
        stdout = stdout.trim();
        console.log(PR, 'GIT STATUS:');
        console.log(PR, '.. You are running the "' + stdout + '" branch');
      }
    });
    // check architecture
    EXEC('arch', (error, stdout, stderr) => {
      if (stdout) {
        stdout = stdout.trim();
        if (stdout !== 'i386') {
          console.log(PR, `ARCHITECTURE: ${stdout}`);
          console.log(PR, '.. Expected i386. Operation may be unstable!');
          console.log(
            PR,
            '.. For arm64 on mac, launch a Rosetta-compatible shell by running'
          );
          console.log(PR, `.. 'arch -x86_64 /bin/zsh'`);
        } else {
          console.log(PR, `ARCHITECTURE: ${stdout}`);
        }
      }
    });
    // check nvm version
    EXEC('node --version', (error, stdout, stderr) => {
      if (stdout) {
        stdout = stdout.trim();
        if (stdout !== NODE_VER) {
          console.log(PR, '*** NODE VERSION MISMATCH ***');
          console.log(PR, '.. expected', NODE_VER, 'got', stdout);
          console.log(PR, '.. did you remember to run nvm use?');
          // eslint-disable-next-line no-process-exit
          process.exit(100);
        }
        console.log(PR, 'NODE VERSION:', stdout, 'OK');
      }
    });
    // now start the UNISYS network
    UNISYS.RegisterHandlers();
    UNISYS.StartNetwork();
    // invoke brunch callback
    console.log(PR, 'brunch-server.js returning control to brunch');
    callback();
  }).on('error', function (err) {
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
  // Return the APP; it has the `close()` method, which would be ran when
  // Brunch server is terminated. This is a requirement.
  return APP;
}; // module.exports
