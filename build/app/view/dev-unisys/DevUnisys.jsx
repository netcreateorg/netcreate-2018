/// SYSTEM INTEGRATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS      = require('system/unisys');
const LOGIC       = require('./DevUnisysLogic');
const REFLECT     = require('system/util/reflection');

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React       = require('react');
const ReactStrap  = require('reactstrap');
const { InputGroup, InputGroupAddon, InputGroupText, Input } = ReactStrap;
const { Alert }   = ReactStrap;

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ This component blah blah
/*/ class DevUnisys extends React.Component {

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// CONSTRUCTOR
      constructor(props) {
        super(props);

        // establish module scope before lifecycle
        // do this once in the root component as early as possible
        UNISYS.SystemInitialize(module.id);

        // set up data links
        this.udata = UNISYS.NewDataLink(this);

        // UNISYS state may already be initialized from settings
        let state = this.udata.State('VIEW');
        // UNISYS.State() returns a copy of state obj; mutate/assign freely
        state.description = state.description || 'uninitialized description';
        // REACT TIP: you can safely set state directly ONLY in constructor!
        this.state = state;

        // bind 'this' context to handler function
        // then use for handling UNISYS state changes
        this.UnisysStateChange = this.UnisysStateChange.bind(this);
        this.udata.OnStateChange('VIEW', this.UnisysStateChange);

        this.handleTextChange  = this.handleTextChange.bind(this);
        this.udata.OnStateChange('LOGIC', this.UnisysStateChange);

        // register some handlers
        this.udata.HandleMessage('JSXMELON',(data,cb) => {
          data.cat = 'calico';
        });

        // hook start handler to initiate call
        UNISYS.Hook('START',() => {
          this.udata.Call('LOGICMELON',{ melon : 'jsxmelon' });
        });


      } // constructor

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UNISYS state change handler - registered by UNISYS.OnStateChange()
  /// state is coming from UNISYS
      UnisysStateChange( state ) {
        console.log(`.. REACT <- state`,state,`via ${this.udata.UID()}'`);
        // update local react state, which should force an update
        this.setState(state);
      }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// COMPONENT state change handler - registered in render()
  /// state is coming FROM component, which is updating already
      handleTextChange( event ) {
        let target = event.target;
        let state = {
          description : target.value
        }
        console.log(`REACT -> state`,state,`to ${this.udata.UID()}`);
        this.udata.SetState('VIEW',state, this.uni_id);
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// COMPONENT this interface has composed
      componentDidMount() {
        // start the application phase
        let className = REFLECT.ExtractClassName(this);
        console.log(`${className} componentDidMount`);


        // kickoff initialization stage by stage
        (async () => {
          await UNISYS.EnterApp();
          await UNISYS.SetupRun();
        })();

      } // componentDidMount

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// COMPONENT render the component template
      render() {
        return (
          <div style={{padding:'10px'}}>
            <h2>Unisys Feature Development Shell</h2>
            <h4>TESTING UISTATE</h4>
            <p>{this.state.description}</p>
            <Input type="text" name="desc" id="desc" placeholder="text to change" onChange={this.handleTextChange} />
            <p>random string from LOGIC: {this.state.random || 'notset'}</p>
          </div>
        );
      } // render
    } // class DevUnisys

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = DevUnisys;
