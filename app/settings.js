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

/// MAIN GETTER/SETTER FUNCTION  //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ settings.js returns a function as its module.exports value so
    syntax like let a = SETTINGS['key'] can be used.
/*/ let MOD = (a, b) => {
  if (a === undefined) throw 'SETTINGS requires key or key,value parms';
  if (typeof a !== 'string') throw 'SETTINGS parm1 must be key string';

  if (b === undefined) {
    return S[a];
  } else {
    S[a] = b;
    return b;
  }
};

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ alternate call to set a key value pair
/*/ MOD.Set = (key, val) => {
  MOD(key, val);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ alternate call to retrieve a key
/*/ MOD.Get = key => {
  return MOD(key);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Force Reload if another module was navigated to and we want to ensure the
    entire browser was refreshed so only one set of app modules is loaded
/*/ MOD.ForceReloadOnNavigation = () => {
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
/*/ test time function
/*/ MOD.CurrentTime = () => {
  return DATE.toDateString();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ MOD.IsAdmin = () => {
  return /*(MOD.EJSProp('client').ip === '127.0.0.1') ||*/ location.href.includes(
    'admin=true'
  );
};

/// SERVER-PROVIDED PROPERTIES ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ searches through the window.NC_UNISYS object that is injected by web page
    app/static/index.ejs, which contains interesting values from server
/*/ MOD.EJSProp = propName => {
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
