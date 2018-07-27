/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    TEST

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

console.log(`> TEST MODULE loaded`);

let DBG = true;


/*/ list of tests that are allowed to run
/*/ let TESTS = {
      state  : false,       // unisys state manager
      hook   : false,       // unisys lifecycle hooks
      local  : true,        // unisys 'local' call to module
      remote : true,        // unisys 'remote' calls to other module
      net    : false        // unisys 'remote network' calls
    };
/*/ groups of tests to run
/*/ let PASSED = {};

/*/ Main TEST ENABLE
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

/*/ pass the particular subtest
/*/ TM.Pass = function ( subtest ) {
      if (PASSED.hasOwnProperty(subtest)) PASSED[subtest] = true;
    };

/*/ check if the particular subtests passed have indeed passed
/*/ TM.Passed = function ( ...args ) {
      let passed = true;
      args.forEach((subtest)=>{
        if (!PASSED.hasOwnProperty(subtest)) throw `"${subtest}" is not valid subtest`;
        passed = passed && PASSED[subtest];
      });
      return passed;
    }

/*/ sets the PASSED object keys to enable/disable tests prior to running
/*/ function m_ConfigureTestFlags ( testname, flag ) {
      if (flag===undefined) throw "arg2 flag must be true to enable, false to disable";
      if (flag===false) flag=null;
      let subtests;
      switch (testname) {
        case 'state':
          subtests = {
            stateChange       : flag
          };
          break;
        case 'hook':
          subtests = {
            startHook         : flag,
            initHook1         : flag,
            initHook2         : flag,
            initHookDeferred  : flag
          };
          break;
        case 'local':
          subtests = {
            callRegInvoke     : flag,
            callData          : flag,
            callDataProp      : flag,

            localCall         : flag,
            localData         : flag,
            localDataAdd      : flag,
            localMultiCall    : flag
          };
          break;
        case 'remote':
          subtests = {
            remoteCall        : flag,
            remoteData        : flag,
            remoteDataAdd     : flag
          };
          break;
        case 'net':
          subtests = {
            netCall           : flag,
            netData           : flag,
            netDataAdd        : flag,
            netMultCall       : flag
          }
          break;
        default:
          throw `Unknown test "${testname}"`
      } // end switch
      Object.assign(PASSED,subtests);
      if (DBG) console.log('New PASSED',Object.keys(PASSED).length,PASSED);
    }



/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = TM;
