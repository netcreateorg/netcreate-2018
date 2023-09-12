/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NODE CLI TOOL
  designed to run inside of non-module nodejs legacy environment like
  the prototype version of NetCreate 2.0 (2023)

  It interfaces with other modules that are written in ESM and TYPESCRIPT,
  transpiled into CJS, and imported here.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const DBG = true;
/// ESBUILD API ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const esbuild = require('esbuild');
const { copy } = require('esbuild-plugin-copy');
const PATH = require('node:path');
const FSE = require('fs-extra');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ROOT = PATH.join(__dirname, '../..');
const ENTRY_JS = PATH.join(ROOT, '_ur/node/all-node.mts');
const DISTDIR = PATH.join(ROOT, '_ur/dist');
const OUT_JS = PATH.join(DISTDIR, 'ur-node.cjs');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const APP_PORT = 3000;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = console.log;
function _short(path) {
  if (path.startsWith(ROOT)) return path.slice(ROOT.length);
  return path;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function ESBuildLibrary() {
  //
  if (DBG) LOG('clearing', _short(DISTDIR));
  FSE.ensureDir(DISTDIR);
  if (DBG) LOG('building ur/node bundle...');
  // build the webapp and stuff it into public
  const context = await esbuild.build({
    entryPoints: [ENTRY_JS],
    bundle: true,
    platform: 'node',
    sourcemap: true,
    packages: 'external',
    outfile: OUT_JS
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function ESBuildWebApp() {
  // make sure PUBDIR exists
  if (DBG) LOG('clearing', _short(PUBDIR));
  RemoveDir(PUBDIR);
  EnsureDir(PUBDIR);

  if (DBG) LOG('building webapp from', _short(ENTRY_JS));
  // build the webapp and stuff it into public
  const context = await _context({
    entryPoints: [ENTRY_JS],
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
  // const proc_graph = await UR_Fork('graph');
  // const proc_parse = await UR_Fork('parse', { input: proc_graph });
  // await ESBuildWebApp();
  await ESBuildLibrary();
  // await ParcelBuildWebApp();
  LOG('parent process ended');
  process.exit(0);
})();
