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
const TEST_WAIT     = 3000;
var   TESTCOUNTER   = 3;
var   TESTINTERVAL  = null;

// enable debug output and tests
TEST('state'  , false);
TEST('hook'   , false);
TEST('call'   , false);
TEST('remote' , false);
TEST('server' , true);
TEST('net'    , true);
TEST('netcall', false); // network calls

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
    function m_StartTests() {
      // set timeout timer for test results
      setTimeout( function () {
        TEST.Assess();
      }, TEST_WAIT);

  /// STATE CHANGE TESTING
  /*/ register state change handler
  /*/ if (TEST('state')) {
        UDATA.OnStateChange('VIEW',(state)=>{
          TEST.Pass('stateChange');
        });
      }

  /// NETWORK TESTING
  /*/ remote method invocation of REMOTE_CALL_TEST is expected to return data in a callback
  /*/ if (TEST('remote')) {

        UDATA.HandleMessage('REMOTE_CALL_TEST',(data, msgcon) => {
          // ignoring data entirely
          // this result will get aggregated into one object
          return { dog : 'spotted' };
        });

        UDATA.Call('REMOTE_CALL_TEST',{melon:'logicmelon'})
        .then((data) => {
          TEST.Pass('remoteCall');
          if (data && data.melon && data.cat) TEST.Pass('remoteData');
          if (data.melon==='logicmelon_ack' && data.cat==='calico') TEST.Pass('remoteDataAdd');
          if (data.dog && data.dog==='spotted') TEST.Pass('remoteDataMulti');
        });
      }

      // INVOKE stateChange
      if (TEST('state')) {
        // update the description after 1000ms
        setTimeout( function () {
          let state = { description : 'test stateChange succeeded' };
          UDATA.SetState('VIEW',state,UDATA.UID());
        },1000);

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
          UDATA.SetState('LOGIC',state,UDATA.UID());
        },500);
      }
    } // end m_TestChecker


/// LIFECYCLE INIT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ First INITIALIZE Hook takes some time to resolve asynchronously
    Enable this feature by returning a Promise
/*/ if (TEST('hook')) MOD.Hook('INITIALIZE', function () {
      TEST.Pass('hookInit1');
      let tms = 1000;
      let p = new Promise(function (resolve,reject) {
        setTimeout(
          () => {
            resolve(1);
            TEST.Pass('hookInitDeferred');
          },
          tms
        );
      });
      return p;
    }); // end INITIALIZE 1
    if (TEST('hook')) MOD.Hook('START', function () {
      TEST.Pass('hookStart');
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Second INITIALIZE Hook just runs a normal function.
    Enable this feature by returning a Function
/*/ if (TEST('hook')) MOD.Hook('INITIALIZE', function() {
      TEST.Pass('hookInit2');
    }); // end INITIALIZE 2

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ handle other handler-based tests
/*/ MOD.Hook('INITIALIZE', function() {
      // TEST RESOLVE callDataProp, callData, callRegister
      // is called by DevUnisys Start Lifecycle hook
      if (TEST('call')) {
        UDATA.HandleMessage('TEST_REMOTE_IN',(data)=>{
          if (data && data.source) TEST.Pass('callHndlrRegister');
          if (typeof data==='object') TEST.Pass('callHndlrData');
          if (typeof data.source==='string' && data.source==='DevUnisysJSX') TEST.Pass('callHndlrDataProp');
          data.source = 'DevUnisysLogic-Return';
          if (!data.stack) data.stack=[]; data.stack.push('TRI-1');
          data.extra = 'AddedData';
          return data;
        });
        UDATA.HandleMessage('TEST_REMOTE_IN',(data)=>{
          if (!data.stack) data.stack=[]; data.stack.push('TRI-2');
          return Object.assign(data,{ multi : 'MultiData' });
        });
      }
      // TEST RESOLVE remoteCall, remoteData
      // is called by FR_MOD (a separate UDATA instance) lifecycle START on
      // FR_UDATA instance.
      // note that UDATA also implements 'FAKE_REMOTE'
      if (TEST('remote')) {
        UDATA.HandleMessage('FAKE_REMOTE',(data,ucontrol) => {
          console.log('FakeRemote got data',data);
          data.results.push('UDATA_instance');
          TEST.Pass('remoteCall');
          if (data!==undefined) TEST.Pass('remoteData');
          // caller should check remoteDataAdd and remoteDataMulti
          return data;
        });
      }
    }); // end INITIALIZE 3
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
      if (TEST('remote')) {
        console.log(FR,'FR Add FAKE_REMOTE Handler #2');
        // TEST RESOLVE remoteData
        FR_UDATA.HandleMessage('FAKE_REMOTE',(data) => {
          data.results.push('FR_UDATA_instance');
          console.log(FR,'got FAKE_REMOTE message with data',data);
          TEST.Pass('remoteData');
        });
      }
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    FR_MOD.Hook('START', function() {
      // TEST INVOKE remoteDataAdd
      if (TEST('remote')) {
        // test remote data call (local, not network)
        let localOnly = { toLocal : true, toNet : false };
        FR_UDATA.Call('FAKE_REMOTE',{ mycat:'kitty',results:[] })
        .then((data)=>{
          console.log(FR,'got data',data);
          TEST.Pass('remoteDataAdd');
        }, localOnly);
      }

      // TEST SERVER NETWORK CALL
      if (TEST('server')) {
        let netOnly = { toLocal : false, toNet : true };

        let sendorder = [];
        let recvorder = [];
        for (let i=0; i<5; i++) {
          setTimeout(function() {
            sendorder.push(i);
            FR_UDATA.Call('SERVER_REFLECT',{
              me    : 'DevUnisysLogic:FR_MOD.Start',
              stack : ['DevUnisysLogic'],
              count : i
            }, netOnly)
            .then((data)=>{
              console.log(FR,'got SERVER_REFLECT',data);
              TEST.Pass('serverCall');
              if ((data!==undefined) && (Array.isArray(data.stack))) TEST.Pass('serverData');
              if ((data.stack.length===2)&&(data.stack[1]==='SRV_01')) TEST.Pass('serverDataAdd');
              if (data.me && data.me==='DevUnisysLogic:FR_MOD.Start') TEST.Pass('serverReturn');
              recvorder.push(data.count);
            });
          },Math.random()*1000);
        }
        TEST.AssessArrayMatch('serverCallOrder',sendorder,recvorder);
      } // end TEST('server')
    });





/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
