if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  LOCAL SETTINGS
  utility function for managing local

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// GLOBAL NETWORK INFO (INJECTED ON INDEX) ///////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: server-embedded properties are not defined for simple html apps
var EJSPROPS = window.NC_UNISYS || {};

/// STORAGE ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let S = {};
let DATE = new Date();
let RELOAD_CHECK = 0;
let RELOAD_TIMER = null;

/// MAIN GETTER SETTER FUNCTION  //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** settings.js returns a function as its module.exports value so
    syntax like let a = SETTINGS['key'] can be used.
 */
let MOD = (a, b) => {
  if (a === undefined) throw 'SETTINGS requires key or key,value parms';
  if (typeof a !== 'string') throw 'SETTINGS parm1 must be key string';

  if (b === undefined) {
    return S[a];
  } else {
    S[a] = b;
    return b;
  }
};

/// ROUTE UTILITIES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ROUTES_PARAMS = {
  '/': { scope: 'NetCreate' },
  '/edit': { scope: 'NetCreate', plist: ['token'] },
  '/simple': { scope: 'HTMLFrame' }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return matching routed information. Looks part after /#/ as route
 *  information and returns the routing information for UNISYS routing
 *  of components and setting UNISYS module scope (used for client exec)
 */
MOD.GetRouteInfoFromURL = (url = window.location.href) => {
  const fn = 'GetRouteInfoFromURL:';
  const routeParts = url.split('/#/');
  let routeString = routeParts.length === 1 ? '' : routeParts[1];
  const routeParameters = routeString.split('/');
  const [route, ...params] = routeParameters;
  const key = `/${route}`;
  const routeInfo = ROUTES_PARAMS[key];
  const { scope, plist = [] } = routeInfo || { element: NoMatch };
  const dict = {};
  for (let i = 0; i < plist.length; i++) {
    const pkey = plist[i];
    dict[pkey] = params[i];
  }
  return {
    route: key,
    scope,
    params: dict
  };
};

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** alternate call to set a key value pair
 */
MOD.Set = (key, val) => {
  MOD(key, val);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** alternate call to retrieve a key
 */
MOD.Get = key => {
  return MOD(key);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Force Reload if another module was navigated to and we want to ensure the
    entire browser was refreshed so only one set of app modules is loaded
 */
MOD.ForceReloadOnNavigation = () => {
  RELOAD_CHECK++;
  if (RELOAD_CHECK > 1) {
    console.warn(`SETTINGS: ForceReloadOnNavigation active. Reloading!`);
    if (RELOAD_TIMER) clearTimeout(RELOAD_TIMER);
    RELOAD_TIMER = setTimeout(() => {
      location.reload();
    }, 500);
  } else {
    console.warn(`SETTINGS: ForceReloadOnNavigation check OK`);
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** test time function
 */
MOD.CurrentTime = () => {
  return DATE.toDateString();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns true is the NetCreate app should assume that an administrator is
 *  logged in. Administrators can edit templates. The check is very weak,
 *  relying on browsers running on localhost with the URL parameter.
 *  TODO: will be replacing with "real" login system for NetCreate 2.0.
 */
MOD.IsAdmin = () => {
  const isLocalHost = MOD.EJSProp('client').ip === '127.0.0.1';
  const urlHasAdmin = location.href.includes('admin=true');
  //
  return isLocalHost && urlHasAdmin;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Joshua added to disable Extras in init-appshell.jsx */
MOD.IsLocalHost = () => {
  return MOD.EJSProp('client').ip === '127.0.0.1';
};

/// SERVER-PROVIDED PROPERTIES ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** searches through the window.NC_UNISYS object that is injected by web page
    app/static/index.ejs, which contains interesting values from server
 */
MOD.EJSProp = propName => {
  if (propName === undefined) return EJSPROPS;
  return EJSPROPS[propName];
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MOD.ServerHostName = () => {
  return EJSPROPS.server.hostname || 'ERROR';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MOD.ServerHostIP = () => {
  return EJSPROPS.server.ip || 'ERROR';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MOD.ServerAppURL = suburl => {
  let ubits = new URL(window.location);
  let hash = ubits.hash.split('/')[0];
  let serverip = MOD.ServerHostIP();
  let url = `${ubits.protocol}//${ubits.host}/${hash}`;
  if (typeof suburl === 'string') url += suburl;
  return url;
};

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
