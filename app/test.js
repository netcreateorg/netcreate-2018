if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  TEST

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

let DBG = false;

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** list of tests that are allowed to run
 */
let TESTS = {
  call: false, // unisys calls
  state: false, // unisys state manager
  hook: false, // unisys lifecycle hooks
  remote: false, // unisys 'remote' calls to other module
  net: false, // network connection to socket server
  server: false // unisys 'server implemented' calls
};
/** groups of tests to run
 */
let PASSED = {};
let TEST_GO = false;
/** pairs of arrays to match (array of arrays)
 */
let ARR_MATCH = [];
let PR = 'TEST:';
let m_meta_info = {};

let E_SHELL, E_OUT, E_HEADER;
let m_failed = [];
let m_skipped = [];
let m_passed = [];

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Main TEST ENABLE
    pass the testname (as listed in TESTS) and either true or false)
 */
let TM = (testname, flag) => {
  if (testname === undefined) {
    console.warn(
      `${PR} %cConfigured and Active`,
      `color:red;background-color:yellow`
    );
    TEST_GO = true;
    return true;
  }
  if (typeof testname !== 'string') throw 'arg1 must be a testname';
  if (!TESTS[testname]) throw `"${testname}" is not a valid testname`;
  if (DBG) console.log(PR, 'TM', testname, flag || '');
  if (flag === undefined) {
    if (!TEST_GO) console.error(`${PR} Test Switch read before testing started`);
    let setting = TESTS[testname];
    return setting;
  } else {
    TESTS[testname] = flag;
    m_ConfigureTestFlags(testname, flag);
    return flag;
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TM.SetTitle = function (text) {
  E_HEADER.innerText = text;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TM.SetMeta = function (meta, value) {
  if (typeof meta === 'string') {
    let obj = {};
    obj[meta] = value;
    meta = obj;
  }
  if (typeof meta === 'object') {
    Object.assign(m_meta_info, meta);
  } else {
    throw Error('SetMeta() expected either object or string,value');
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TM.MetaString = function () {
  let o = '';
  let e = Object.entries(m_meta_info).forEach(([k, v]) => {
    o += `${k}:${v} `;
  });
  return o;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: pass the particular subtest
 */
TM.Pass = function (subtest) {
  m_InitShell();
  // initialize tests
  if (DBG) console.log(`${PR} %cPass %c${subtest}`, 'color:green', 'color:black');
  if (PASSED[subtest]) {
    if (PASSED[subtest]) ++PASSED[subtest];
    else PASSED[subtest] = 1;
  } else {
    throw Error(`Unknown subtest: ${subtest}`);
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: fail the particular subtest
 */
TM.Fail = function (subtest) {
  m_InitShell();
  if (DBG) console.error(`${PR} %cFail ${subtest}`, 'color:red;font-weight:bold');
  if (PASSED[subtest]) {
    // 'null' for 'condition succeed' tests
    // '0' for 'no error detected' tests
    let flag = PASSED[subtest];
    if (typeof flag === 'string') {
      // this has already failed with error
      PASSED[subtest] = flag + '+';
      return;
    }
    if (flag === null) return; // null flag are skipped
    if (flag === 0) {
      PASSED[subtest] = -1; // failed once
      return;
    }
    if (flag <= 0) {
      --PASSED[subtest]; // multiple failures
      return;
    }
    // bizarre 'succeeded but now failed'
    if (flag > 0) {
      PASSED[subtest] = `succeeded ${flag} times, then failed`;
      return;
    }
  }
  throw Error(`Unknown subtest: ${subtest}`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: check if the particular subtests passed have indeed passed
 */
TM.Passed = function (...args) {
  if (DBG) console.log(PR, 'Passed');
  let passed = true;
  args.forEach(subtest => {
    if (!PASSED[subtest]) throw `"${subtest}" is not valid subtest`;
    passed = passed && PASSED[subtest];
  });
  return passed;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: output test results
 */
TM.Assess = function () {
  if (DBG) console.log(PR, 'Assess');
  m_failed = [];
  m_skipped = [];
  m_passed = [];
  m_PreTest();
  m_TestResults();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: assess whether passed arrays match during Assess function()
 */
TM.AssessArrayMatch = function (subtest, arr1, arr2) {
  if (DBG) console.log(PR, 'AssessArrayMatch');
  ARR_MATCH.push([subtest, arr1, arr2]);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return TRUE if there were no failing tests in the last test.
    Call TM.Assess() again to retest
 */
TM.AllPassed = function () {
  return m_failed.length !== 0;
};

/// TEST FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** sets the PASSED object keys to enable/disable tests prior to running
 */
function m_ConfigureTestFlags(testname, flag) {
  if (flag === undefined) throw 'arg2 flag must be true to enable, false to disable';
  // the subtest value must be set to false first
  // to skip tests, the subtest value is set to null
  if (flag === false) flag = null;
  if (flag === true) flag = false;
  // set subtest flags
  let subtests;
  switch (testname) {
    case 'state':
      subtests = {
        stateChange: flag,
        stateMerge: flag,
        stateConcat: flag
      };
      break;
    case 'hook':
      subtests = {
        hookInit1: flag,
        hookInit2: flag,
        hookInitDeferred: flag,
        hookStart: flag
      };
      break;
    case 'call':
      subtests = {
        callHndlrReg: flag,
        callHndlrData: flag,
        callHndlrDataProp: flag,
        callDataReturn: flag,
        callDataAdd: flag,
        callDataMulti: flag
      };
      break;
    case 'remote':
      subtests = {
        remoteCall: flag,
        remoteData: flag,
        remoteData2: flag,
        remoteDataReturn: flag,
        remoteDataAdd: flag,
        remoteDataMulti: flag
      };
      break;
    case 'server':
      subtests = {
        serverCall: flag,
        serverCallOrder: flag,
        serverReturn: flag,
        serverData: flag,
        serverDataAdd: flag
      };
      break;
    case 'net':
      subtests = {
        netMessageReg: flag,
        netCallHndlr: flag,
        netSendHndlr: flag,
        netSendNoEcho: 0, // if this stays 0, then NOERR has passed
        netSignal: flag,
        netSignalEcho: flag,
        netData: flag,
        netDataReturn: flag,
        netDataAdd: flag,
        //          netDataGather     : flag,
        netDataMulti: flag
      };
      break;
    default:
      throw `Unknown test "${testname}"`;
  } // end switch
  Object.assign(PASSED, subtests);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_PreTest() {
  // test arrays
  ARR_MATCH.forEach(function (pair) {
    let pass = true;
    let subtest = pair[0];
    let arr1 = pair[1];
    let arr2 = pair[2];
    pass = pass && arr1.length === arr2.length;
    for (let i = 0; i < arr1.length; i++) {
      pass = pass && arr1[i] === arr2[i];
    }
    if (pass) TM.Pass(subtest);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** prints the test output to console
 */
function m_TestResults() {
  m_ShowShell();
  // check all test results
  let pEntries = Object.entries(PASSED);
  let padding = 0;
  // find longest string
  pEntries.forEach(([key, value]) => {
    if (key.length > padding) padding = key.length;
  });
  // scan test results
  pEntries.forEach(([key, value]) => {
    let res = '';
    if (value === null) {
      // res = `${(key).padEnd(padding)} [ ]\n`;
      m_skipped.push(res);
    } else
      switch (typeof value) {
        case 'number':
          if (value >= 1) {
            if (value === 1) res = `${key.padEnd(padding)} [OK]\n`;
            if (value > 1) res = `${key.padEnd(padding)} [OK] x ${value}\n`;
            m_passed.push(res);
          } else {
            if (value === 0) {
              res = `${key.padEnd(padding)} [NP]\n`;
              m_passed.push(res);
            }
            if (value === -1) {
              res = `${key.padEnd(padding)} [!!] FAIL\n`;
              m_failed.push(res);
            }
            if (value < -1) {
              res = `${key.padEnd(padding)} [!!] FAIL x ${-value}\n`;
              m_failed.push(res);
            }
          }
          break;
        case 'boolean':
          if (value) {
            res = `${key.padEnd(padding)} [OK]\n`;
            m_passed.push(res);
          } else {
            res = `${key.padEnd(padding)} [!!] FAIL\n`;
            m_failed.push(res);
          }
          break;
        default:
          m_passed.push(`${key.padEnd(padding)} [OK] '${value}'\n`);
          break;
      } // switch typeof value
  }); // pEntries.forEach

  let testTitle = 'UNISYS LOGIC TEST RESULTS';
  console.group(testTitle);
  let out = m_passed.concat(m_failed, m_skipped).join('');

  // additional help
  let tnotes = '';
  if (!TM.Passed('netCallHndlr'))
    tnotes += `NOTE: 'netCallHndlr' requires a synched remote app to call-in\n`;
  if (!TM.Passed('netSendHndlr'))
    tnotes += `NOTE: 'netSendHndlr' requires a synched remote app to call-in\n`;
  if (!TM.Passed('netData'))
    tnotes += `NOTE: 'netData*' requires a synched remote app to respond to call-out\n`;
  if (tnotes) out += '\n' + tnotes;

  // summary
  let summary = `${m_passed.length}=passed`;
  if (m_failed.length) summary += ` ${m_failed.length}=failed`;
  if (m_skipped.length) summary += ` ${m_skipped.length}=skipped`;
  console.log(`${out}\n${summary}`);
  TM.SetTitle(`${testTitle} ${TM.MetaString()}`);
  E_OUT.innerText = `${summary}\n\n`;
  E_OUT.innerText += 'OPEN JAVASCRIPT CONSOLE TO SEE DETAILS\n';
  E_OUT.innerText += 'Mac shortcuts to open console\n';
  E_OUT.innerText += '  Chrome  : cmd-option-j\n';
  E_OUT.innerText += '  Firefox : cmd-option-k\n';
  E_OUT.innerText += 'PC use ctrl-shift instead\n';
  console.groupEnd();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initialize the shell user interface for test results as elements, but
    don't yet link them because component may not have rendered yet
 */
function m_InitShell() {
  if (!E_OUT) {
    E_OUT = document.createElement('pre');
    E_HEADER = document.createElement('h4');
    E_HEADER.innerText = 'RUNNING TESTS ';
    E_OUT.innerText = '.';
  } else {
    E_OUT.innerText += '.';
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ show the shell elements by finding root div and appending them
/*/ function m_ShowShell() {
  E_SHELL = document.getElementById('fdshell');
  E_SHELL.appendChild(E_HEADER);
  E_SHELL.appendChild(E_OUT);
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = TM;
