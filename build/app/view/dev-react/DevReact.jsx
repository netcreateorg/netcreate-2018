if (window.NC_DBG) console.log(`inc ${module.id}`);
/// SYSTEM INTEGRATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS      = require('unisys/client');
const REFLECT     = require('system/util/reflection');
const LOGIC       = require('./devreact-logic');
const {Route}     = require('react-router-dom');

var   DBG         = true;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React       = require('react');
const PROMPTS     = require('system/util/prompts');
const PR          = PROMPTS.Pad('DevReact');

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ This is the root component for the view
/*/ class DevReact extends UNISYS.Component {
      constructor(props) {
        super(props);
        UNISYS.ForceReloadOnNavigation()

        /* INITIALIZE COMPONENT STATE from UNISYS */
        // get any state from 'VIEW' namespace; empty object if nothing
        // UDATA.AppState() returns a copy of state obj; mutate/assign freely
        let state = this.AppState('VIEW');
        // initialize some state variables
        state.description = state.description || 'exerciser for database server testing';
        // REACT TIP: setting state directly works ONLY in React.Component constructor!
        this.state = state;

        /* UNISYS STATE CHANGE HANDLERS */
        // bind 'this' context to handler function
        // then use for handling UNISYS state changes
        this.AppStateChange = this.AppStateChange.bind(this);
        // NOW set up handlers...
        this.OnAppStateChange('VIEW',this.AppStateChange);

      } // constructor
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UNISYS state change handler - registered by UNISYS.OnStateChange()
  /// state is coming from UNISYS
      AppStateChange( state ) {
        if (DBG) console.log(`.. REACT <- state`,state,`via ${this.UDATA.UID()}'`);
        // update local react state, which should force an update
        this.setState(state);
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// COMPONENT this interface has composed
      componentDidMount() {
        // start the application phase
        let className = REFLECT.ExtractClassName(this);
        if (DBG) console.log(`${className} componentDidMount`);
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
              <h2>UNISYS-REACT INTEGRATION TEST SHELL</h2>
              <Route path={`${this.props.match.path}/student/:unit/:user`} component={this.StudentRender}/>
              <p>{this.state.description}</p>
            </div>
        );
      } // render


    } // class DevUnisys

/// EXPORT UNISYS SIGNATURE ///////////////////////////////////////////////////
/// used in init.jsx to set module scope early
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DevReact.UMOD = module.id;

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = DevReact;
