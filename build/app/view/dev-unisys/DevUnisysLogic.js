/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    TEST REACT INTEGRATION through UNISYS

    Things that UNISYS has to do:
    [x] handle startup phases
    [ ] how to handle the update cycle? need to review bencode
    [ ] how to handle loading of app settings? punt
    [ ] using subscribers

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG       = {
  state : false
};

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SETTINGS  = require('settings');
const UNISYS    = require('system/unisys');

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var MOD         = UNISYS.NewModule( module.id );
var UDATA       = UNISYS.NewDataLink( MOD );
var COUNTER     = 3;
var INTERVAL    = null;
var PASSED      = null;

/// SETUP TESTS ///////////////////////////////////////////////////////////////

PASSED = {
  initHook1         : false,
  initHook2         : false,
  initHookDeferred  : false,

  startHook         : false,
  stateChange       : false,

  callRegInvoke     : false,
  callData          : false,
  callDataProp      : false,

  remoteCall        : false,
  remoteData        : false,
  remoteDataAdd     : false
}


/// LIFECYCLE INIT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ First INITIALIZE Hook takes some time to resolve asynchronously
    Enable this feature by returning a Promise
/*/ MOD.Hook('INITIALIZE', function () {
      PASSED.initHook1 = true;
      let tms = 1000;
      console.log(`Init Hook P1 will resolve in ${tms} milliseconds...`);
      let p = new Promise(function (resolve,reject) {
        setTimeout(
          () => {
            resolve(1);
            console.log('Init Hook P1 resolved!');
            PASSED.initHookDeferred = true;
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
      PASSED.initHook2 = true;
      console.log('Init Hook P2 resolves immediately');

      UDATA.HandleMessage('LOGICMELON',(data)=>{
        if (data && data.melon) PASSED.callRegInvoke = true;
        if (typeof data==='object') PASSED.callData = true;
        if (typeof data.melon==='string' && data.melon==='jsxmelon') PASSED.callDataProp = true;
      });

    }); // end INITIALIZE 2
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The START phase executes after INITIALIZE has completed.
    we register handlers to the VIEW state namespace,
    and also set different namespace states on timers
/*/ MOD.Hook('START', function () {
      // register state change handler
      UDATA.OnStateChange('VIEW',(state)=>{
        if (DBG.state) console.log(`.. LOGIC <- state`,state,`via NS 'VIEW'`);
        PASSED.stateChange = true;
      });

      PASSED.startHook = true;





      /*/ 
      remote method invocation of JSXMELON is expected to return data in a callback
      /*/
      console.group('CALL INVOCATION TEST');
      UDATA.Call('JSXMELON',{melon:'logicmelon'},(data,ucontrol)=>{
        PASSED.remoteCall = true;
        if (data && data.melon && data.cat) PASSED.remoteData = true;
        if ((data.melon==='logicmelon_ack')&&(data.cat==='calico')) PASSED.remoteDataAdd = true;
      });
      console.groupEnd();






      // update the description
      setTimeout( function () {
        let state = { description : 'Logic.START set this text' };
        if (DBG.state) console.log(`LOGIC -> state`,state,`via NS 'VIEW' ${UDATA.UID()}`);
        UDATA.SetState('VIEW',state,UDATA.UID());
      },1000);

      // set a periodic timer update
      COUNTER  = 3;
      INTERVAL = setInterval( function() {
        if (--COUNTER<0) {
          clearInterval(INTERVAL);
          // check all test results
          Object.entries(PASSED).forEach( ([key,value])=>{
            if (value!==true) {
              console.warn(module.id,`test [${key}] failed`);
              throw Error(`'${key}' test did not succeed`);
            }
          });
          console.info('UNISYS TEST: all known tests have succeeded',Object.keys(PASSED).join(', '));
          return;
        }
        let state = { random: u_RandomString() };
        if (DBG.state) console.log(`LOGIC -> state`,state,`via NS 'LOGIC' ${UDATA.UID()}`);
        UDATA.SetState('LOGIC',state,UDATA.UID());
      },500);

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
