/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    TEST

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

console.log(`> TEST MODULE loaded`);

let DBG = true;

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ list of tests that are allowed to run
/*/ let TESTS = {
      call   : false,       // unisys calls
      state  : false,       // unisys state manager
      hook   : false,       // unisys lifecycle hooks
      remote : false,       // unisys 'remote' calls to other module
      server : false,       // unisys 'server implemented' calls
      net    : false        // unisys 'remote network' calls
    };
/*/ groups of tests to run
/*/ let PASSED = {};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Main TEST ENABLE
    pass the testname (as listed in TESTS) and either true or false)
/*/ let TM = ( testname, flag ) => {
      if (typeof testname!=='string') throw "arg1 must be a testname";
      if (!TESTS.hasOwnProperty(testname)) throw `"${testname}" is not a valid testname`;
      if (flag===undefined) {
        return TESTS[testname];
      } else {
        TESTS[testname]=flag;
        if (flag) m_ConfigureTestFlags(testname,flag);
        return flag;
      }
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: pass the particular subtest
/*/ TM.Pass = function ( subtest ) {
      if (PASSED.hasOwnProperty(subtest)) PASSED[subtest] = true;
      else throw `Unknown subtest: ${subtest}`;
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ API: check if the particular subtests passed have indeed passed
/*/ TM.Passed = function ( ...args ) {
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
      m_TestResults();
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
            callRegister      : flag,
            callData          : flag,
            callDataProp      : flag,
            callDataReturn    : flag,
            callDataAdd       : flag,
            callDataMulti     : flag
          };
          break;
        case 'remote':
          subtests = {
            remoteCall        : flag,
            remoteData        : flag,
            remoteDataAdd     : flag,
            remoteDataMulti   : flag
          };
          break;
        case 'server':
          subtests = {
            serverCall        : flag,
            serverReturn      : flag,
            serverData        : flag,
            serverDataAdd     : flag
          }
          break;
        case 'net':
          subtests = {
            netMessageInit    : flag,
            netCall           : flag,
            netData           : flag,
            netDataAdd        : flag,
            netDataMulti      : flag
          }
          break;
        default:
          throw `Unknown test "${testname}"`
      } // end switch
      Object.assign(PASSED,subtests);
      if (DBG) console.log('New PASSED',Object.keys(PASSED).length,PASSED);
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

      console.group('UNISYS TEST RESULTS');
        let out = passed.concat(failed,skipped)
          .sort()
          .join('');
        out+=`\n${passed.length}=passed`;
        if (failed.length) out+=` ${failed.length}=failed`;
        if (skipped.length) out+=` ${skipped.length}=skipped`;
        console.log(out);
      console.groupEnd();
    }


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = TM;
