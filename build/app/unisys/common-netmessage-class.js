/** NetMessage ****************************************************************\

  NetMessage objects are sent between the browser and server as part of the
  UNISYS messaging system. Unlike NetMessages of the previous version of STEP,
  a NetMessage does not require addressing since the SERVER distributes
  messages to UNISYS addresses that have registered for them.

  The NetMessage declaration is shared in both node and browser javascript
  codebases.

  NetMessages also provide the data context for "transactions" of calls.
  The netmessage_id and data packet are used by the originating webapp
  to remember a sequence of callback functions. When a NetMessage is
  received with a seq_num > 0, it's assumed to be a return transaction,
  and its callback chain can be invoked. The data is forwarded to the
  callback. For more details, see the CallSequence class that manages
  the passing of data.

////////////////////////////////////////////////////////////////////////////////
/** MODULE DECLARATIONS *******************************************************/

const DBG = { send: false, transact: false };

var m_id_counter = 0;
var m_id_prefix = "PKT";
var m_transactions = {};
var m_netsocket = null;
var m_group_id = null;

// constants
const PROMPTS = require("../system/util/prompts");
const PR = PROMPTS.Pad("PKT");
const ERR = ":ERR:";
const ERR_NOT_NETMESG = ERR + PR + "obj does not seem to be a NetMessage";
const ERR_BAD_PROP = ERR + PR + "property argument must be a string";
const ERR_ERR_BAD_CSTR = ERR + PR + "constructor args are string, object";
const ERR_BAD_SOCKET = ERR + PR + "sender object must implement send()";
const ERR_DUPE_TRANS =
  ERR + PR + "this packet transaction is already registered!";
const ERR_NO_GLOB_UADDR =
  ERR + PR + "packet sending attempted before UADDR is set!";
const ERR_UNKNOWN_TYPE = ERR + PR + "packet type is unknown:";
const ERR_NOT_PACKET = ERR + PR + "passed object is not a NetMessage";
const ERR_UNKNOWN_RMODE = ERR + PR + "packet routine mode is unknown:";
const KNOWN_TYPES = ["msend", "msig", "mcall", "state"];
const ROUTING_MODE = ["req", "res"];

/// UNISYS NETMESSAGE CLASS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ A UNetMessage encapsulates a specific message and data payload for sending
    across the network.
/*/
class NetMessage {
  constructor(msg, data, type) {
    // OPTION 1
    // create NetMessage from (generic object)
    if (typeof msg === "object" && data === undefined) {
      // make sure it has a msg and data obj
      if (typeof msg.msg !== "string" || typeof msg.data !== "object")
        throw ERR_NOT_NETMESG;
      // merge properties into this new class instance and return it
      Object.assign(this, msg);
      m_SeqIncrement(this);
      return this;
    }
    // OPTION 2
    // create NetMessage from JSON-encoded string
    if (typeof msg === "string" && data === undefined) {
      let obj = JSON.parse(msg);
      Object.assign(this, obj);
      m_SeqIncrement(this);
      return this;
    }
    // OPTION 3
    // create new NetMessage from scratch (mesg,data)
    // unique id for every NetMessage
    if (typeof type === "string") m_CheckType(type);
    if (typeof msg !== "string" || typeof data !== "object")
      throw ERR_ERR_BAD_CSTR;
    // allow calls with null data by setting to empty object
    this.data = data || {};
    this.msg = msg;
    // id and debugging memo support
    this.id = this.MakeNewID();
    this.rmode = ROUTING_MODE[0]; // is default 't_req' (trans request)
    this.type = type || KNOWN_TYPES[0]; // is default 'msend' (no return)
    this.memo = "";
    // transaction support
    this.seqnum = 0; // positive when part of transaction
    this.seqlog = []; // transaction log
    // addressing support
    this.s_uaddr = NetMessage.SocketUADDR() || null; // first originating uaddr set by SocketSend()
    this.s_group = null; // session groupid is set by external module once validated
    this.s_uid = null; // first originating UDATA srcUID
    // filtering support
  } // constructor

  /// ACCESSSOR METHODS ///////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ returns the type
  /*/
  Type() {
    return this.type;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ returns true if type matches
  /*/
  IsType(type) {
    return this.type === type;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ returns the type
  /*/
  SetType(type) {
    this.type = m_CheckType(type);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ returns the message
  /*/
  Message() {
    return this.msg;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ sets the message field
  /*/
  SetMessage(msgstr) {
    this.msg = msgstr;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ returns the entire data payload or the property within the data payload
      (can return undefined if property doesn't exist)
  /*/
  Data(prop) {
    if (!prop) return this.data;
    if (typeof prop === "string") return this.data[prop];
    throw ERR_BAD_PROP;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ convenience method to set data object entirely
  /*/
  SetData(propOrVal, val) {
    if (typeof propOrVal === "object") {
      this.data = propOrVal;
      return;
    }
    if (typeof propOrVal === "string") {
      this.data[propOrVal] = val;
      return;
    }
    throw ERR_BAD_PROP;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ returns truthy value (this.data) if the passed msgstr matches the
      message associated with this NetMessage
  /*/
  Is(msgstr) {
    return msgstr === this.msg ? this.data : undefined;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ convenience function return true if server message
  /*/
  IsServerMessage() {
    return this.msg.startsWith("SRV_");
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ getter/setter for the memo description field
  /*/
  Memo() {
    return this.memo;
  }
  SetMemo(memo) {
    this.memo = memo;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ convenience function to return JSON version of this object
  /*/
  JSON() {
    return JSON.stringify(this);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ return the session groupid (CLASS-PROJ-HASH) that's been set globally
  /*/ SourceGroupID() {
    return this.s_group;
  }

  /// TRANSACTION SUPPORT /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ The sequence number is positive if this packet is reused
  /*/
  SeqNum() {
    return this.seqnum;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Return the originating address of this netmessage packet. It is valid
      only after the packet has been sent at least once.
  /*/
  SourceAddress() {
    // is this packet originating from server to a remote?
    if (
      this.s_uaddr === NetMessage.DefaultServerUADDR() &&
      !this.msg.startsWith("SVR_")
    ) {
      return this.s_uaddr;
    }
    // this is a regular message forward to remote handlers
    return this.IsTransaction() ? this.seqlog[0] : this.s_uaddr;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  CopySourceAddress(pkt) {
    if (pkt.constructor.name !== "NetMessage") throw Error(ERR_NOT_PACKET);
    this.s_uaddr = pkt.SourceAddress();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ return an informational string about the packet useful for logging
  /*/
  Info(key) {
    switch (key) {
      case "src": /* falls-through */
      default:
        return this.SourceGroupID()
          ? `${this.SourceAddress()} [${this.SourceGroupID()}]`
          : `${this.SourceAddress()}`;
    }
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  MakeNewID() {
    let idStr = (++m_id_counter).toString();
    this.id = m_id_prefix + idStr.padStart(5, "0");
    return this.id;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Send packet on either provided socket or default socket. Servers provide
      the socket because it's handling multiple sockets from different clients.
  /*/
  SocketSend(socket = m_netsocket) {
    this.s_group = NetMessage.GlobalGroupID();
    let dst = socket.UADDR || "unregistered socket";
    if (!socket) throw Error("SocketSend(sock) requires a valid socket");
    if (DBG.send) {
      let status = `sending '${this.Message()}' to ${dst}`;
      console.log(PR, status);
    }
    socket.send(this.JSON());
    // FYI: global m_netsocket is not defined on server, since packets arrive on multiple sockets
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Create a promise to resolve when packet returns
  /*/
  QueueTransaction(socket = m_netsocket) {
    // global m_netsocket is not defined on server, since packets arrive on multiple sockets
    if (!socket) throw Error("QueueTransaction(sock) requires a valid socket");
    // save our current UADDR
    this.seqlog.push(NetMessage.UADDR);
    let dbg = DBG.transact && !this.IsServerMessage();
    let p = new Promise((resolve, reject) => {
      var hash = m_GetHashKey(this);
      if (m_transactions[hash]) {
        reject(Error(ERR_DUPE_TRANS + ":" + hash));
      } else {
        // save the resolve function in transactions table;
        // promise will resolve on remote invocation with data
        m_transactions[hash] = function(data) {
          if (dbg)
            console.log(PR, "resolving promise with", JSON.stringify(data));
          resolve(data);
        };
        this.SocketSend(socket);
      }
    });
    return p;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ return the 'routing mode':
        req/res is request/reply (message requests and optional response)
        f_req/f_res is forwarded request/reply (forwarded messages and optional return)
        the f_res is converted to res and sent back to original requester
  /*/
  RoutingMode() {
    return this.rmode;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  IsRequest() {
    return this.rmode === "req";
  }
  IsOwnResponse() {
    return this.rmode === "res";
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /*/ If this packet is a returned transaction, then return true
  /*/
  IsTransaction() {
    return (
      this.rmode !== ROUTING_MODE[0] &&
      this.seqnum > 0 &&
      this.seqlog[0] === NetMessage.UADDR
    );
  }
  ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/	update the sequence metadata and return on same socket
  /*/
  ReturnTransaction(socket = m_netsocket) {
    // global m_netsocket is not defined on server, since packets arrive on multiple sockets
    if (!socket) throw Error("ReturnTransaction(sock) requires a valid socket");
    // note: seqnum is already incremented by the constructor if this was
    // a received packet
    // add this to the sequence log
    this.seqlog.push(NetMessage.UADDR);
    this.rmode = m_CheckRMode("res");
    this.SocketSend(socket);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ If this is a transaction packet that is returned, then execute the stored
      resolver function from the promise stored in m_transactions, which will
      then trigger .then() following any calls
  /*/
  CompleteTransaction() {
    let dbg = DBG.transact && !this.IsServerMessage();
    var hash = m_GetHashKey(this);
    var resolverFunc = m_transactions[hash];
    if (dbg) console.log(PR, "CompleteTransaction", hash);
    if (typeof resolverFunc !== "function") {
      throw Error(
        `transaction [${hash}] resolverFunction is type ${typeof resolverFunc}`
      );
    } else {
      resolverFunc(this.data);
      Reflect.deleteProperty(m_transactions[hash]);
    }
  }
} // class NetMessage

/// STATIC CLASS METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ set the NETWORK interface object that implements Send()
/*/
NetMessage.GlobalSetup = function(config) {
  let { netsocket, uaddr } = config;
  if (uaddr) NetMessage.UADDR = uaddr;
  // NOTE: m_netsocket is set only on clients since on server, there are multiple sockets
  if (netsocket) {
    if (typeof netsocket.send !== "function") throw ERR_BAD_SOCKET;
    m_netsocket = netsocket;
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ cleanup any allocated storage
/*/
NetMessage.GlobalCleanup = function() {
  if (m_netsocket) {
    console.log(PR, "GlobalCleanup: deallocating netsocket");
    m_netsocket = null;
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ return the address (socket_id) assigned to this app instance
/*/
NetMessage.SocketUADDR = function() {
  return NetMessage.UADDR;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return a default server UADDR
/*/
NetMessage.DefaultServerUADDR = function() {
  return "SVR_01";
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return current SessionID string
/*/
NetMessage.GlobalGroupID = function() {
  return m_group_id;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NetMessage.GlobalSetGroupID = function(token) {
  m_group_id = token;
};

/// PRIVATE CLASS HELPERS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ when a packet is reconstructed from an existing object or json string,
    its sequence number is incremented, and the old source uaddr is pushed
    onto the seqlog stack.
/*/
function m_SeqIncrement(pkt) {
  pkt.seqnum++;
  return pkt;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	return the hash used for storing transaction callbacks
/*/
function m_GetHashKey(pkt) {
  let hash = `${pkt.SourceAddress()}:${pkt.id}`;
  return hash;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ is this an allowed type? throw error if not
/*/
function m_CheckType(type) {
  if (type === undefined)
    throw new Error("must pass a type string, not " + type);
  if (!KNOWN_TYPES.includes(type)) throw `${ERR_UNKNOWN_TYPE} '${type}'`;
  return type;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ is this an allowed mode? throw error if not
/*/
function m_CheckRMode(mode) {
  if (mode === undefined)
    throw new Error("must pass a mode string, not " + mode);
  if (!ROUTING_MODE.includes(mode)) throw `${ERR_UNKNOWN_RMODE} '${mode}'`;
  return mode;
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NetMessage;
