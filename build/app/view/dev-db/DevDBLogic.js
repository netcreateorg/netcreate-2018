if (window.NC_DBG.inc) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const SETTINGS      = require('settings');
    const UNISYS        = require('unisys/client');
    const DATASTORE     = require('system/datastore');

/// DEBUG SUPPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const PROMPTS       = require('system/util/prompts');
    const DBG           = { handler:false };

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // module 1
    const PR            = PROMPTS.Pad('DevDBLogic');
    var   MOD           = UNISYS.NewModule(module.id);
    var   UDATA         = UNISYS.NewDataLink( MOD );

/// COMPATIBILITY MODES  //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Provide Compatibility with DevUnisys instances
/*/ MOD.Hook('INITIALIZE', function () {
      console.log('*** UNISYS-DEV COMPATIBILITY INIT ***');
      // without NET_SEND_TEST:
      // fail netCallHandlr, netData, netDataAdd, netDataMulti, netDataReturn
      // fail netSendHndlr

      // spy on NET_SEND_TEST
      // does not affect tests
      UDATA.HandleMessage('NET_SEND_TEST',function(data) {
        console.log(PR,'snooping NET_SEND_TEST data',JSON.stringify(data));
      });
      // add NET_CALL_TEST handler
      // netData passes, but not specific data tests
      UDATA.HandleMessage('NET_CALL_TEST',function(data) {
        console.log(PR,'snooping NET_CALL_TEST data',JSON.stringify(data));
        // add data.stack to pass netDataMulti, netDataReturn
        if (data.stack===undefined) data.stack = [];
        data.stack.push(`DBLOGIC_SNOOP`);
        data.stack.push(`DBLOGIC_SNOOP`);
        // add data.reply to pass netDataAdd
        data.reply = 'DBLOGIC_SNOOP';
        // must return data for promise to return data to handler
        // otherwise returns null
        return data;
      });
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ EXPERIMENTAL: UNISYS_INIT is required to ensure that all registered
    messages are logged before START happens
/*/ MOD.Hook('UNISYS_INIT', function () {
      return new Promise((resolve,reject) => {
        let timeout = setTimeout(()=>{
          reject(Error('UNISYS REGISTER TIMEOUT'));
        },5000);
        UNISYS.RegisterMessagesPromise()
        .then((data)=>{
          clearTimeout(timeout);
          console.log('RegisterMessagesP() registered handlers with server',data);
          console.log('This SocketUADDR is',UNISYS.SocketUADDR());
          resolve();
        });
      });
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ MOD.Hook('START', function () {
      console.log('*** UNISYS-DEV COMPATIBILITY START ***');
      console.log('firing compatibility NET_SEND_TEST');
      UDATA.NetSend('NET_SEND_TEST',{});
      console.log('firing compatibility NET_CALL_TEST');
      UDATA.NetCall('NET_CALL_TEST',{});
    });

/// COMMAND LINE UTILITIES ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    let CMD = [];
    MOD.Hook('INITIALIZE', m_InitCLI);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Command: RESET THE DATABASE from default data
/*/ CMD.push(function ncResetDatabase() {
      DATASTORE.LoadDefaultDataPromise()
      .then((data)=>{
        console.log(PR,'Loaded Default Data');
        // UDATA.Call() returns a promise, so return it to
        // continue the asynchronous chain
        return UDATA.Call('SRV_DATABASE_INIT',{ data });
      })
      .then((d)=>{
        console.log(PR,'Server Database Initialized',d);
      });
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Initialize the CLI interface by loading functions in CMD array into
    window space, then print out instructions
/*/ function m_InitCLI() {
      var E_SHELL = document.getElementById('fdshell');
      var E_OUT = document.createElement('pre');
      var E_HEADER = document.createElement('h4');
      E_SHELL.appendChild(E_HEADER);
      E_SHELL.appendChild(E_OUT);
      E_HEADER.innerHTML='Command Information';
      E_OUT.innerHTML = 'The following CLI commands are available:\n\n';
      CMD.forEach((f)=>{
        window[f.name] = f;
        E_OUT.innerHTML+=`  ${f.name}()\n`;
      });
      E_OUT.innerText += "\n";
      E_OUT.innerText += "Mac shortcuts to open console\n";
      E_OUT.innerText += "  Chrome  : cmd-option-j\n";
      E_OUT.innerText += "  Firefox : cmd-option-k\n";
      E_OUT.innerText += "PC use ctrl-shift instead\n";
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
