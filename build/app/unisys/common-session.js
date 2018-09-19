/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Session Utilities
    collection of session-related data structures

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// DEBUGGING /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
//
const PROMPTS     = require('system/util/prompts');
const PR          = PROMPTS.Pad('SESSUTIL');
const JSCLI       = require('system/util/jscli');

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SETTINGS    = require('settings');
const HashIds     = require('hashids');

/// MODULE DEFS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let   SESUTIL     = {};
const HASH_ABET   = 'ABCDEFGHIJKLMNPQRSTVWXYZ23456789';
const HASH_MINLEN = 3;

/// PRE-HOOK DECLARATIONS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
JSCLI.AddFunction( function ncMakeTokens (clsId, projId, numGroups ) {
  return SESUTIL.MakeTokenList(clsId,projId,numGroups);
});

/// SESSION ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Given a token of form CLASS-PROJECT-HASHEDID, return an object
    containing as many decoded values as possible. Check isValid for
    complete decode succes. groupId is also set if successful
/*/ SESUTIL.DecodeToken = function ( token ) {
      if (token===undefined) return undefined;
      let tokenBits = token.split('-');
      let classId, projId, hashedId, groupId, isValid;
      // optimistically set valid flag to be negated on failure
      isValid = true;
      // token is of form CLS-PRJ-HASHEDID
      // classId, etc will be partially set and returned
      if (tokenBits[0]) classId  = tokenBits[0].toUpperCase();
      if (tokenBits[1]) projId   = tokenBits[1].toUpperCase();
      if (tokenBits[2]) hashedId = tokenBits[2].toUpperCase();
      // initialize hashid structure
      let salt      = `${classId}${projId}`;
      let hashids   = new HashIds(salt,HASH_MINLEN,HASH_ABET);
      // try to decode the groupId
      groupId   = hashids.decode(hashedId)[0];
      // invalidate if groupId isn't an integer
      if (!Number.isInteger(groupId)) {
        if (DBG) console.error('invalid token');
        isValid = false;
      }
      // invalidate if groupId isn't non-negative integer
      if (groupId<0) {
        if (DBG) console.error('decoded token, but value out of range <0');
        isValid = false;
      }
      //
      let decoded = { isValid, classId, projId, hashedId, groupId };
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
      if (classId.length<1) throw Error(`classId arg1 length should be 1 or more`);
      if (projId.length<1) throw Error(`projId arg2 length should be 1 or more`);
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

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Command: RESET THE DATABASE from default data
/*/ SESUTIL.MakeTokenList = function ( clsId, projId, numGroups ) {
      // type checking
      if (typeof clsId!=='string') return "args: str classId, str projId, int numGroups"
      if (typeof projId!=='string') return "args: str classId, str projId, int numGroups"
      if (clsId.length>12) return "classId arg1 should be 12 chars or less";
      if (projId.length>12) return "classId arg1 should be 12 chars or less";
      if (!Number.isInteger(numGroups)) return "numGroups arg3 must be integer";
      if (numGroups<1) return "numGroups arg3 must be positive integeger";
      // let's do this!
      let out = `\nTOKEN LIST for class '${clsId}' project '${projId}'\n\n`;
      let pad = String(numGroups).length;
      for (let i=1; i<=numGroups; i++) {
        let id = String(i).padStart(pad,' ');
        out += `group ${id} - ${SESUTIL.MakeToken(clsId,projId,i)}\n`;
      }
      let ubits = new URL(window.location);
      let hash = ubits.hash.split('/')[0];
      let url = `${ubits.protocol}//${ubits.host}/${hash}`;
      out += `\nexample url: ${SETTINGS.ServerAppURL()}/${SESUTIL.MakeToken(clsId,projId,1)}\n`;
      return out;
    }

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = SESUTIL;
