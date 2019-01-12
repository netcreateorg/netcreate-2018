/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    NETCREATE CUSTOM STATIC WEB SERVER
    serves static files only
    invoked by server.path override in brunch-config for package_debug

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

module.exports = ( config, callback ) => {
  const express = require('express');
  const IP = require('ip');
  const EXEC = require('child_process').exec;
  const app = express();
  app.use(express.static(`${__dirname}/public`));
  app.listen(config.port,function() {
    const PR  = 'PKG_DEBUG';
    const DP  = '***';
    console.log(PR);
    console.log(PR,DP,`PACKAGE DEBUG SERVER (STATIC HTML ONLY, NO UNISYS)`,DP);
    console.log(PR,DP,`MAINAPP - http://localhost:${config.port}`);
    console.log(PR,DP,`CLIENTS - http://${IP.address()}:${config.port}`);
    console.log(PR);
    // git branch information
    EXEC('git symbolic-ref --short -q HEAD',(error,stdout,stderr) => {
      if (error) {
        // console.error(BP,'git symbolic-ref query error',error);
        console.log(PR,DP,'You are running a <detached> branch');
      }
      if (stdout) {
        stdout = stdout.trim();
        console.log(PR,DP,'You are running the "'+stdout+'" branch');
      }
    });
    // invoke brunch callback
    callback();
  }).
  on('error', function(err) {
    let errstring = `### NETCREATE SERVER ERROR: '${err.errno}'\n`;
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
  return app
};

