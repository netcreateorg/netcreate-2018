if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    SessionShell handles route-based parameters in ReactRouter and updates
    the SESSION manager with pertinent information

    The component stores the credentials
      classId  : null,
      projId   : null,
      hashedId : null,
      groupId  : null,
      isValid  : false

    render() calls one of the following depending on the state of
    SESSION.DecodeToken( token ). It returns an object is isValid prop set.
    The token is read from this.props.match.params.token, which is provided
    by ReactRouter.

      renderLoggedIn( decoded ) contains an object with the decoded properties
      from the original string, and displays the login state

      renderLogin() shows the login text field.

    When text is changing in Login Field, this.handleChange() is called.
    It gets the value and runs SESSION.DecodeToken() on it.
    It then uses Unisys.SetAppState to set "SESSION" to the decoded value.
    if a groupId is detected, then it forces a redirect.


    A change in logged in status can come from four places:

    1. User has typed in login field.
       => This is handled by `handleChange()`
    2. User has hit the "Login" submit button.
       => This is handled by `onSubmit()`
    3. User has entered a full URL for the first time
       => This is handled by `componentWillMount()`
    4. User has changed an existing URL
       => This does not trigger `compomentWillMount()`
          so it needs special handling.
       Changing the url does trigger:
       * render()
          render is triggered because the props for the token
          passed by the Route change.
          And render does detect the correct login state.
          However, if this represents a change in login state,
          the change in state needs to be broadcast.
       * componentDidUpdate()
          componentDidUpdate checks for the change in loggedinIn
          status and sends an AppStateChanged event as needed.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// DEBUGGING /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require("react");
const PROMPTS = require("system/util/prompts");
const SESSION = require("unisys/common-session");
const PR = PROMPTS.Pad("SessionShell");
const ReactStrap = require("reactstrap");
const { InputGroup, InputGroupAddon, Button, Col, Row, Form, FormGroup, FormFeedback, Input, Label } = ReactStrap;
const { Redirect } = require("react-router-dom");
const UNISYS = require("unisys/client");

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// these styles are copied from AutoComplete.css
const INPUT_STYLE = {
  border: "1px solid #aaa",
  fontFamily: "Helvetica, sans-serif",
  fontWeight: 300,
  fontSize: "10px",
  textAlign: "right",
  textTransform: "uppercase"
};
const GROUP_STYLE = {
  backgroundColor: "#777",
  color: "white",
  marginTop: "-10px"
};
const LABEL_STYLE = {
  verticalAlign: "top",
  marginBottom: "0.15rem",
  marginTop: "0.15rem"
};
/// Move login to navbar
const NAV_LOGIN_STYLE = {
  position: 'fixed',
  top: '7px',
  right: '20px',
  zIndex: '2000'
};
const NAV_LOGIN_FEEDBACK_STYLE = {
  position: "absolute",
  right: "210px"
};

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SessionShell extends UNISYS.Component {
  constructor() {
    super();
    this.renderLogin = this.renderLogin.bind(this);
    this.renderLoggedIn = this.renderLoggedIn.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.state = {   // `state` tracks the login input field
      token: null,
      classId: null,
      projId: null,
      hashedId: null,
      subId: null,
      groupId: null,
      isValid: false
    };
    this.previousIsValid = false; // to track changes in loggedIn status

    // This will invalidate the token when the server is disconnected
    // but this can be a problem for projects that require login
    // to view the graph.
    // this.OnDisconnect(() => {
    //   const token = this.props.match.params.token;
    //   const decoded = SESSION.DecodeToken(token, window.NC_CONFIG.dataset);
    //   // invalidate the token and announce it
    //   decoded.isValid = false;
    //   this.SetAppState("SESSION", decoded);
    // });
  }

  /// ROUTE RENDER FUNCTIONS ////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ render successful logged-in
  /*/
  renderLoggedIn(decoded) {
    if (decoded) {
      let classproj = `${decoded.classId}-${decoded.projId}`;
      // prefix with unicode non-breaking space
      let gid = `\u00A0${decoded.groupId}`;
      let subid = decoded.subId ? `USER\u00A0${decoded.subId}` : "";
      return (
        <div style={NAV_LOGIN_STYLE}>
          <Label style={LABEL_STYLE} className="small">
            GROUP{gid}:&nbsp;
            <br />
            {subid}
          </Label>
          <Label style={LABEL_STYLE} className="small">
            {classproj}-<strong>{decoded.hashedId}</strong>
          </Label>
        </div>
      );

      // Old Form above NodeSelector
      // return (
      //   <FormGroup row style={GROUP_STYLE} style={{position:'fixed',top:'5px',right:'5px',zIndex:'2000'}}>
      //     <Col sm={3}>
      //       <Label style={LABEL_STYLE} className="small">
      //         GROUP{gid}
      //         <br />
      //         {subid}
      //       </Label>
      //     </Col>
      //     <Col sm={9} className="text-right">
      //       <Label style={LABEL_STYLE} className="small">
      //         {classproj}-<strong>{decoded.hashedId}</strong>
      //       </Label>
      //     </Col>
      //   </FormGroup>
      // );
    } else {
      return <p>ERROR:renderLoggedIn didn't get valid decoded object</p>;
    }
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ render must login (readonly)
  /*/
  renderLogin() {
    let { token, classId, projId, groupId, subId, hashedId, isValid } = this.state;
    if (token) token = token.toUpperCase();
    let formFeedback, tip, input;
    tip = "Type group ID";
    if (classId) tip = "Scanning for valid code...";
    if (projId) tip = "Waiting for valid code...";
    if (groupId) tip = "Waiting for extra ID...";
    if (hashedId) {
      if (hashedId.length >= 3) {
        if (!groupId) tip = `'${token}' is an invalid code`;
        else {
          if (subId) tip = `Login in as GROUP ${groupId} ${subId}`;
          else tip = `Login as GROUP ${groupId} or add -ID<num>`;
        }
      }
    }
    if (groupId) {
      if (subId===0) {
        tip = `e.g. ${classId}-${projId}-${hashedId} followed by -ID<num>`;
        input = <Input invalid name="sessionToken" id="sessionToken" bsSize="sm" style={INPUT_STYLE} className="text-right" placeholder="CLASSID-PROJID-CODE" onChange={this.handleChange} />
        formFeedback = <FormFeedback style={NAV_LOGIN_FEEDBACK_STYLE} className="text-right"><small>{tip}</small></FormFeedback>
      } else {
        input = <Input valid name="sessionToken" id="sessionToken" bsSize="sm" style={INPUT_STYLE} className="text-right" placeholder="CLASSID-PROJID-CODE" onChange={this.handleChange} />
        formFeedback = <FormFeedback valid style={NAV_LOGIN_FEEDBACK_STYLE} className="text-right"><small>{tip}</small></FormFeedback>
      }
    } else {
        input = <Input invalid name="sessionToken" id="sessionToken" bsSize="sm" style={INPUT_STYLE} className="text-right" placeholder="CLASSID-PROJID-CODE" onChange={this.handleChange} />
        formFeedback = <FormFeedback style={NAV_LOGIN_FEEDBACK_STYLE} className="text-right"><small>{tip}</small></FormFeedback>
    }

    return (
      <Form onSubmit={this.onSubmit} style={NAV_LOGIN_STYLE}>
      <FormGroup row>
        <InputGroup>
          <InputGroupAddon addonType="prepend"><Button style={{fontSize:'10px'}} color="secondary" size="sm" disabled={!isValid} onSubmit={this.onSubmit}>LOGIN</Button></InputGroupAddon>
          {input}
          {formFeedback}
        </InputGroup>
      </FormGroup>
      </Form>
    );

    // Old Form above NodeSelector
    // return (
    //   <Form onSubmit={this.onSubmit} style={{position:'fixed',top:'5px',right:'5px',zIndex:'2000'}}>
    //   <FormGroup row>
    //     <Col>
    //       <InputGroup>
    //         {formFeedback}
    //         <InputGroupAddon addonType="prepend"><Button style={{fontSize:'10px'}} color="secondary" size="sm" disabled={!isValid} onSubmit={this.onSubmit}>LOGIN</Button></InputGroupAddon>
    //         {input}
    //       </InputGroup>
    //     </Col>
    //   </FormGroup>
    //   </Form>
    // );
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  componentWillMount() {
    // the code below reads a pre-existing matching path, which may be set
    // to a valid token string AFTER the changeHandler() detected a valid
    // login after a ForceReload. This is a bit hacky and the app would benefit
    // from not relying on forced reloads. See handleChange().
    //
    // This is only called with the initial page load.
    // Subsequent changes to the URL (e.g. changing token directly in the url)
    // do not result in a second componentWillMount call.  These are handled
    // by the componentDidUpdate() call.
    let token = this.props.match.params.token;
    let decoded = SESSION.DecodeToken(token, window.NC_CONFIG.dataset) || {};
    this.SetAppState("SESSION", decoded);
    this.previousIsValid = decoded.isValid;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Main Render Function
  /*/
  render() {
    // FUN FACTS
    // this.state set in constructor
    // this.props.history, location, match added by withRouter(AppShell)
    // way back in init-appshell.jsx

    // if standalone mode, no login possible
    if (UNISYS.IsStandaloneMode()) {
      const { prompt, timestamp } = window.NC_UNISYS.standalone;
      return (
        <div style={NAV_LOGIN_STYLE}>
          <Col sm={16}>
            <Label style={LABEL_STYLE} className="small">{prompt}</Label>
          </Col>
          </div>
      );
    }

    let token = this.props.match.params.token;

    // no token so just render login
    if (!token) return this.renderLogin();

    // try to decode token
    let decoded = SESSION.DecodeToken(token, window.NC_CONFIG.dataset);
    if (decoded.isValid) {
      return this.renderLoggedIn(decoded);
    } else {
      return this.renderLogin(token);
    }
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  componentDidUpdate(prevProps) {
    // SIDE EFFECT
    // Check for changes in logged in status and
    // trigger AppStateChange if necessary

    // Read token from props (because they are not saved in state)
    // We have to decode again here because we're using props directly
    let token = this.props.match.params.token;
    if (!token) return; // don't bother to check if this was a result of changes from the form
    let decoded = SESSION.DecodeToken(token, window.NC_CONFIG.dataset);
    if (decoded.isValid !== this.previousIsValid) {
      this.SetAppState("SESSION", decoded);
      this.previousIsValid = decoded.isValid;
    }
  }

  /// EVENT HANDLERS ////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  handleChange(event) {
    let token = event.target.value;
    let decoded = SESSION.DecodeToken(token, window.NC_CONFIG.dataset);
    let { classId, projId, hashedId, subId, groupId } = decoded;
    this.setState(decoded);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  onSubmit(event) {
    event.preventDefault();
    const BRUTAL_REDIRECT = true;
    if (this.state.isValid) {
      // force a page URL change
      if (BRUTAL_REDIRECT) {
        const redirect = `./#/edit/${this.state.token}`;
        window.location=redirect;
      } else {
        const redirect = `./edit/${this.state.token}`
        this.props.history.push(redirect);
      }
    }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  }
} // UNISYS.Component SessionShell

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = SessionShell;
