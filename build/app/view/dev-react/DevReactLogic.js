if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

    const DBG           = { handler:false };

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const SETTINGS      = require('settings');
    const UNISYS        = require('unisys/client');

/// DEBUG SUPPORT /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const PROMPTS       = require('system/util/prompts');
    const PR            = PROMPTS.Pad('DevReactLogic');

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // module 1
    var   MOD           = UNISYS.NewModule(module.id);
    var   UDATA         = UNISYS.NewDataLink( MOD );

/// COMPATIBILITY MODES  //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Provide Compatibility with DevUnisys instances
/*/ MOD.Hook('INITIALIZE', function () {
      console.log('*** INITIALIZE ***');
    });


/// APP START HOOK
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ MOD.Hook('START', function () {
      console.log('*** START ***');
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
        UDATA.SetState('VIEW',state,UDATA.UID());
      },500);
    });

/// APP_READY HOOK REGISTRATION ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The APP_READY hook is fired after all initialization phases have finished
    and may also fire at other times with a valid info packet
/*/ MOD.Hook('APP_READY', function( info ) {
      info = info || {};
      console.log('*** APP_READY ***');
    });

/// COMMAND LINE UTILITIES ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    let CMD = [];
    MOD.Hook('RESET', m_InitCLI);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Command: RESET THE DATABASE from default data
/*/ CMD.push(function ncTest( jsonFile ) {
      return "ncTest() exiting";
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Initialize the CLI interface by loading functions in CMD array into
    window space, then print out instructions
/*/ function m_InitCLI() {
      console.log('*** CONFIGURE ***');
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
