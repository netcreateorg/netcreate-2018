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

  const DBG = true;

  var m_id_counter    = 0;
  var m_id_prefix     = 'NM';
  var m_transactions  = {};
  var m_netsocket     = null;

  // constants
  const PROMPTS           = require('../system/util/prompts');
  const PR                = PROMPTS.Pad('PKT-NM');
  const ERR = ":ERR:";
  const ERR_NOT_NETMESSAGE = ERR+PR+"obj does not seem to be a NetMessage";
  const ERR_BAD_PROP = ERR+PR+"property argument must be a string";
  const ERR_ERR_BAD_CONSTRUCTION = ERR+PR+"constructor args are string, object";
  const ERR_BAD_SOCKET = ERR+PR+"sender object must implement send()";
  const ERR_BAD_SEND = ERR+PR+"bad socket; can't send";
  const ERR_DUPE_TRANS = ERR+PR+"this packet transaction is already registered!";
  const ERR_NO_GLOBAL_UADDR = ERR+PR+"packet sending attempted before UADDR is set!";
  const ERR_UNKNOWN_TYPE = ERR+PR+"packet type is unknown:";
  const KNOWN_TYPES       = ['mesg','state'];

/// UNISYS NETMESSAGE CLASS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ A UNetMessage encapsulates a specific message and data payload for sending
    across the network.
/*/ class NetMessage {
      constructor( msg, data ) {
        // OPTION 1
        // create NetMessage from (generic object)
        if ((typeof msg==='object') && (data===undefined)) {
          // make sure it has a msg and data obj
          if ((typeof msg.msg!=='string')||(typeof msg.data!=='object')) throw ERR_NOT_NETMESSAGE;
          // merge properties into this new class instance and return it
          Object.assign(this,msg);
          m_SeqIncrement(this);
          return this;
        }
        // OPTION 2
        // create NetMessage from JSON-encoded string
        if ((typeof msg==='string') && (data===undefined)) {
          let obj = JSON.parse(msg);
          Object.assign(this,obj);
          m_SeqIncrement(this);
          return this;
        }
        // OPTION 3
        // create new NetMessage from scratch (mesg,data)
        // unique id for every NetMessage
        if ((typeof msg!=='string') || (typeof data!=='object')) throw ERR_ERR_BAD_CONSTRUCTION;
        // allow calls with null data by setting to empty object
        this.data     = data || {};
        this.msg      = msg;
        // id and debugging memo support
        let idStr     = (++m_id_counter).toString();
        this.id       = m_id_prefix+idStr.padStart(5,'0');
        this.type     = KNOWN_TYPES[0]; // default to 'mesg'
        this.memo     = '';
        // transaction support
        this.seqnum   = 0;	  // positive when part of transaction
        this.seqlog   = [];   // for debugging support
        // addressing support
        this.s_uaddr  = null; // originating uaddr set by SocketSend()
      } // constructor

  /// ACCESSSOR METHODS ///////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ returns the type
  /*/ Type() { return this.type }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ returns the type
  /*/ SetType( type ) { this.type = m_CheckType(type) }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ returns the message
  /*/ Message() { return this.msg; }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ sets the message field
  /*/ SetMessage( msgstr ) { this.msg = msgstr; }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ returns the entire data payload or the property within the data payload
      (can return undefined if property doesn't exist)
  /*/ Data( prop ) {
        if (!prop) return this.data;
        if (typeof prop==='string') return this.data[prop];
        throw ERR_BAD_PROP;
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ convenience method to set data object entirely
  /*/ SetData( propOrVal, val ) {
        if (typeof propOrVal==='object') { this.data=propOrVal; return }
        if (typeof propOrVal==='string') { this.data[propOrVal]=val; return }
        throw ERR_BAD_PROP;
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ returns truthy value (this.data) if the passed msgstr matches the
      message associated with this NetMessage
  /*/ Is( msgstr ) {
         return (msgstr===this.msg) ? this.data : undefined;
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ getter/setter for the memo description field
  /*/ Memo() { return this.memo; }
      SetMemo( memo ) { this.memo = memo; }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ convenience function to return JSON version of this object
  /*/ JSON() {
        return JSON.stringify(this);
      }

  /// TRANSACTION SUPPORT /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ The sequence number is positive if this packet is reused
  /*/ SeqNum() {
        return this.seqnum;
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Return the originating address of this netmessage packet. It is valid
      only after the packet has been sent at least once.
  /*/ SourceAddress() {
        return this.seqlog[0] || this.s_uaddr;
      }

    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Send packet on either provided socket or default socket. Servers provide
      the socket because it's handling multiple sockets from different clients.
  /*/ SocketSend( socket=m_netsocket ) {
        if (!socket) throw ERR_BAD_SEND;
        if (NetMessage.UADDR===undefined) throw ERR_NO_GLOBAL_UADDR;
        socket.send(this.JSON());
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Create a promise to resolve when packet returns
  /*/ QueueTransaction() {
        // save our current UADDR
        this.seqlog.push(NetMessage.UADDR);

        let p = new Promise((resolve,reject) => {
          var hash = m_GetHashKey(this);
          console.log(PR,'queueing transaction hash',hash);
          if (m_transactions[hash]) {
            reject(Error(ERR_DUPE_TRANS+':'+hash));
          } else {
            // save the resolve function in transactions table;
            // promise will resolve on remote invocation with data
            m_transactions[hash] = function (data)  {
              console.log(PR,'resolving promise with',data);
              resolve(data);
            };
            this.SocketSend();
          }
        });
        return p;
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ If this packet is a returned transaction, then return true
  /*/ IsTransaction() {
        return (this.seqnum>0)&&(this.seqlog[0]===NetMessage.UADDR);
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ If this is a transaction packet that is returned, then execute the stored
      resolver function from the promise stored in m_transactions, which will
      then trigger .then() following any calls
  /*/ CompleteTransaction() {
        var hash = m_GetHashKey(this);
        var resolverFunc = m_transactions[hash];
        console.log(PR,'CompleteTransaction',hash);
        if (typeof resolverFunc!=='function') {
          throw `transaction [${hash}] handler error`;
        } else {
          resolverFunc(this.data);
          Reflect.deleteProperty(m_transactions[hash]);
        }
      }

  /// ADDRESSING SUPPORT //////////////////////////////////////////////////////
  ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/	update the sequence metadata and return on same socket
  /*/ ReturnToSender( socket=m_netsocket ) {
        // note: seqnum is already incremented by the constructor if this was
        // a received packet
        // add this to the sequence log
        this.seqlog.push(NetMessage.UADDR);
        this.SocketSend(socket);
      }
    } // class NetMessage

/// STATIC CLASS METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ set the NETWORK interface object that implements Send()
/*/ NetMessage.GlobalSetup = function ( config ) {
      let { netsocket, uaddr } = config;
      if (uaddr) NetMessage.UADDR = uaddr;
      if (netsocket) {
        if (typeof netsocket.send!=='function') throw ERR_BAD_SOCKET;
        else m_netsocket = netsocket;
      }
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ cleanup any allocated storage
/*/ NetMessage.GlobalCleanup = function () {
      if (m_netsocket) {
        if (DBG) console.log(PR,'GlobalCleanup: deallocating netsocket');
         m_netsocket = null;
       }
    }

/// PRIVATE CLASS HELPERS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ when a packet is reconstructed from an existing object or json string,
    its sequence number is incremented, and the old source uaddr is pushed
    onto the seqlog stack.
/*/ function m_SeqIncrement( pkt ) {
      pkt.seqnum++;
      pkt.s_uaddr = NetMessage.UADDR;
      return pkt;
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	return the hash used for storing transaction callbacks
/*/	function m_GetHashKey( pkt ) {
      return NetMessage.UADDR+':'+pkt.id;
    }
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ is this an allowed type? throw error if not
/*/ function m_CheckType( type ) {
      if (type===undefined) throw 'must past a type string, not '+type;
      if (!(KNOWN_TYPES.includes(type))) throw `${ERR_UNKNOWN_TYPE} '${type}'`;
      return type;
    }


/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NetMessage;
