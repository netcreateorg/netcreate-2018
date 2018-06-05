/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    TEST REACT INTEGRATION through UNISYS

    Things that UNISYS has to do:
    [x] handle startup phases
    [ ] how to handle the update cycle? need to review bencode
    [ ] how to handle loading of app settings? punt
    [ ] using subscribers

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG       = true;

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SETTINGS  = require('settings');
const UNISYS    = require('system/unisys');

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MOD   = UNISYS.NewModule( module.id );
var UNODE = UNISYS.NewConnector( MOD );

/// LIFECYCLE INIT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ First INITIALIZE Hook takes some time to resolve asynchronously
    Enable this feature by returning a Promise
/*/ MOD.Hook('INITIALIZE', function () {
      let tms = 1000;
      console.log(`Init Hook P1 will resolve in ${tms} milliseconds...`);
      let p = new Promise(function (resolve,reject) {
        setTimeout(
          () => {
            resolve(1);
            console.log('Init Hook P1 resolved!');
          },
          tms
        );
      });
      return p;
    }); // end INITIALIZE 1
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Second INITIALIZE Hook just runs a normal function.
    Enable this feature by returning a Function
/*/ MOD.Hook('INITIALIZE', function() {
      console.log('Init Hook P2 resolves immediately');
    }); // end INITIALIZE 2
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The START phase executes after INITIALIZE has completed.
    we register handlers to the VIEW state namespace,
    and also set different namespace states on timers
/*/ MOD.Hook('START', function () {
      // register state change handler
      UNODE.OnStateChange('VIEW',(ns,state,src_uid)=>{
        console.log(`.. LOGIC <- state`,state,`via NS '${ns}' ${src_uid}`);
      });

      // update the description
      setTimeout( function () {
        let state = { description : 'Logic.START set this text' };
        console.log(`LOGIC -> state`,state,`via NS 'VIEW' ${MOD.UID()}`);
        UNODE.SetState('VIEW',state,MOD.UID());
      },1000);

      // set a periodic timer update
      setInterval( function() {
        let state = { random: u_RandomString() };
        console.log(`LOGIC -> state`,state,`via NS 'LOGIC' ${MOD.UID()}`);
        UNODE.SetState('LOGIC',state,MOD.UID());
      },5000);

    }); // end START


/// MODULE API ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Utility function to return a random string.
    https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
/*/ function u_RandomString() {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      return text;
    }



/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
