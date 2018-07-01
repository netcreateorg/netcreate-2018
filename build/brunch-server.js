/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    NODE CUSTOM SERVER
    see brunch-config.js for more information

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const EXPRESS = require('express');
const APP     = EXPRESS();
const UNISYS  = require('./app/unisys/server');
const PATH    = require('path');
const PROMPTS = require('./app/system/util/prompts');
const PR      = PROMPTS.Pad('BSRV');

/// MIDDLEWARE ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// serve static files
    APP.use(EXPRESS.static(PATH.join(__dirname,'/public')));

/// inject javascript test
    APP.get('/', function (req, res) {
      res.send('GET request to the homepage')
    });


/// WEBSERVICE STUB ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    APP.post('/action', (req, res, next) => {
      res.send('POST action completed!');
    });

/// MODULE EXPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Export the module like this for Brunch.
/*/ module.exports = (config, callback) => {

      APP.listen(config.port, function () {
        console.log(PR,'initializing UNISYS');
        UNISYS.CreateNetwork();
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

      // Return the APP; it has the `close()` method, which would be ran when
      // Brunch server is terminated. This is a requirement.
      return APP;

    };
