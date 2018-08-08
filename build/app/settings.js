console.log(`included ${module.id}`);
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
let S        = {};
let DATE     = new Date();

/// MAIN GETTER/SETTER FUNCTION  //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ settings.js returns a function as its module.exports value so
    syntax like let a = SETTINGS['key'] can be used.
/*/ let MOD = ( a, b ) => {
    if (a===undefined) throw ('SETTINGS requires key or key,value parms');
    if (typeof a!=='string') throw ('SETTINGS parm1 must be key string');

    if (b===undefined) {
      return S[a];
    } else {
      S[a] = b;
      return b;
    }
  }

/// API ///////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ alternate call to set a key value pair
/*/ MOD.Set = (key, val) => {
      MOD( key, val );
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ alternate call to retrieve a key
/*/ MOD.Get = ( key ) => {
      return MOD( key )
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Force Reload if another module was navigated to and we want to ensure the
    entire browser was refreshed so only one set of app modules is loaded
/*/ MOD.ForceReloadSingleApp = () => {
      const key = 'APP_LOAD_INIT';
      if (MOD.Get(key)) {
        location.reload();
        return;
      }
      // if reload didn't happen, then save info
      MOD.Set(key,true);
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ test time function
/*/ MOD.CurrentTime = () => {
      return DATE.toDateString();
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ searches through the window.NC_UNISYS object that is injected by web page
    app/static/index.ejs, which contains interesting values from server
/*/ MOD.EJSProp = ( propName ) => {
      if (propName===undefined) return EJSPROPS;
      return EJSPROPS[propName];
    };



/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
