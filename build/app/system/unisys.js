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
/*/ UNISYS.NewModule = (config) => {
      return new UniModule(config);
    };

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: Expose LifeCycle Hook() functions
/*/ UNISYS.OnInitialize = (executor) => {
      LifeCycle.Hook('INITIALIZE',executor);
    };
    UNISYS.OnLoadAssets = (executor) => {
      LifeCycle.Hook('LOADASSETS',executor);
    };
    UNISYS.OnConfigure = (executor) => {
      LifeCycle.Hook('CONFIGURE',executor);
    };
    UNISYS.OnStart = (executor) => {
      LifeCycle.Hook('START',executor);
    };

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: do the Startup lifecycle
/*/ UNISYS.EnterStartup = async () => {
      await LifeCycle.Execute('INITIALIZE');
      await LifeCycle.Execute('LOADASSETS');
      await LifeCycle.Execute('CONFIGURE');
      await LifeCycle.Execute('START');
      console.groupEnd();
    };



/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNISYS;
