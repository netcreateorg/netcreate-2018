/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    NODE CUSTOM SERVER
    see brunch-config.js for more information

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const express = require('express');
const app     = express();

/// MIDDLEWARE ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// serve static files
    app.use( express.static(__dirname + '/public') );

/// WEBSERVICE STUB ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    app.post('/action', (req, res, next) => {
      res.send('POST action completed!');
    });

/// MODULE EXPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Export the module like this for Brunch.
/*/ module.exports = (config, callback) => {

      app.listen(config.port, function () {
        console.log(`APP SERVER LISTENING on PORT ${config.port}`);
        callback();
      })
      .on('error', function(err) {
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
        process.exit(err.errno);
      });;

      // Return the app; it has the `close()` method, which would be ran when
      // Brunch server is terminated. This is a requirement.
      return app;

    };
