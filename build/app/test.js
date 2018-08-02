console.log(`included ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    TEST

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

let DBG = false;

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ list of tests that are allowed to run
/*/ let TESTS = {
      call    : false,  // unisys calls
      state   : false,  // unisys state manager
      hook    : false,  // unisys lifecycle hooks
      remote  : false,  // unisys 'remote' calls to other module
      net     : false,  // network connection to socket server
      server  : false   // unisys 'server implemented' calls
    };
/*/ groups of tests to run
/*/ let PASSED = {};
/*/ pairs of arrays to match (array of arrays)
/*/ let ARR_MATCH = [];
    let PR = 'TEST:';

    let E_SHELL, E_OUT, E_HEADER;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Main TEST ENABLE
    pass the testname (as listed in TESTS) and either true or false)
/*/ let TM = ( testname, flag ) => {
      if (typeof testname!=='string') throw "arg1 must be a testname";
      if (!TESTS.hasOwnProperty(testname)) throw `"${testname}" is not a valid testname`;
      if (DBG) console.log(PR,'TM',testname,flag||'');
      if (flag===undefined) {
        return TESTS[testname];
      } else {
        TESTS[testname]=flag;
        if (flag) m_ConfigureTestFlags(testname,flag);
        return flag;
      }
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    TM.SetTitle = function( text ) {
      E_HEADER.innerText = text;
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: pass the particular subtest
/*/ TM.Pass = function ( subtest ) {
      m_InitShell();
      // initialize tests
      if (DBG) console.error(PR,'Pass',`${subtest}`);
      if (PASSED.hasOwnProperty(subtest)) {
        if (PASSED[subtest]) ++PASSED[subtest];
        else PASSED[subtest] = 1;
      } else {
        throw Error(`Unknown subtest: ${subtest}`);
      }
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: fail the particular subtest
/*/ TM.Fail = function ( subtest ) {
      m_InitShell();
      if (DBG) console.error(PR,'Failing',`${subtest}`);
      if (PASSED.hasOwnProperty(subtest)) {
        if (PASSED[subtest]===null) {
          PASSED[subtest]=-1; // was true, then falsified
        } else {
          PASSED[subtest]=0;  // deliberately failed once
        }
      } else {
        throw Error(`Unknown subtest: ${subtest}`);
      }
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: check if the particular subtests passed have indeed passed
/*/ TM.Passed = function ( ...args ) {
      if (DBG) console.log(PR,'Passed');
      let passed = true;
      args.forEach((subtest)=>{
        if (!PASSED.hasOwnProperty(subtest)) throw `"${subtest}" is not valid subtest`;
        passed = passed && PASSED[subtest];
      });
      return passed;
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: output test results
/*/ TM.Assess = function () {
      if (DBG) console.log(PR,'Assess');
      m_PreTest();
      m_TestResults();
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: assess whether passed arrays match during Assess function()
/*/ TM.AssessArrayMatch = function( subtest, arr1, arr2 ) {
      if (DBG) console.log(PR,'AssessArrayMatch');
      ARR_MATCH.push([subtest,arr1,arr2]);
    }



/// TEST FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ sets the PASSED object keys to enable/disable tests prior to running
/*/ function m_ConfigureTestFlags ( testname, flag ) {
      if (flag===undefined) throw "arg2 flag must be true to enable, false to disable";
      // the subtest value must be set to false first
      // to skip tests, the subtest value is set to null
      if (flag===false) flag=null;
      if (flag===true) flag=false;
      // set subtest flags
      let subtests;
      switch (testname) {
        case 'state':
          subtests = {
            stateChange       : flag
          };
          break;
        case 'hook':
          subtests = {
            hookInit1         : flag,
            hookInit2         : flag,
            hookInitDeferred  : flag,
            hookStart         : flag
          };
          break;
        case 'call':
          subtests = {
            callHndlrReg      : flag,
            callHndlrData     : flag,
            callHndlrDataProp : flag,
            callDataReturn    : flag,
            callDataAdd       : flag,
            callDataMulti     : flag
          };
          break;
        case 'remote':
          subtests = {
            remoteCall        : flag,
            remoteData        : flag,
            remoteData2       : flag,
            remoteDataReturn  : flag,
            remoteDataAdd     : flag,
            remoteDataMulti   : flag
          };
          break;
        case 'server':
          subtests = {
            serverCall        : flag,
            serverCallOrder   : flag,
            serverReturn      : flag,
            serverData        : flag,
            serverDataAdd     : flag
          }
          break;
        case 'net':
          subtests = {
            netMessageInit    : flag,
            netMessageReg     : flag,
            netCall           : flag,
            netSend           : flag,
            netSendNoEcho     : 1,
            netSignal         : flag,
            netSignalEcho     : flag,
            netData           : flag,
            netDataReturn     : flag,
            netDataAdd        : flag,
//          netDataGather     : flag,
            netDataMulti      : flag
          }
          break;
        default:
          throw `Unknown test "${testname}"`
      } // end switch
      Object.assign(PASSED,subtests);
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function m_PreTest() {
      // test arrays
      ARR_MATCH.forEach(function(pair) {
        let pass = true;
        let subtest = pair[0];
        let arr1 = pair[1];
        let arr2 = pair[2];
        pass = pass && (arr1.length===arr2.length);
        for (let i=0; i<arr1.length; i++) {
          pass = pass && (arr1[i]===arr2[i]);
        }
        if (pass) TM.Pass(subtest);
      });
      // special test - failed netsend means echo test is invalid too
      if (!TM.Passed('netSend')) TM.Fail('netSendNoEcho');
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ prints the test output to console
/*/ function m_TestResults() {
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
        let res = '';
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
            switch (typeof value) {
              case 'number':
                if (value< -1) res=`${key.padEnd(padding)} [!] FAIL x ${-value}\n`;
                if (value===0) res=`${key.padEnd(padding)} [!] FAIL\n`;
                if (value===1) res=`${key.padEnd(padding)} [X]\n`;
                if (value > 1) res=`${key.padEnd(padding)} [X] x ${value}\n`;
                passed.push(res);
                break;
              default:
                passed.push(`${key.padEnd(padding)} [X] '${value}'\n`);
                break;
            }
        }
      });


      let testTitle = "UNISYS LOGIC TEST RESULTS";
      console.group(testTitle);
        let out = passed.concat(failed,skipped)
          .sort()
          .join('');

        // additional help
        let tnotes = '';
        if (!TM.Passed('netCall')) tnotes+= `NOTE: netCall* and netData* need TWO INSTANCES running to pass\n`;
        if (!TM.Passed('netSend')) tnotes+= `NOTE: netSend* needs TWO INSTANCES running to pass\n`;
        if (tnotes) out+='\n'+tnotes;

        // summary
        let summary = `${passed.length}=passed`;
        if (failed.length) summary+=` ${failed.length}=failed`;
        if (skipped.length) summary+=` ${skipped.length}=skipped`;
        console.log(`${out}\n${summary}`);
        E_HEADER.innerHTML = testTitle;
        E_OUT.innerText = `${summary}\n\n`;
        E_OUT.innerText += "OPEN JAVASCRIPT CONSOLE TO SEE DETAILS\n";
        E_OUT.innerText += "Mac shortcuts to open console\n";
        E_OUT.innerText += "  Chrome  : cmd-option-j\n";
        E_OUT.innerText += "  Firefox : cmd-option-k\n";
      console.groupEnd();
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ initialize the shell user interface for test results
/*/ function m_InitShell() {
      if (!E_SHELL) {
        E_SHELL = document.getElementById('fdshell');
        E_OUT = document.createElement('pre');
        E_HEADER = document.createElement('h4');
        E_HEADER.innerText = "RUNNING TESTS ";
        E_OUT.innerText = '.';
        E_SHELL.appendChild(E_HEADER);
        E_SHELL.appendChild(E_OUT);
      } else {
        E_OUT.innerText += '.';
      }
    }


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = TM;
