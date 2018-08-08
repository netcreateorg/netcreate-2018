if (window.NC_DBG.inc) console.log(`inc ${module.id}`);
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
    const SETTINGS      = require('settings');
    const UNISYS        = require('unisys/client');
    // master TEST enable is in DevUnisys.JSX constructor()
    // but most are tested and passed in this module
    const TEST          = require('test');

/// DEBUG SUPPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const PROMPTS       = require('system/util/prompts');
    const DBG           = { handler:false };
    // these constants are used in m_StartTests()
    const TEST_WAIT     = 3000;
    var   TEST_TIMER    = null;

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // module 1
    const PR            = PROMPTS.Pad('TEST');
    var   MOD           = UNISYS.NewModule(module.id);
    var   UDATA         = UNISYS.NewDataLink( MOD );
    // module 2
    var   MOD2          = UNISYS.NewModule(module.id);
    var   UDATA2        = UNISYS.NewDataLink(MOD2,'SimRemote');
    const PR2           = PROMPTS.Pad('REMTEST');


/// LIFECYCLE TESTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ First INITIALIZE Hook takes some time to resolve asynchronously
    Enable this feature by returning a Promise
/*/ MOD.Hook('INITIALIZE', function () {
      if (!TEST('hook')) return Promise.resolve('immediate');
      TEST.Pass('hookInit1');
      let tms = 1000;
      let p = new Promise(function (resolve,reject) {
        setTimeout(
          () => {
            // if a hook returns a promise, then lifecycle waits
            // until all promises are resolved
            TEST.Pass('hookInitDeferred');
            resolve('hookInitDeferred');
          },
          tms
        );
      }); // new Promise
      return p;
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Second INITIALIZE Hook just runs a normal function.
    Enable this feature by returning a Function
/*/ MOD.Hook('INITIALIZE', function() {
      if (TEST('hook')) TEST.Pass('hookInit2');
    }); // end INITIALIZE 2


/// OTHER TESTS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Initialize message handlers during INITIALIZE so we can run them later
    during START
/*/ MOD.Hook('INITIALIZE', function() {
      if (TEST('call')) {
        // 'TEST_CALL' is invoked from DevUnisys.jsx
        UDATA.HandleMessage('TEST_CALL',(data)=>{
          if (data && data.source) TEST.Pass('callHndlrReg');
          if (typeof data==='object') TEST.Pass('callHndlrData');
          if (typeof data.source==='string' && data.source==='DevUnisysJSX') TEST.Pass('callHndlrDataProp');
          data.source = 'DevUnisysLogic-Return';
          if (!data.stack) data.stack=[]; data.stack.push('TRI-1');
          data.extra = 'AddedData';
          return data;
        });
        // a second 'TEST_CALL' to test aggregate data return
        UDATA.HandleMessage('TEST_CALL',(data)=>{
          if (!data.stack) data.stack=[]; data.stack.push('TRI-2');
          return Object.assign(data,{ multi : 'MultiData' });
        });
      }
      // 'REMOTE_CALL_TEST' is invoked from MOD2
      // note that there are multiple handlers for 'REMOTE_CALL_TEST'
      // to test collecting data from all of them
      if (TEST('remote')) {
        UDATA.HandleMessage('REMOTE_CALL_TEST',(data,ucontrol) => {
          if (DBG.handler) console.log('REMOTE_CALL_TEST got data',data);
          TEST.Pass('remoteCall');
          if (data&&Array.isArray(data.results)) {
            TEST.Pass('remoteData');
            data.results.push('UDATA_instance');
          }
          // caller should check remoteDataAdd and remoteDataMulti
          return data;
        });
      }
    }); // end INITIALIZE 3


/// TEST MESSAGE REGISTRATION /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ This is a placeholder that will eventually be moved into UNISYS proper
/*/ MOD.Hook('START', function () {
      if (TEST('hook')) TEST.Pass('hookStart');
      UNISYS.RegisterMessagesP()
      .then((data)=>{
        console.log('RegisterMessagesP() registered handlers with server',data);
        if (TEST('net')) TEST.Pass('netMessageReg');
      });
    });

/// SECOND MODULE for MODULE-to-MODULE TESTS //////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ MOD2 is a completely different UNISYS MODULE declaration for ensuring that
    modules can access data in other modules. Has its own LIFECYCLE naturally.
    First declare message handlers during INITIALIZE
/*/ MOD2.Hook('INITIALIZE', function() {
      if (TEST('remote')) {
        UDATA2.HandleMessage('REMOTE_CALL_TEST',(data) => {
          if (data&&Array.isArray(data.results)) {
            data.results.push('UDATA2_instance');
            if (DBG.handler) console.log(PR2,'got REMOTE_CALL_TEST message with data',data);
            TEST.Pass('remoteData2');
          }
        });
      }
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Now test message handlers during START
/*/ MOD2.Hook('START', function() {
      if (TEST('remote')) {
        // test remote data call (local, not network)
        UDATA2.LocalCall('REMOTE_CALL_TEST',{ mycat:'kitty',results:[] })
        .then((data)=>{
          if (data.mycat==='kitty') TEST.Pass('remoteDataReturn');
        });
      }
    });

/// SERVER CALL TESTS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Now test message handlers during START
/*/ MOD2.Hook('START', function() {
      // TEST SERVER NETWORK CALL
      if (TEST('server')) {
        // used for order testing
        let sendorder = [];
        let recvorder = [];
        // only test network calls
        let netOnly = { toLocal : false, toNet : true };
        for (let i=0; i<5; i++) {
          setTimeout(function() {
            sendorder.push(i);
            UDATA2.Call('SRV_REFLECT',{
              me    : 'DevUnisysLogic:MOD2.Start',
              stack : ['DevUnisysLogic'],
              count : i
            }, netOnly)
            .then((data)=>{
              if (DBG.handler) console.log(PR2,'got SRV_RFLECT',data);
              TEST.Pass('serverCall');
              if ((data!==undefined)&&(Array.isArray(data.stack))) TEST.Pass('serverData');
              if ((data.stack)&&(data.stack.length===2)&&(data.stack[1]==='SRV_01')) TEST.Pass('serverDataAdd');
              if (data.me && data.me==='DevUnisysLogic:MOD2.Start') TEST.Pass('serverReturn');
              recvorder.push(data.count);
            });
          },Math.random()*1000);
        }
        TEST.AssessArrayMatch('serverCallOrder',sendorder,recvorder);
      } // end TEST('server')
    });


/// UNISYS NETWORK SEND/CALL/SIGNAL TESTS /////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ define test handler
/*/ MOD2.Hook('INITIALIZE', function() {
      if (TEST('net')) {
        UDATA2.HandleMessage('NET_CALL_TEST',(data) => {
          console.log(`*** NET_CALL_TEST (1) got data called by ${JSON.stringify(data.stack)} from socket ${UNISYS.SocketUADDR()}`);
          data.reply=`hi from ${UNISYS.SocketUADDR()}`;
          if (data.stack===undefined) data.stack = [];
          data.stack.push(`${UNISYS.SocketUADDR()}_01`);
          TEST.Pass('netCallHndlr');
          return data;
        });
        UDATA2.HandleMessage('NET_CALL_TEST',(data) => {
          console.log(`*** NET_CALL_TEST (2) got data called by ${JSON.stringify(data.stack)} from socket ${UNISYS.SocketUADDR()}`);
          if (data.stack===undefined) data.stack = [];
          data.stack.push(`${UNISYS.SocketUADDR()}_02`);
          return data;
        });
        UDATA2.HandleMessage('NET_SIGNAL_TEST',(data) => {
          if (typeof data.source==='string') TEST.Pass('netSignal');
          if (data.source===UNISYS.SocketUADDR()) TEST.Pass('netSignalEcho');
        });
        UDATA2.HandleMessage('NET_SEND_TEST',(data) => {
          // send only targets other instances, not the sending one
          // console.log(`*** NET_SEND_TEST got data called by ${data.source} from socket ${UNISYS.SocketUADDR()}`);
          if (data.source===UNISYS.SocketUADDR()) {
            TEST.Fail('netSendNoEcho');
            console.log(`*** NET_SEND_TEST fail netSendNoEcho`);
          } else {
            // this triggers if the data source DOES NOT MATCH our own data socket
            TEST.Pass('netSendHndlr');
            console.log(`*** NET_SEND_TEST pass netSend`);
          }
        });
      }
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ invoke test handler on OTHER instance
/*/ MOD2.Hook('START', function() {
      setTimeout(delayed_send,2000);
      // inline function
      function delayed_send() {
        if (!TEST('net')) return;
        let uaddr = UNISYS.SocketUADDR();
        let greeting = `hi from ${uaddr}`;
        let call = { test:'netcall', greeting };
        // test signal
        UDATA2.NetSignal('NET_SIGNAL_TEST',{ test:'netsignal', source : uaddr });
        // test call (note this is from UDATA, not UDATA2)
        UDATA.NetCall('NET_CALL_TEST', call)
        .then((d)=>{
          // console.log(`*** NET_CALL_TEST (REPLY) got data returned ${JSON.stringify(d.stack)} from socket ${UNISYS.SocketUADDR()}`);
          if (typeof d==='object') TEST.Pass('netData');
          if (typeof d.reply==='string') TEST.Pass('netDataAdd');
          if (d.greeting===greeting) TEST.Pass('netDataReturn');
          if (Array.isArray(d.stack) && d.stack.length>1) TEST.Pass('netDataMulti');
        });
        // test send
        UDATA2.NetSend('NET_SEND_TEST',{ test:'netsend', source : uaddr  });
      }
    });

/// TEST STARTUP //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The START phase executes after INITIALIZE has completed.
    we register handlers to the VIEW state namespace,
    and also set different namespace states on timers
/*/ MOD.Hook('START', function () {
  /// ASSESS TESTS AFTER TEST_WAIT MS
      console.log('*** RUNNING UNISYS TESTS ***');
      TEST.SetTitle('RUNNING TESTS');
      TEST.SetMeta('socket',UNISYS.SocketUADDR());
      TEST_TIMER = setTimeout(TEST.Assess,TEST_WAIT);

  /// STATE CHANGE TESTING
  /*/ register state change handler for 'VIEW' namespace
  /*/ if (TEST('state')) {
        UDATA.OnStateChange('VIEW',(state)=>{
          TEST.Pass('stateChange');
        });
        // Do the state change test!
        setTimeout( function () {
          let state = { description : 'test stateChange succeeded' };
          UDATA.SetState('VIEW',state,UDATA.UID());
        },1000);
      } // if TEST state

  /// NETWORK TESTING
  /*/ remote method invocation of REMOTE_CALL_TEST is expected to return data in a callback
  /*/ if (TEST('remote')) {
        UDATA.HandleMessage('REMOTE_CALL_TEST',(data, msgcon) => {
          // 'REMOTE_CALL_TEST' is also implemented in DevUnisys.jsx
          // so its return data will be merged with this
          return { dog : 'spotted' };
        });
        // Do the call test!
        UDATA.LocalCall('REMOTE_CALL_TEST',{melon:'logicmelon'})
        .then((data) => {
          if (data && data.melon && data.cat) TEST.Pass('remoteData');
          if (data.melon==='logicmelon_ack' && data.cat==='calico') TEST.Pass('remoteDataAdd');
          if (data.dog && data.dog==='spotted') TEST.Pass('remoteDataMulti');
        });
      } // if TEST remote

  /*/ call counter function 3 times 500ms apart, then check that all tests passed
      set a periodic timer update
  /*/ var TESTCOUNTER = 3;
      var TESTINTERVAL = setInterval( function() {
        if (--TESTCOUNTER<0) {
          clearInterval(TESTINTERVAL);
        }
        // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
        function u_random_string() {
          var text = "";
          var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          for (var i = 0; i < 5; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
          }
          return text;
        }
        let state = { random: u_random_string() };
        UDATA.SetState('LOGIC',state,UDATA.UID());
      },500);
  }); // end START TEST HOOK


/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
