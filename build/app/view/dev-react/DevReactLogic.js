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
      console.log('*** UNISYS-REACT COMPATIBILITY INIT ***');
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ EXPERIMENTAL: UNISYS_INIT is required to ensure that all registered
    messages are logged before START happens
/*/ MOD.Hook('UNISYS_INIT', function () {
      console.log('*** UNISYS-REACT UNISYS_INIT ***');
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ MOD.Hook('START', function () {
      console.log('*** UNISYS-REACT STARAT ***');
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

/// COMMAND LINE UTILITIES ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    let CMD = [];
    MOD.Hook('CONFIGURE', m_InitCLI);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Command: RESET THE DATABASE from default data
/*/ CMD.push(function ncTest( jsonFile ) {
      return "ncTest() exiting";
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
