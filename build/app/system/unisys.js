/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    UNISYS

    UNISYS.NewModule(name) --> UNISYS class instance

    proposed API

    MOD = UNISYS.UModule(name);
    -- lifecycle --
    MOD.Hook('PHASENAME',functionHandler)
    -- network messages --
    UNISYS.RegisterCall('MESG', functionHandler(data)) - define handler for a message received
    UNISYS.LocalCall('MESG', data);
    UNISYS.NetworkCall('MESG', data);
    -- module event interface --
    ExternalModule.On('EVENT',functionHandler(event))
    ExternalModule.Off('EVENT',functionHandler(event))
    this.Notify('EVENT', eventData);
    -- shared state --
    UNISYS.SetState('namespace', stateObj);
    UNISYS.OnStateChange('namespace',functionHandler (stateObj));



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UniModule   = require('system/object/uni_module');
const LifeCycle   = require('system/event/lifecycle');
const Messager    = require('system/network/messeger');


/// INITIALIZE MAIN MODULE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let UNISYS        = {};
const DBG         = true;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: creates new umodule object and stores reference
/*/ UNISYS.UModule = (config) => {
      return new UniModule(config);
    };


    /* example of trying hooks */

    LifeCycle.Hook('INITIALIZE',()=>{
      return new Promise((resolve,reject)=>{
        // delay 1
        setTimeout( ()=>{
            resolve(1);
            console.log('hook1 resolved');
        },1000 )});
    });

    let reusablePromise = new Promise((resolve,reject)=>{
      // delay 2
      setTimeout(()=>{
          resolve(2);
          console.log('hook2 resolved');
      },1500)});
    LifeCycle.Hook('INITIALIZE',()=>{
      return reusablePromise;
    });

    LifeCycle.Hook('INITIALIZE',()=>{
      return new Promise((resolve,reject)=>{
        // delay 3
        setTimeout(()=>{
            resolve(3);
            console.log('hook3 resolved');
        },1000)});
    });

    // this will execute the phases, but RERUNNING the phases
    // doesn't restart the chain because they have been fulfilled
    (async ()=>{
      await LifeCycle.Execute('INITIALIZE');
      await LifeCycle.Execute('INITIALIZE');
      await LifeCycle.Execute('START');
    })();


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNISYS;
