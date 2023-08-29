if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const UNISYS = require('unisys/client');
const REFLECT = require('system/util/reflection');
/// MAGIC: DevDBLogic will add UNISYS Lifecycle Hooks on require()
const LOGIC = require('./devdb-logic');
const { Switch, Route, Redirect, Link } = require('react-router-dom');
const React = require('react');
const ReactStrap = require('reactstrap');
const PROMPTS = require('system/util/prompts');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var DBG = false;
const PR = PROMPTS.Pad('DevDB');

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This is the root component for the view
 */
class DevDB extends UNISYS.Component {
  constructor(props) {
    super(props);
    UNISYS.ForceReloadOnNavigation();
    /* INITIALIZE COMPONENT STATE from UNISYS */
    // get any state from 'VIEW' namespace; empty object if nothing
    // UDATA.AppState() returns a copy of state obj; mutate/assign freely
    let state = this.AppState('VIEW');
    // initializåe some state variables
    state.description = state.description || 'exerciser for database server testing';
    // REACT TIP: setting state directly works ONLY in React.Component constructor!
    this.state = state;

    /* UNISYS STATE CHANGE HANDLERS */
    // bind 'this' context to handler function
    // then use for handling UNISYS state changes
    this.UnisysStateChange = this.UnisysStateChange.bind(this);
    // NOW set up handlers...
    this.OnAppStateChange('VIEW', this.UnisysStateChange);
  } // constructor
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UNISYS state change handler - registered by UNISYS.OnStateChange()
  /// state is coming from UNISYS
  UnisysStateChange(state) {
    if (DBG) console.log(`.. REACT <- state`, state, `via ${this.udata.UID()}'`);
    // update local react state, which should force an update
    this.setState(state);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// COMPONENT state change handler - registered in render()
  /// state is coming FROM component, which is updating already
  handleTextChange(event) {
    let target = event.target;
    let state = {
      description: target.value
    };
    if (DBG) console.log(`REACT -> state`, state, `to ${this.udata.UID()}`);
    this.SetAppState('VIEW', state, this.uni_id);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// COMPONENT this interface has composed
  componentDidMount() {
    // start the application phase
    let className = REFLECT.ExtractClassName(this);
    if (DBG) console.log(`${className} componentDidMount`);
  } // componentDidMount
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  StudentRender({ match }) {
    console.log('-- STUDENT RENDER --');
    return (
      <p style={{ color: 'red' }}>
        <small>
          matching subroute: {match.params.unit} {match.params.user}!
        </small>
      </p>
    );
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Try to route the following
   *  http://localhost:3000/#dev-unisys/use/student/UNIT_KEY/USER_KEY/
   */
  render() {
    return (
      <div id="fdshell" style={{ padding: '10px' }}>
        <h2>DB DEVTEST SHELL</h2>
        <Route
          path={`${this.props.match.path}/student/:unit/:user`}
          component={this.StudentRender}
        />
        <p>{this.state.description}</p>
      </div>
    );
  } // render
} // class DevUnisys

/// EXPORT UNISYS SIGNATURE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// used in init.jsx to set module scope early
DevDB.UMOD = module.id;

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = DevDB;
