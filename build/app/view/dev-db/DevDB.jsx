if (window.NC_DBG.inc) console.log(`inc ${module.id}`);
/// SYSTEM INTEGRATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS      = require('unisys/client');
const REFLECT     = require('system/util/reflection');
/// MAGIC: DevDBLogic will add UNISYS Lifecycle Hooks on require()
const LOGIC       = require('./DevDBLogic');
const {Switch, Route, Redirect, Link} = require('react-router-dom');

var   DBG         = false;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React       = require('react');
const ReactStrap  = require('reactstrap');
const { InputGroup, InputGroupAddon, InputGroupText, Input } = ReactStrap;
const { Alert }   = ReactStrap;
const PROMPTS     = require('system/util/prompts');
const PR          = PROMPTS.Pad('DevUnisys');

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ This is the root component for the view
/*/ class DevDB extends React.Component {
      constructor(props) {
        super(props);

        /* UNISYS DATA LINK CONNECTION */
        this.udata = UNISYS.NewDataLink(this);

        /* INITIALIZE COMPONENT STATE from UNISYS */
        // get any state from 'VIEW' namespace; empty object if nothing
        // UDATA.State() returns a copy of state obj; mutate/assign freely
        let state = this.udata.State('VIEW');
        // initialize some state variables
        state.description = state.description || 'exerciser for database server testing';
        // REACT TIP: setting state directly works ONLY in React.Component constructor!
        this.state = state;

        /* LOCAL INTERFACE HANDLERS */
        this.handleTextChange  = this.handleTextChange.bind(this);

        /* UNISYS STATE CHANGE HANDLERS */
        // bind 'this' context to handler function
        // then use for handling UNISYS state changes
        this.UnisysStateChange = this.UnisysStateChange.bind(this);
        // NOW set up handlers...
        this.udata.OnStateChange('VIEW', this.UnisysStateChange);

        /* (1) UNISYS LIFECYCLE INITIALIZATION                        */
        /* must initialize UNISYS before declaring any hook functions */
        /* then call UNISYS.NetworkInitialize() in componentDidMount  */
        UNISYS.SystemInitialize(module.id);

      } // constructor

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UNISYS state change handler - registered by UNISYS.OnStateChange()
  /// state is coming from UNISYS
      UnisysStateChange( state ) {
        if (DBG) console.log(`.. REACT <- state`,state,`via ${this.udata.UID()}'`);
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
        if (DBG) console.log(`REACT -> state`,state,`to ${this.udata.UID()}`);
        this.udata.SetState('VIEW',state,this.uni_id);
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// COMPONENT this interface has composed
      componentDidMount() {
        // start the application phase
        let className = REFLECT.ExtractClassName(this);
        if (DBG) console.log(`${className} componentDidMount`);
        /* (2) UNISYS NETWORK INITIALIZATION                            */
        /* now that UI is completely rendered, connect to UNISYS net!   */
        UNISYS.NetworkInitialize(() => {
          console.log(PR,'unisys network initialized');
          /* (3) UNISYS LIFECYCLE INITIALIZATION                        */
          /* all program logic should be located in a UNISYS LIFECYCLE  */
          (async () => {
            await UNISYS.EnterApp();  // INITIALIZE, UNISYS_INIT, LOADASSETS
            await UNISYS.SetupRun();  // RESET, CONFIGURE, UNISYS_SYNC, START
          })();
        });
        // NOTE: see unisys-lifecycle.js for more run modes
      } // componentDidMount

    StudentRender ({ match }) {
      console.log('-- STUDENT RENDER --');
      return (
        <p style={{color:'red'}}><small>matching subroute: {match.params.unit} {match.params.user}!</small></p>
      );
    }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Try to route the following
      http://localhost:3000/#dev-unisys/use/student/UNIT_KEY/USER_KEY/
  /*/ render() {
        return (
            <div id='fdshell' style={{padding:'10px'}}>
              <h2>DB DEVTEST SHELL</h2>
              <Route path={`${this.props.match.path}/student/:unit/:user`} component={this.StudentRender}/>
              <p>{this.state.description}</p>
            </div>
        );
      } // render


    } // class DevUnisys

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = DevDB;
