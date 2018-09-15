/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    SESSIONUTILS

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = true;

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS     = require('system/util/prompts');
const PR          = PROMPTS.Pad('SESSUTIL');
const HashIds     = require('hashids');

/// MODULE DEFS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let   SESUTIL     = {};
const HASH_ABET   = 'ABCDEFGHIJKLMNPQRSTVWXYZ23456789';
const HASH_MINLEN = 3;

/// SESSION ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Given a token of form CLASS-PROJECT-HASHEDID, return an object
    containing the decoded values if they are all valid, undefined otherwise
/*/ SESUTIL.DecodeToken = function ( token ) {
      let tokenBits = token.split('-');
      // token is of form CLS-PRJ-HASHEDID
      if (tokenBits.length!==3) {
        console.error('expected 3 parts, got',tokenBits.length);
        return undefined;
      }
      let classId   = tokenBits[0].toUpperCase();
      let projId    = tokenBits[1].toUpperCase();
      let hashedId  = tokenBits[2].toUpperCase();
      // initialize hashid structure
      let salt      = `${classId}${projId}`;
      let hashids   = new HashIds(salt,HASH_MINLEN,HASH_ABET);
      let groupId   = hashids.decode(hashedId)[0];
      // return undefined if groupId isn't an acceptable integer
      if (!Number.isInteger(groupId)) {
        console.error('invalid token');
        return undefined;
      }
      if (groupId<0) {
        console.error('decoded token, but value out of range <0');
        return undefined;
      }
      // booyah, it's a valid token!
      let decoded = { classId, projId, groupId };
      return decoded;
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return TRUE if the token decodes into an expected range of values
/*/ SESUTIL.IsValidToken = function ( token ) {
      let decoded = SESUTIL.DecodeToken(token);
      return (decoded && Number.isInteger(decoded.groupId));
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Returns a token string of form CLASS-PROJECT-HASHEDID
    classId and projId should be short and are case-insensitive.
    groupId must be a non-negative integer
/*/ SESUTIL.MakeToken = function ( classId, projId, groupId ) {
      // type checking
      if (typeof classId!=='string') throw Error(`classId arg1 '${classId}' must be string`);
      if (typeof projId!=='string') throw Error(`projId arg2 '${projId}' must be string`);
      if (classId.length<2) throw Error(`classId arg1 length should be 1 or more`);
      if (projId.length<2) throw Error(`projId arg2 length should be 1 or more`);
      if (!Number.isInteger(groupId)) throw Error(`groupId arg3 '${groupId}' must be integer`);
      if (groupId<0) throw Error(`groupId arg3 must be non-negative integer`);
      if (groupId>Number.MAX_SAFE_INTEGER) throw Error(`groupId arg3 value exceeds MAX_SAFE_INTEGER`);
      // initialize hashid structure
      classId = classId.toUpperCase();
      projId = projId.toUpperCase();
      let salt     = `${classId}${projId}`;
      let hashids  = new HashIds(salt,HASH_MINLEN,HASH_ABET);
      let hashedId = hashids.encode(groupId);
      return `${classId}-${projId}-${hashedId}`;
    }

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = SESUTIL;
