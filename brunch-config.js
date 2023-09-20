/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  BRUNCH CONFIGURATION

  2018:
  We're using Brunch for NetCreate because  it has a 'minimal
  configuration' philosophy. Although you still do need to do some
  configuration (see below) it's a lot less confusing than either Grunt or
  Webpack, and is considerably less verbose than Gulp. Brunch is also a
  mature project (6+ years) so it is a fairly safe bet moving forward.

  2023:
  We are locked into Brunch due to issues changing to another build system.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const NC_CONFIG = require('./app-config/netcreate-config');
const FSE = require('fs-extra');
const UDB = require('./app/unisys/server-database');

/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** string utility to wrap text with linefeeds and ANSI warning colors */
const s_warn = text => console.log(`\n\x1b[33;41m *** ${text} *** \x1b[0m\n`);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** utility to correct problems with sourcemaps:true overwriting ursys map */
const u_hack_mapfiles = () => {
  const src = `${__dirname}/_ur/_dist/client-cjs.js.map`;
  const dst = `${__dirname}/public/scripts/ursys-lib.js.map`;
  FSE.copySync(src, dst);
  console.log(`MAP HACK - replaced 'ursys-lib.js.map' with 'client-cjs.js.map' to`);
  console.log(`           fix incorrect sourcemap attribution by brunch`);
};

/// RUNTIME DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let FIRST_RUN = true;

/// BRUNCH CONFIGURATION //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  files: {
    javascripts: {
      joinTo: {
        'scripts/netc-app.js': /^app/,
        'scripts/ursys-lib.js': /^node_modules\/@ursys/,
        'scripts/netc-lib.js': /^(?!app)(?!node_modules\/@ursys)/
      }
    },
    stylesheets: {
      joinTo: {
        'styles/netc-app.css': [/^app/, /^node_modules/]
      }
    }
  },
  sourceMaps: true,
  plugins: {
    babel: {
      ignore: [/^node_modules\/@ursys/],
      presets: ['env', 'react']
    },
    autoReload: { enabled: true },
    copycat: {
      'config': ['app-config'],
      'data': ['app-data'],
      'templates': ['app-templates'],
      'htmldemos': ['app-htmldemos']
    }
  },
  server: {
    // viewing url is http://localhost:3000 by default, unless overridden by nc.js
    port: parseInt(NC_CONFIG.port)
  },
  npm: {
    styles: {
      /// also include these css files in the stylesheets joinTo
      bootstrap: ['dist/css/bootstrap.min.css']
    },
    globals: {
      jquery: 'jquery'
    }
  },
  hooks: {
    onCompile(generatedFiles, changedAssets) {
      if (FIRST_RUN) {
        u_hack_mapfiles(); // sneakily copy dist directory to public scripts
        console.log(`\n--- compilation complete ---\n`);
        FIRST_RUN = false;
        return;
      }
      generatedFiles.forEach(f => {
        const { sourceFiles } = f;
        sourceFiles.forEach(sf => {
          const { path } = sf;
          if (path.includes('@ursys')) {
            s_warn('restart NetCreate server after modifying @ursys library code');
            return;
          }
        });
      });
    }
  },

  /// OVERRIDES FOR PRODUCTION /////////////////
  /// invoke with 'brunch -e classroom build -s'

  overrides: {
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
          const server = require('./brunch-server');
          return new Promise((resolve, reject) => {
            server({ port: 3000 }, function () {
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
          UDB.WriteDbJSON(`${__dirname}/app-data/${NC_CONFIG.dataset}-db.json`);
          UDB.WriteDbJSON(`${__dirname}/app-data/standalone-db.json`);

          // // save json of template to public/data
          // UDB.WriteTemplateJSON(`${__dirname}/app-data/${NC_CONFIG.dataset}-template.json`);
          // UDB.WriteTemplateJSON(`${__dirname}/app-data/standalone-template.json`);

          // save TOML of template to public/data
          UDB.CloneTemplateTOML(
            `${__dirname}/app-data/${NC_CONFIG.dataset}.template.toml`
          );
          UDB.CloneTemplateTOML(`${__dirname}/app-data/standalone.template.toml`);
        },
        onCompile() {
          console.log(`\n*** STANDALONE PACKAGE has been BUILT`);
          console.log(
            `\n    The standalone package is in public/ and run from index.html.`
          );
          console.log(`    Edit index.html to change the prompts shown in the app.`);
          console.log(`    Upload contents of public/ to a web server to use!\n`);
          console.log(
            `    To target a specific database, copy the data/___.json files to the server\n`
          );
          console.log(`    And add ?dataset=name to the url (before the #)\n`);
          console.log('    For example:\n');
          console.log('          http://netcreate.org/SampleNetworks/Package/#/\n');
          console.log('    Becomes:\n');
          console.log(
            '          http://netcreate.org/SampleNetworks/Package/?dataset=2020-02-06_Tacitus#/\n'
          );
        }
      }
    },
    // env 'package_dbg' is set by npm run package:debug
    package_debug: {
      optimize: false,
      sourceMaps: true,
      server: {
        path: `${__dirname}/brunch-server-static.js`
      },
      hooks: {
        preCompile() {
          // These files will eventually be copied over to public by brunch
          // save json of database to public/data
          UDB.WriteDbJSON(`${__dirname}/app-data/${NC_CONFIG.dataset}-db.json`);
          UDB.WriteDbJSON(`${__dirname}/app-data/standalone-db.json`);

          // // save json of template to public/data
          // UDB.WriteTemplateJSON(`${__dirname}/app-data/${NC_CONFIG.dataset}-template.json`);
          // UDB.WriteTemplateJSON(`${__dirname}/app-data/standalone-template.json`);

          // save TOML of template to public/data
          UDB.CloneTemplateTOML(
            `${__dirname}/app-data/${NC_CONFIG.dataset}.template.toml`
          );
          UDB.CloneTemplateTOML(`${__dirname}/app-data/standalone.template.toml`);
        },
        onCompile() {
          console.log(`\n*** STANDALONE PACKAGE DEBUG MODE`);
          console.log(`    Point browser to MAINAPP or CLIENT addresses indicated `);
        }
      }
    }
  }
}; // module.exports
