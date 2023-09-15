/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYNK RUNNER

  URSYNK is the name of the set of communication tools Sri is making to
  support modular asynchronous communication frameworks, based on
  previous URSYS and UNISYS versions.

  WIP

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import APPSERV from './appserver.mjs';
import IPC from './ipc.mjs';
import { RemoveDir, EnsureDir } from './files.mjs';
import { UR_Fork } from './ur-proc.mjs';
import { makeTerminalOut } from '../common/prompts.js';
import { fileURLToPath } from 'node:url';

/// RESTORE CJS CONVENIENCE MACROS ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see blog.logrocket.com/alternatives-dirname-node-js-es-modules/
const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = makeTerminalOut('UR', 'TagBlue');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// PROTOTYPE BUILD ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// utilities
import { join } from 'path';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ROOT = __dirname;
const PUBDIR = join(__dirname, './public-es');
const SRCDIR = join(__dirname, './app');
const APP_PORT = 3000;
const ENTRY_JS = join(SRCDIR, 'init.jsx');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function _short(path) {
  if (path.startsWith(ROOT)) return path.slice(ROOT.length);
  return path;
}
/// PARCEL API ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import { Parcel } from '@parcel/core';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function ParcelBuildWebApp() {
  let bundler = new Parcel({
    entries: 'app/init.jsx',
    defaultConfig: '@parcel/config-default',
    mode: 'development',
    defaultTargetOptions: {
      distDir: 'public-parcel'
    }
  });
  try {
    let { bundleGraph, buildTime } = await bundler.run();
    let bundles = bundleGraph.getBundles();
    console.log(`✨ Built ${bundles.length} bundles in ${buildTime}ms!`);
  } catch (err) {
    console.log(err.diagnostics);
  }
}

/// ESBUILD API ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import { context as _context } from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function ESBuildLibrary() {
  const BUNDLEDIR = join(__dirname, 'bundles');
  if (DBG) LOG('clearing', _short(BUNDLEDIR));
  RemoveDir(BUNDLEDIR);
  EnsureDir(BUNDLEDIR);
  if (DBG) LOG('building ur bundle...');
  // build the webapp and stuff it into public
  // build the webapp and stuff it into public
  const context = await _context({
    entryPoints: [ENTRY_JS],
    bundle: true,
    loader: { '.js': 'jsx' },
    target: 'es2020',
    platform: 'browser',
    sourcemap: true,
    packages: 'external',
    outfile: join(PUBDIR, 'scripts/netc-app.js')
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function ESBuildWebApp() {
  // make sure PUBDIR exists
  if (DBG) LOG('clearing', _short(PUBDIR));
  RemoveDir(PUBDIR);
  EnsureDir(PUBDIR);

  if (DBG) LOG('building webapp...');
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
            to: [join(PUBDIR, 'config')]
          },
          {
            from: [`app-data/**/*`],
            to: [join(PUBDIR, 'data')]
          },
          {
            from: [`app-htmldemos/**/*`],
            to: [join(PUBDIR, 'htmldemos')]
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
})();
