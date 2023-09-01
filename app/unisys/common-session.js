/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Session Utilities
  collection of session-related data structures

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// DEBUGGING /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
//
const PROMPTS = require('../system/util/prompts');
const PR = PROMPTS.Pad('SESSUTIL');

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const HashIds = require('hashids');

/// MODULE DEFS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let SESUTIL = {};
const HASH_ABET = 'ABCDEFGHIJKLMNPQRSTVWXYZ23456789';
const HASH_MINLEN = 3;
var m_current_groupid = null;

/// SESSION ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Given a token of form CLASS-PROJECT-HASHEDID, return an object
    containing as many decoded values as possible. Check isValid for
    complete decode succes. groupId is also set if successful
 */
SESUTIL.DecodeToken = function (token, dataset) {
  if (token === undefined) return {};
  if (dataset === undefined) {
    console.error('SESUTIL.DecodeToken called without "dataset" parameter.');
    return {};
  }
  let tokenBits = token.split('-');
  let classId, projId, hashedId, groupId, subId, isValid;
  // optimistically set valid flag to be negated on failure
  isValid = true;
  // check for superficial issues
  if (token.substr(-1) === '-') {
    isValid = false;
  }
  // token is of form CLS-PRJ-HASHEDID
  // classId, etc will be partially set and returned
  if (tokenBits[0]) classId = tokenBits[0].toUpperCase();
  if (tokenBits[1]) projId = tokenBits[1].toUpperCase();
  if (tokenBits[2]) hashedId = tokenBits[2].toUpperCase();
  if (tokenBits[3]) subId = tokenBits[3].toUpperCase();
  // initialize hashid structure
  let salt = `${classId}${projId}${dataset}`;
  try {
    let hashids = new HashIds(salt, HASH_MINLEN, HASH_ABET);
    // try to decode the groupId
    groupId = hashids.decode(hashedId)[0];
  } catch (err) {
    console.log('SESUTIL.DecodeToken: invalid token');
  }
  // invalidate if groupId isn't an integer
  if (!Number.isInteger(groupId)) {
    if (DBG) console.error('invalid token');
    isValid = false;
    groupId = 0;
  }
  // invalidate if groupId isn't non-negative integer
  if (groupId < 0) {
    if (DBG) console.error('decoded token, but value out of range <0');
    isValid = false;
    groupId = 0;
  }

  // at this point groupId is valid (begins with ID, all numeric)
  // check for valid subgroupId
  if (subId) {
    if (
      subId.length > 2 &&
      subId.indexOf('ID') === 0 &&
      /^\d+$/.test(subId.substring(2))
    ) {
      if (DBG) console.log('detected subid', subId.substring(2));
      // subId contains a string "ID<N>" where <N> is an integer
    } else {
      // subId exists but didn't match subid format
      if (DBG) console.log('invalid subId string', subId);
      isValid = false; // groupId is still valid,
      subId = 0;
    }
  }

  // if isValid is false, check groupId is 0 or subId is 0, indicating error
  let decoded = { token, isValid, classId, projId, hashedId, groupId, subId };
  return decoded;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return TRUE if the token decodes into an expected range of values
 */
SESUTIL.IsValidToken = function (token, dataset) {
  let decoded = SESUTIL.DecodeToken(token, dataset);
  return decoded && Number.isInteger(decoded.groupId);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns a token string of form CLASS-PROJECT-HASHEDID
    classId and projId should be short and are case-insensitive.
    groupId must be a non-negative integer
 */
SESUTIL.MakeToken = function (classId, projId, groupId, dataset) {
  // type checking
  if (typeof classId !== 'string')
    throw Error(`classId arg1 '${classId}' must be string`);
  if (typeof projId !== 'string')
    throw Error(`projId arg2 '${projId}' must be string`);
  if (classId.length < 1) throw Error(`classId arg1 length should be 1 or more`);
  if (projId.length < 1) throw Error(`projId arg2 length should be 1 or more`);
  if (!Number.isInteger(groupId))
    throw Error(`groupId arg3 '${groupId}' must be integer`);
  if (groupId < 0) throw Error(`groupId arg3 must be non-negative integer`);
  if (groupId > Number.MAX_SAFE_INTEGER)
    throw Error(`groupId arg3 value exceeds MAX_SAFE_INTEGER`);
  // initialize hashid structure
  classId = classId.toUpperCase();
  projId = projId.toUpperCase();
  let salt = `${classId}${projId}${dataset}`;
  let hashids = new HashIds(salt, HASH_MINLEN, HASH_ABET);
  let hashedId = hashids.encode(groupId);
  return `${classId}-${projId}-${hashedId}`;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Set the global GROUPID, which is included in all NetMessage
    packets that are sent to server.
 */
// REVIEW/FIXME
// `SetGroupID` isn't being called by anyone?
// If it is, the DecodeToken call needs to add a 'dataset' parameter or it will
// fail.
SESUTIL.SetGroupID = function (token) {
  console.error('SetGroupID calling decodeToken NC_CONFIG IS', window.NC_CONFIG);
  let good = SESUTIL.DecodeToken(token).isValid;
  if (good) m_current_groupid = token;
  return good;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SESUTIL.GroupID = function () {
  return m_current_groupid;
};

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = SESUTIL;
