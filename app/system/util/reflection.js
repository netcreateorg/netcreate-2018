/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Reflection and other Object Inspection Utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const STACKTRACE = require('stacktrace-js');
const PATH       = require('./path');

/// INITIALIZE MAIN MODULE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var   REFLECT    = {};

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Returns the name of the constructor for the current class
    https://stackoverflow.com/questions/22777181/typescript-get-to-get-class-name-at-runtime
/*/ REFLECT.ExtractClassName = function( obj ) {
       var funcNameRegex = /function (.{1,})\(/;
       var results = (funcNameRegex).exec((obj).constructor.toString());
       return (results && results.length > 1) ? results[1] : "";
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Returns the name of the calling function
/*/ REFLECT.FunctionName = function( depth=1 ) {
      let stack = STACKTRACE.getSync();
      let frame = stack[depth];
      let fn = frame.functionName;
      if (!fn) {
        fn = PATH.Basename(frame.fileName);
        fn += `:${frame.lineNumber}:${frame.columnNumber}`;
        return fn;
      } else {
        let bits = fn.split('.');
        return `method ${bits[1]}() called by module ${bits[0]}`;
      }
    };
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ InspectModule() prints a list of public properties and methods for each
    require module that contains the passed string. It returns a string, so
    you will have to console.log() to see the output.
/*/ REFLECT.InspectModule = function ( str ) {
    throw Error(`REFLECT.InspectModule() needs to be rewritten for brunch-style modules.`);
    var rm = require.s.contexts._.defined;
    var mlist = [];
    var base = '1401/';
    if (str===undefined) str = base;
    str = (typeof str==='string') ? str : base;

    Object.keys(rm).forEach(function(key) {
      var name = key.toString();
      if (name.indexOf(str)>=0) {
        mlist.push(key);
      }
    });

    var out = '\n';
    for (var i=0; i<mlist.length; i++) {
      var objName = mlist[i];
      out += objName+'\n';
      if (str!==base) {
        out+= "-----\n";
        var mod = rm[objName];
        out += m_DumpObj(mod);
        out += '\n';
      }
    }
    if (mlist.length) {
      console.log(out);
      return mlist.length + ' modules listed';
    } else {
      return "module " +str.bracket()+" not found";
    }
  };
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ InspectObject() accepts an object and a label, and prints a list of
    all the methods and properties in it. It returns a string, so you will
    have to console.log() to see the output.
/*/ REFLECT.InspectObject = function ( obj, depth ) {
    if (!obj) return "Must pass an object or 1401 watched object key string";

    var out = "";
    // handle command line calls
    switch (typeof obj) {
      case 'object':
      case 'function':
        break;
      default:
        return "must pass object or function, not "+(typeof obj);
    }

    // handle recursive scan
    depth = depth || 0;
    var label = obj.constructor.name || '(anonymous object)';
    var indent = "";
    for (var i=0; i<=depth; i++) indent+='\t';
    out+= label+'\n';
    out+= "\n";
    out += m_DumpObj(obj, depth+1);
    var proto = Reflect.getPrototypeOf(obj);
    if (proto) {
      out += "\n"+indent+"IN PROTO: ";
      out += this.InspectObject(proto,depth+1);
      out += "\n";
    }
    if (depth===0) out = '\n'+out;
    console.log(out);
    return obj;
  };


/** SUPPORTING FUNCTIONS ****************************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Support function for InspectModule() and InspectObject()
    Also checks m_watching array
/*/ function m_DumpObj ( obj, depth ) {
    var indent = "";
    for (var i=0; i<depth; i++) indent+='\t';

    var str = "";
    Object.keys(obj).forEach(function(key) {
      var prop = obj[key];
      var type = typeof prop;
      str += indent;
      str += type + '\t'+key;
      switch (type) {
        case 'function':
          var regexp = /function.*\(([^)]*)\)/;
          var args = regexp.exec(prop.toString());
          str+= ' ('+args[1]+')';
          break;
        default:
          break;
      }
      str += '\n';
    });
    return str;
  }



/** GLOBAL HOOKS *************************************************************/

if (typeof window === 'object') {
  window.InspectModule = REFLECT.InspectModule;
  window.InspectObject = REFLECT.InspectObject;
  window.DBG_Out = function ( msg, selector ) {
    REFLECT.Out(msg,false, selector);
  };
  window.DBG_OutClean = function ( msg, selector ) {
    REFLECT.Out(msg,true,selector);
  };
}


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = REFLECT;
