/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	SETTINGS
	stub for testing module loading

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

console.log(`> SETTINGS system module loaded`);

/// STORAGE ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

let S       = {};
let DATE    = new Date();

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
/*/ MOD.Set = ( key, val ) => { MOD( key, val ) };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ alternate call to retrieve a key
/*/ MOD.Get = ( key ) => { MOD( key ) };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ test time function
/*/ MOD.CurrentTime = () => {
		return DATE.toDateString();
	};



/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
