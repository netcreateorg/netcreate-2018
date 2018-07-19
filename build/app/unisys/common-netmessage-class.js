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

  var m_id_counter 	= 0;
  var m_id_prefix  	= 'NM';
  var m_owner_id 		= "error-not-initialized";
  var m_transactions 	= {};

  // constants
  const PR  = "NETMESSAGE:";
  const ERR = "ERR:";
  const ERR_NOT_NETMESSAGE = ERR+PR+"obj does not seem to be a NetMessage";
  const ERR_BAD_PROP = ERR+PR+"property argument must be a string";
  const ERR_ERR_BAD_CONSTRUCTION = ERR+PR+"constructor args are string, object";

  const NDEF = {
    // placeholder
    Get : () => { console.log('Get() is not implemented'); }
  };
  const MSG_TRANSACTION_RETURN = '_TRANS_RET';

/// PRIVATE MODULE FUNCTIONS //////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	return the hash used for storing transaction callbacks
/*/	function f_TransHash ( pkt ) {
      if (pkt.seqnum > 99) console.error('packet seqnum max exceeded!');
      return pkt.id+'_'+pkt.seqnum.padStart(2,'0');
    }

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
        // create NetMessage from (string, object)
        // unique id for every NetMessage
        if ((typeof msg!=='string') || (typeof data!=='object')) throw ERR_ERR_BAD_CONSTRUCTION;

        // allow calls with null data by setting to empty object
        this.data     = data || {};
        this.msg      = msg;
        // id and debugging memo support
        let idStr     = (++m_id_counter).toString();
        this.id       = m_id_prefix+'.'+idStr.padStart(5,'0');
        this.memo     = '';
        // transaction support
        this.seqnum   = 0;	  // positive when part of transaction
        this.seqlog   = [];   // for debugging support
        this.acklog   = [];   // for debugging support
        this.msglog   = [];   // for debugging support
        // addressing support
        this.s_uaddr  = null; // originating uaddr
        this.d_uaddrs = null; // dest uaddr(s)
      } // constructor

  /// ACCESSSOR METHODS ///////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ returns the message
  /*/ Message() {
        return this.msg;
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ sets the message field
  /*/ SetMessage( msgstr ) {
        this.msg = msgstr;
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ returns the entire data payload or the property within the data payload
      (can return undefined if property doesn't exist)
  /*/ Data( prop ) {
        if (!prop) return this.data;
        if (typeof prop === 'string') return this.data[prop];
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
  /*/ increment sequence number, then store packet signature into dict used
  for all netmessages
  /*/ QueueTransaction( funcExec ) {
        // transactions increment the sequence number each time a callback is
        // registered. DO NOT INCREMENT ANYWHERE ELSE, since function lookup
        // on return is dependent on the initial value of seqnum
        this.seqnum++;
        this.seqlog.push( NDEF.Get('u_addr') );
        // calculate unique hash
        var hash = f_TransHash(this);
        if (m_transactions[hash]) throw "this transaction "+hash+" already registered";
        m_transactions[hash] = funcExec;
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ acknowledge transaction handled by remote. Note that u_addr here is that
      of the remote app!
  /*/ ReturnTransaction( returner ) {
        returner = returner || NDEF.Get('u_addr');
        this.acklog.push( returner );
        this.msglog.push( this.msg );
        // do this after saving state!
        this.msg = MSG_TRANSACTION_RETURN;
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ call function, then remove transaction when we're done processing it
  /*/ CompleteTransaction() {
        var hash = f_TransHash(this);
        var funcExec = m_transactions[hash];
        if (funcExec===undefined) {
          console.log('not a local transaction..skipping');
          console.log(hash);
          return;
        }
        if (typeof funcExec !== 'function') {
          throw 'transaction '+hash.bracket()+' handler error';
        } else {
          funcExec(this.data);
          Reflect.delete(m_transactions[hash]);
        }
      }
  ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/	return TRUE if this is a transaction packet (seqnum>0). The seqnum is
      incremented only in QueueTransaction() made by the calling app.
  /*/	IsTransaction () {
        return this.seqnum>0;
      }
  ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ return TRUE if this is a transaction acknowledgement packet.
      A seqnum test is too broad, since it is > 0 on send as well on return.
  /*/	IsTransactionAck() {
        return this.IsTransaction()&&(this.msg===MSG_TRANSACTION_RETURN);
      }
  ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/	return the last address of the sequence log for TRANS_ACK packet
  /*/ GetReqAddress() {
        var len = this.seqlog.length;
        if (!len) throw 'return socket list is unexpectedly empty';
        return this.seqlog[len-1];
      }
  ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/	return the last address of the sequence log for TRANS_ACK packet
  /*/ GetAckAddress() {
        var len = this.acklog.length;
        if (!len) throw 'send socket list is unexpectedly empty';
        return this.acklog[len-1];
      }
  ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/	return the last message on the message stack for TRANS_ACK packet
  /*/ GetAckMessage() {
        var len = this.msglog.length;
        if (!len) throw 'message log is unexpectedly empty';
        return this.msglog[len-1];
      }


  /// ADDRESSING SUPPORT //////////////////////////////////////////////////////
  ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/	OPTIONAL set the addresses that this packet should be sent to instead
      of the UNISYS default 'all registered handlers'
  /*/	SetAddress( addr ) {
        if (Array.isArray(addr)) {
          if (!this.d_addr) this.d_addr=[];
          for (var i=0; i<addr.length; i++) {
            this.d_addr.push(addr[i]);
          }
          return;
        }
        var type = typeof addr;
        if (type==='string') {
          if (!this.d_addr) this.d_addr=[];
          this.d_addr.push(addr);
          return;
        }
        if (!type) {
          this.d_addr = null;
          return;
        }
        throw ('arg1 must be an address string, array, or falsey');
      }
  ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/	accessor function to return the address array. is null (falsey) if no
      addresses have been set
  /*/	GetAddress() {
        return this.d_addr;
      }
    } // class NetMessage

/// STATIC CLASS METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ set the source address (uaddr)
/*/ NetMessage.SetUADDR = function ( uaddr ) {
      if (DBG) console.log(PR,'setting global UADDR to ',uaddr);
      NetMessage.UADDR = uaddr;
    };

/// PRIVATE CLASS HELPERS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ when a packet is reconstructed from an existing object or json string,
    its sequence number is incremented, and the old source uaddr is pushed
    onto the seqlog stack.
/*/ function m_SeqIncrement( pkt ) {
      pkt.seqnum++;
      pkt.seqlog.push(pkt.s_uaddr);
      pkt.s_uaddr = NetMessage.UADDR;
      return pkt;
    }



/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NetMessage;
