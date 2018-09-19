if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    DevDBLogic is the companion module that implements the console CLI for
    manipulating the database on the server

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const SETTINGS      = require('settings');
    const UNISYS        = require('unisys/client');
    const DATASTORE     = require('system/datastore');
    const SESSION       = require('unisys/common-session');
    const JSCLI         = require('system/util/jscli');

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
/*/
/*/ MOD.Hook('INITIALIZE', function () {
      console.log('*** INITIALIZE ***');
    });

/// APP_READY MESSAGE REGISTRATION ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ The APP_READY hook is fired after all initialization phases have finished
    and may also fire at other times with a valid info packet
/*/ MOD.Hook('APP_READY', function( info ) {
      console.log('*** APP_READY ***');
      return new Promise((resolve,reject) => {
        let timeout = setTimeout(()=>{
          reject(Error('UNISYS REGISTER TIMEOUT'));
        },5000);
        UNISYS.RegisterMessagesPromise()
        .then((data)=>{
          clearTimeout(timeout);
          console.log('RegisterMessagesPromise() registered handlers with server',data);
          console.log('This SocketUADDR is',UNISYS.SocketUADDR());
          resolve();
        });
      });
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ MOD.Hook('START', function () {
      console.log('*** INITIALIZE ***');
      UNISYS.Log({ msg : 'Initialize' });
    });

/// COMMAND LINE UTILITIES ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    MOD.Hook('INITIALIZE', ()=>{
      JSCLI.AddFunction(ncMakeTokens);
    });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Command: RESET THE DATABASE from default data
/*/ function ncMakeTokens( clsId, projId, numGroups ) {
      // type checking
      if (!Number.isInteger(numGroups)) return "numGroups arg3 must be integer";
      if (numGroups<1) return "numGroups arg3 must be positive integeger";
      if (typeof clsId!=='string') return "classId arg1 must be string (case insensitive)";
      if (typeof projId!=='string') return "projId arg1 must be string (case insensitive)";
      if (clsId.length>12) return "classId arg1 should be 12 chars or less";
      if (projId.length>12) return "classId arg1 should be 12 chars or less";
      // let's do this!
      let out = `\nTOKEN LIST for class ${clsId} project ${projId}\n\n`;
      let pad = String(numGroups).length;
      for (let i=1; i<=numGroups; i++) {
        let id = String(i).padStart(pad,' ');
        out += `group ${id} - ${SESSION.MakeToken(clsId,projId,i)}\n`;
      }
      let ubits = new URL(window.location);
      let hash = ubits.hash.split('/')[0];
      let url = `${ubits.protocol}//${ubits.host}/${hash}`;
      out += `\nexample url: ${SETTINGS.ServerAppURL('/edit/')}${SESSION.MakeToken(clsId,projId,1)}\n`;
      return out;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;
