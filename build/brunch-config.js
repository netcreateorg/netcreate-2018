/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  BRUNCH CONFIGURATION

  Brunch is a "task runner" that performs the common operations for
  developing webapps. Essentially it transforms your source files and
  copies them to a 'public' directory, where a built-in webserver can
  make them available to viewing in a browser by visiting localhost.
  It also supports "plugins" to provide additional functions like source
  code minification and transpiling other script languages into pure CSS
  and Javascript. This is similar to other popular task runners like
  Webpack, Grunt, and Gulp.

  We're using Brunch for NetCreate because  it has a 'minimal
  configuration' philosophy. Although you still do need to do some
  configuration (see below) it's a lot less confusing than either Grunt or
  Webpack, and is considerably less verbose than Gulp. Brunch is also a
  mature project (6+ years) so it is a fairly safe bet moving forward.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const NC_CONFIG = require("./app/assets/netcreate-config");
const UDB = require('./app/unisys/server-database');

// CommonJS module format
// exports a configuration object
module.exports = {

/// CONCATENATION /////////////////////////////////////////////////////////////
/*/ Brunch intelligently combines source javascript, stylesheets, and
  templates into single files. It includes not only your source files in
  the app/ directory, but is smart enough to look in node_modules/ and
  vendor/ directories. The joinTo property allows multiple ways to define
  all the sources you want combined into the named file.
  - - -
  NOTE: brunch includes ONLY files referred to by require() statements
  NOTE: app, vendor, public are relative to this config file
  NOTE: any directory is fair game for pattern matching
/*/ files: {
      javascripts: {
        joinTo: {
          'scripts/netc-app.js'   : /^app/,
          'scripts/netc-lib.js'   : /^(?!app)/
        }
      },
      stylesheets: {
        joinTo : {
          'styles/netc-app.css'  : [
            /^app/,
            /^node_modules/
          ]
        }
      }
    },

/// PLUGIN CONFIGURATION //////////////////////////////////////////////////////
/*/ Brunch plugins generally work without configuration, but sometimes you need
  to do it, particularly for plugins that interface with other npm packages
  with their own configuration requirements (e.g. babel)
/*/ plugins: {
      babel: {
      // brunch-babel plugin requires additional babel settings to enable jsx processing
      // npm i --save-dev babel babel-preset-env babel-preset-react
      // npm i --save-dev babel-brunch@github:babel/babel-brunch
        presets   : ['env', 'react']
      },
      autoReload : { enabled: true }
    },

/// SERVER CONFIGURATION //////////////////////////////////////////////////////
/*/ Brunch will use its internal server unless a brunch-server.js module is
  present. The module should return a function that accepts a config obj and
  a callback function that is invoked when the server is done initializing.
  It should return an object with a close() method (as ExpressJS app does)
/*/ server: {
      // viewing url is http://localhost:3000 by default, unless overridden by nc.js
      port   : parseInt(NC_CONFIG.port)
    },

/// NPM INTEGRATION ///////////////////////////////////////////////////////////
/*/ Brunch is aware of the node_modules directory but sometimes needs help to
  find the right source files to include in processing.
/*/ npm: {
      styles: {
      /// include these css files in the stylesheets joinTo
        bootstrap: ['dist/css/bootstrap.min.css']
      },
      globals: {
        jquery: 'jquery'
      }
    },

    hooks: {
      onCompile() {
        console.log(`\n*** NetCreate is running (dev mode) ***\n`);
      }
    },

/// STORYBOOK COMPATIBILITY ///////////////////////////////////////////////////
/*/ Storybook uses spread operators, which are not supported in the current
    version of brunch-babel.  Brunch doesn't need to compile storybook files
    anyway because storybook has its own compile via webpack.  So ignore them.
/*/ conventions: {
      ignored: [ /\.stories.js$/]
    },

/// OVERRIDES FOR PRODUCTION //////////////////////////////////////////////////
/*/ Brunch configuration settings default to development mode in the
    environment. You can override each env (e.g. production) after all other
    declarations are done.
/*/ overrides: {
      // env 'classroom' is set by npm start / npm run start
      classroom: {
        optimize: true,
        sourceMaps: false,
        plugins: {
          autoReload: { enabled: false },
          terser: {
            ecma: 2016,
            mangle: false
          }
        },
        hooks: {
          onCompile() {
            const server = require("./brunch-server");
            return new Promise((resolve, reject) => {
              server({ port : 3000}, function() {
                console.log(`\n*** NetCreate is running (classroom mode) ***\n`);
                resolve();
              });
            });
          }
        }
      },
      // env 'package' is set by npm run package
      package: {
        optimize: false,
        sourceMaps: false,
        plugins: {
          autoReload: { enabled: false }
        },
        hooks: {
          preCompile() {
            // These files will eventually be copied over to public by brunch
            // save json of database to public/data
            UDB.WriteDbJSON(`${__dirname}/app/assets/data/${NC_CONFIG.dataset}-db.json`);
            UDB.WriteDbJSON(`${__dirname}/app/assets/data/standalone-db.json`);

            // save json of template to public/data
            UDB.WriteTemplateJSON(`${__dirname}/app/assets/data/${NC_CONFIG.dataset}-template.json`);
            UDB.WriteTemplateJSON(`${__dirname}/app/assets/data/standalone-template.json`);

          },
          onCompile() {
            console.log(`\n*** STANDALONE PACKAGE has been BUILT`);
            console.log(`\n    The standalone package is in public/ and run from index.html.`);
            console.log(`    Edit index.html to change the prompts shown in the app.`);
            console.log(`    Upload contents of public/ to a web server to use!\n`);
            console.log(`    To target a specific database, copy the data/___.json files to the server\n`);
            console.log(`    And add ?dataset=name to the url (before the #)\n`);
            console.log('    For example:\n');
            console.log('          http://netcreate.org/SampleNetworks/Package/#/\n');
            console.log('    Becomes:\n');
            console.log('          http://netcreate.org/SampleNetworks/Package/?dataset=2020-02-06_Tacitus#/\n');

          }
        }
      },
      // env 'package_dbg' is set by npm run package:debug
      package_debug: {
        optimize: false,
        sourceMaps: true,
        server : {
          path: `${__dirname}/brunch-server-static.js`
        },
        hooks: {
          preCompile() {
            // These files will eventually be copied over to public by brunch
            // save json of database to public/data
            UDB.WriteDbJSON(`${__dirname}/app/assets/data/${NC_CONFIG.dataset}-db.json`);
            UDB.WriteDbJSON(`${__dirname}/app/assets/data/standalone-db.json`);

            // save json of template to public/data
            UDB.WriteTemplateJSON(`${__dirname}/app/assets/data/${NC_CONFIG.dataset}-template.json`);
            UDB.WriteTemplateJSON(`${__dirname}/app/assets/data/standalone-template.json`);

          },
          onCompile() {
            console.log(`\n*** STANDALONE PACKAGE DEBUG MODE`);
            console.log(`    Point browser to MAINAPP or CLIENT addresses indicated `);
          }
        }
      }
    }

}; // module.exports
