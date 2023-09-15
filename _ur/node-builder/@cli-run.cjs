/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NODE CLI TOOL
  designed to run inside of non-module nodejs legacy environment like
  the prototype version of NetCreate 2.0 (2023)

  it depends on URSYS library being built previously

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const PATH = require('node:path');
const FSE = require('fs-extra');
const URSYS = require('../_dist/server.cjs');

/// CONSTANTS AND DECLARATIONS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ROOT = PATH.join(__dirname, '../../');
const PUBDIR = PATH.join(ROOT, 'public');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const APP_PORT = 3000;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const LOG = console.log;

/// ESBUILD API ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function ESBuildWebApp() {
  // make sure PUBDIR exists
  EnsureDir(PUBDIR);
  if (DBG) LOG('building webapp from', _short(ENTRY_JS));
  // build the webapp and stuff it into public
  const context = await _context({
    entryPoints: [`${ROOT}/_ur/browser-client/@client.ts`],
    bundle: true,
    loader: { '.js': 'jsx' },
    target: 'es2020',
    platform: 'browser',
    sourcemap: true,
    packages: 'external',
    outfile: join(PUBDIR, 'scripts/netc-app.js'),
    plugins: [
      copy({
        resolveFrom: 'cwd',
        assets: [
          {
            from: [`${SRCDIR}/assets/**/*`],
            to: [PUBDIR]
          },
          {
            from: [`app-config/**/*`],
            to: [PATH.join(PUBDIR, 'config')]
          },
          {
            from: [`app-data/**/*`],
            to: [PATH.join(PUBDIR, 'data')]
          },
          {
            from: [`app-htmldemos/**/*`],
            to: [PATH.join(PUBDIR, 'htmldemos')]
          }
        ],
        watch: true
      })
    ]
  });
  // enable watching
  if (DBG) LOG('watching', _short(PUBDIR));
  await context.watch();
  // The return value tells us where esbuild's local server is
  if (DBG) LOG('serving', _short(PUBDIR));
  const { host, port } = await context.serve({
    servedir: PUBDIR,
    port: APP_PORT
  });
  LOG('appserver at', `http://${host}:${port}`);
}

/// RUNTIME ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** TEST **/
(async () => {
  LOG('ur parent process started');
  const MODPATH = PATH.join(__dirname, '../../_ur_mods');
  LOG('## forking parse');
  LOG(Object.keys(URSYS)); //
  URSYS.Fork.ProcTest();
  URSYS.Fork.UR_Fork('parse', { cwd: MODPATH });
  LOG('parent process ended');
  process.exit(0);
})();
