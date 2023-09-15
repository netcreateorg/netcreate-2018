/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NODE CLI TOOL
  designed to run inside of non-module nodejs legacy environment like
  the prototype version of NetCreate 2.0 (2023)

  It interfaces with other modules that are written in ESM and TYPESCRIPT,
  transpiled into CJS, and imported here.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const esbuild = require('esbuild');
const { copy } = require('esbuild-plugin-copy');
const { umdWrapper } = require('esbuild-plugin-umd-wrapper');
const PATH = require('node:path');
const FSE = require('fs-extra');

/// CONSTANTS AND DECLARATIONS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ROOT = PATH.join(__dirname, '../../');
const DISTDIR = PATH.join(ROOT, '_ur/_dist');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const LOG = console.log;

/// ESBUILD API ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function _short(path) {
  if (path.startsWith(ROOT)) return path.slice(ROOT.length);
  return path;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** build the UR libraries for server and client */
async function ESBuildLibrary() {
  //
  FSE.removeSync(DISTDIR);
  FSE.ensureDir(DISTDIR);
  if (DBG) LOG('building ur/node bundle...');
  // build the server library for
  const nodeBuild = {
    entryPoints: [`${ROOT}/_ur/node-server/@server.mts`],
    bundle: true,
    platform: 'node',
    target: ['node18', 'esnext'],
    sourcemap: true,
    packages: 'external'
  };

  /* build the server library for nodejs */
  if (DBG) LOG('building ur/node-server ESM...');
  await esbuild.build({
    ...nodeBuild,
    outfile: `${DISTDIR}/server-esm.mjs`,
    format: 'esm'
  });
  if (DBG) LOG('building ur/node-server CJS...');
  await esbuild.build({
    ...nodeBuild,
    outfile: `${DISTDIR}/server.cjs`,
    format: 'cjs'
  });

  /* build the server library for nodejs */
  const browserBuild = {
    entryPoints: [`${ROOT}/_ur/browser-client/@client.ts`],
    bundle: true,
    platform: 'browser',
    target: ['esnext'],
    sourcemap: true
    // packages: 'external'
  };
  if (DBG) LOG('building ur/browser-client ESM...');
  await esbuild.build({
    ...browserBuild,
    outfile: `${DISTDIR}/client-esm.js`,
    format: 'esm'
  });
  if (DBG) LOG('building ur/browser-client UMD...');
  await esbuild.build({
    ...browserBuild,
    plugins: [umdWrapper()],
    outfile: `${DISTDIR}/client-umd.js`,
    format: 'umd' // esbuild-plugin-umd-wrapper
  });
}

/// RUNTIME ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** TEST **/
(async () => {
  LOG('ur parent process started');
  await ESBuildLibrary();
  LOG('parent process ended');
  process.exit(0);
})();
