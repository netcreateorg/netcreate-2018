/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NODE CLI TOOL
  designed to run inside of non-module nodejs legacy environment like
  the prototype version of NetCreate 2.0 (2023)

  It interfaces with other modules that are written in ESM and TYPESCRIPT,
  transpiled into CJS, and imported here.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const esbuild = require('esbuild');
const { umdWrapper } = require('esbuild-plugin-umd-wrapper');
const FSE = require('fs-extra');

/// CONSTANTS AND DECLARATIONS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { ROOT, DIR_PACKAGE } = require('./env-builder.cjs');
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
  // FSE.removeSync(DIR_PACKAGE); // don't do this because brunch watch will break
  FSE.ensureDir(DIR_PACKAGE);
  if (DBG) LOG('.. building ur/node bundle...');
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
  if (DBG) LOG('.. building ur/node-server ESM...');
  await esbuild.build({
    ...nodeBuild,
    outfile: `${DIR_PACKAGE}/server-esm.mjs`,
    format: 'esm'
  });
  if (DBG) LOG('.. building ur/node-server CJS...');
  await esbuild.build({
    ...nodeBuild,
    outfile: `${DIR_PACKAGE}/server.cjs`,
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
  if (DBG) LOG('.. building ur/browser-client ESM...');
  await esbuild.build({
    ...browserBuild,
    outfile: `${DIR_PACKAGE}/client-esm.js`,
    format: 'esm'
  });
  if (DBG) LOG('.. building ur/browser-client UMD...');
  await esbuild.build({
    ...browserBuild,
    plugins: [umdWrapper()],
    outfile: `${DIR_PACKAGE}/client-umd.js`,
    format: 'umd' // esbuild-plugin-umd-wrapper
  });
}

/// RUNTIME ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** TEST **/
(async () => {
  LOG('## BUILD LIBS');
  await ESBuildLibrary();
})();
