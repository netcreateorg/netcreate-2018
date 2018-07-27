/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    TEST REACT INTEGRATION through UNISYS

    Things that UNISYS has to do:
    [x] handle startup phases
    [ ] how to handle the update cycle? need to review bencode
    [ ] how to handle loading of app settings? punt
    [ ] using subscribers

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SETTINGS  = require('settings');
const UNISYS    = require('unisys/client');
const TEST      = require('test');

/// DEBUG TESTS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TEST_WAIT     = 1500;
var   TESTCOUNTER   = 3;
var   TESTINTERVAL  = null;
var   PASSED        = null;
// enable debug output and tests
const DBG = {
  call   : null,
  state  : null,
  hook   : null,
  local  : null, // internal instance calls
  remote : null, // cross-instance calls
  net    : null  // cross-network calls
};
// skeleton hook to enable test modules
// intended to replace the PASSED structure below,
// but they currently don't do anything
TEST('state'  , DBG.state);
TEST('local'  , DBG.local);
TEST('remote' , DBG.remote);
TEST('net'    , DBG.net);
TEST('hook'   , DBG.hook);
// enable specific tests
// false = enabled, null = skip
// gets set ot TRUE when test runs
PASSED = {

  // lifecycle initialization
  hookInit1         : DBG.hook,
  hookInit2         : DBG.hook,
  hookInitDeferred  : DBG.hook,
  hookStart         : DBG.hook,

  // state change
  stateChange       : DBG.state,

  // simple message handling invocation
  callRegister      : DBG.call, // handler was registered and was called
  callData          : DBG.call, // handler received data object
  callDataProp      : DBG.call, // data object has expected data value
  callDataReturn    : DBG.call, // data object returned data modification
  callDataMulti     : DBG.call, // multiple message call data aggregation

  // message call/handle/return across UDATA instances
  remoteCall        : DBG.remote,
  remoteData        : DBG.remote,
  remoteDataAdd     : DBG.remote,
  remoteMultiCall   : DBG.remote,

  // message call/handle/return across network
  netCall           : DBG.net,
  netData           : DBG.net,
  netDataAdd        : DBG.net,
  netMultiCall      : DBG.net
}

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var   MOD         = UNISYS.NewModule( module.id );
var   UDATA       = UNISYS.NewDataLink( MOD );
// create new test module
var   FR_MOD      = UNISYS.NewModule( module.id );
var   FR_UDATA    = UNISYS.NewDataLink(FR_MOD,'SimRemote');
const PROMPTS     = require('system/util/prompts');
const FR          = PROMPTS.Pad('FAKE_REMOTE');

/// TEST FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function m_TestResults() {
      // check all test results
      let failed   = [];
      let skipped  = [];
      let passed   = [];
      let pEntries = Object.entries(PASSED);
      let padding  = 0;
      // find longest string
      pEntries.forEach(( [key,value] ) => {
        if (key.length>padding) padding = key.length;
      });
      // scan test results
      pEntries.forEach(( [key,value ]) => {
        switch (value) {
          case true:
            passed.push(`${key.padEnd(padding)} [X]\n`);
            break;
          case false:
            failed.push(`${key.padEnd(padding)} [!] FAIL\n`);
            break;
          case null:
            skipped.push(`${(key).padEnd(padding)} [ ]\n`);
            break;
          default:
        }
      });

      console.group(`UNISYS TEST RESULTS (after ${TEST_WAIT} ms)`);
        let out = passed.concat(failed,skipped)
          .sort()
          .join('');
        out+=`\n${passed.length}=passed ${failed.length}=failed ${skipped.length}=skipped`;
        console.log(out);
      console.groupEnd();
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function m_StartTests() {
      // set timeout timer for test results
      setTimeout( function () {
        m_TestResults();
      }, TEST_WAIT);

  /// STATE CHANGE TESTING
  /*/ register state change handler
  /*/ if (DBG.state) {
        UDATA.OnStateChange('VIEW',(state)=>{
          if (DBG.state) console.log(`.. LOGIC <- state`,state,`via NS 'VIEW'`);
          PASSED.stateChange = true;
        });
        PASSED.hookStart = true;
      }

  /// NETWORK TESTING
  /*/ remote method invocation of REMOTE_CALL_TEST is expected to return data in a callback
  /*/ if (DBG.remote) {
        console.log('invoking REMOTE_CALL_TEST...');
        UDATA.Call('REMOTE_CALL_TEST',{melon:'logicmelon'})
        .then((data) => {
          console.log('REMOTE_CALL_TEST return data',data);
          PASSED.remoteCall = true;
          if (data && data.melon && data.cat) PASSED.remoteData = true;
          if ((data.melon==='logicmelon_ack')&&(data.cat==='calico')) PASSED.remoteDataAdd = true;
        });
      }

      // INVOKE stateChange
      if (DBG.state) {
        // update the description after 1000ms
        setTimeout( function () {
          let state = { description : 'test stateChange succeeded' };
          if (DBG.state) console.log(`LOGIC -> state`,state,`via NS 'VIEW' ${UDATA.UID()}`);
          UDATA.SetState('VIEW',state,UDATA.UID());
        },1000);
      }

      if (DBG.local) {
        // call counter function 3 times 500ms apart, then check that all tests passed
        // set a periodic timer update
        TESTCOUNTER  = 3;
        TESTINTERVAL = setInterval( function() {
          if (--TESTCOUNTER<0) {
            clearInterval(TESTINTERVAL);
          }
          // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
          function u_RandomString() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (var i = 0; i < 5; i++) {
              text += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            return text;
          }

          let state = { random: u_RandomString() };
          if (DBG.state) console.log(`LOGIC -> state`,state,`via NS 'LOGIC' ${UDATA.UID()}`);
          UDATA.SetState('LOGIC',state,UDATA.UID());
        },500);
      }
    } // end m_TestChecker


/// LIFECYCLE INIT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ First INITIALIZE Hook takes some time to resolve asynchronously
    Enable this feature by returning a Promise
/*/ if (DBG.hook) MOD.Hook('INITIALIZE', function () {
      PASSED.hookInit1 = true;
      let tms = 1000;
      console.log(`Init Hook P1 will resolve in ${tms} milliseconds...`);
      let p = new Promise(function (resolve,reject) {
        setTimeout(
          () => {
            resolve(1);
            console.log('Init Hook P1 resolved!');
            PASSED.hookInitDeferred = true;
          },
          tms
        );
      });
      return p;
    }); // end INITIALIZE 1
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Second INITIALIZE Hook just runs a normal function.
    Enable this feature by returning a Function
/*/ if (DBG.hook) MOD.Hook('INITIALIZE', function() {
      PASSED.hookInit2 = true;
      console.log('Init Hook P2 resolves immediately');

      // TEST RESOLVE callDataProp, callData, callRegister
      // is called by DevUnisys Start Lifecycle hook
      if (DBG.remote) UDATA.HandleMessage('TEST_REMOTE_IN',(data)=>{
        if (data && data.melon) PASSED.callRegister  = true;
        if (typeof data==='object') PASSED.callData = true;
        if (typeof data.source==='string' && data.source==='DevUnisysJSX') PASSED.callDataProp = true;
      });

      // TEST RESOLVE localCall, localData
      // is called by FR_MOD (a separate UDATA instance) lifecycle START on
      // FR_UDATA instance.
      // note that UDATA also implements 'FAKE_REMOTE'
      if (DBG.remote) UDATA.HandleMessage('FAKE_REMOTE',(data,ucontrol) => {
        console.log('FakeRemote got data',data);
        data.results.push('UDATA_instance');
        PASSED.localCall = true;
        PASSED.localData = (data!==undefined);
        return data;
      });

    }); // end INITIALIZE 2
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The START phase executes after INITIALIZE has completed.
    we register handlers to the VIEW state namespace,
    and also set different namespace states on timers
/*/ MOD.Hook('START', function () {
      m_StartTests();
    }); // end START



/** SECOND FAKE REMOTE MODULE, USING FAKE REMOTE UDATA ***********************/
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The Fake Remote testing happens here in a separate module.
/*/ FR_MOD.Hook('INITIALIZE', function() {
      if (DBG.net) {
        console.log(FR,'FR Add FAKE_REMOTE Handler #2');
        // TEST RESOLVE remoteData
        FR_UDATA.HandleMessage('FAKE_REMOTE',(data) => {
          data.results.push('FR_UDATA_instance');
          console.log(FR,'got FAKE_REMOTE message with data',data);
          PASSED.remoteData = true;
        });
      }
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    FR_MOD.Hook('START', function() {
      // TEST INVOKE remoteDataAdd
      if (DBG.net) {
        FR_UDATA.Call('FAKE_REMOTE',{ mycat:'kitty',results:[] })
        .then((data)=>{
          console.log(FR,'got data',data);
          PASSED.remoteDataAdd = true;
        });
      }
    });





/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
