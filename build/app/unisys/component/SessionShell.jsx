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

    TODO: if an invalid URL is entered, should reset

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// DEBUGGING /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require("react");
const PROMPTS = require("system/util/prompts");
const SESSION = require("unisys/common-session");
const PR = PROMPTS.Pad("SessionShell");
const ReactStrap = require("reactstrap");
const { Col, FormGroup, FormFeedback, Input, Label } = ReactStrap;
const { Redirect } = require("react-router-dom");
const UNISYS = require("unisys/client");

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// these styles are copied from AutoComplete.css
const INPUT_STYLE = {
  border: "1px solid #aaa",
  borderRadius: "4px",
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

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SessionShell extends UNISYS.Component {
  constructor() {
    super();
    this.renderLogin = this.renderLogin.bind(this);
    this.renderLoggedIn = this.renderLoggedIn.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      classId: null,
      projId: null,
      hashedId: null,
      groupId: null,
      isValid: false
    };
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
        <FormGroup row style={GROUP_STYLE}>
          <Col sm={3}>
            <Label style={LABEL_STYLE} className="small">
              GROUP{gid}
              <br />
              {subid}
            </Label>
          </Col>
          <Col sm={9} className="text-right">
            <Label style={LABEL_STYLE} className="small">
              {classproj}-<strong>{decoded.hashedId}</strong>
            </Label>
          </Col>
        </FormGroup>
      );
    } else {
      return <p>ERROR:renderLoggedIn didn't get valid decoded object</p>;
    }
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ render must login (readonly)
  /*/
  renderLogin(token) {
    let decoded = token ? SESSION.DecodeToken(token) : this.state;
    let { classId, projId, groupId, subId, hashedId, isValid } = decoded;
    let formFeedback, tip;
    if (classId) tip = "keep entering...";
    else tip = "enter group ID";
    if (hashedId) {
      if (hashedId.length >= 3) {
        if (!isValid) tip = `'${token}' is an invalid code`;
      }
    }
    formFeedback = tip ? (
      <FormFeedback className="text-right">
        <small>{tip}</small>
      </FormFeedback>
    ) : (
      undefined
    );
    return (
      <FormGroup row>
        <Col sm={3}>
          <Label className="small text-muted">Login</Label>
        </Col>
        <Col sm={9}>
          <Input
            invalid
            name="sessionToken"
            id="sessionToken"
            bsSize="sm"
            style={INPUT_STYLE}
            className="text-right"
            placeholder="CLASS-PROJECT-XYZ"
            onChange={this.handleChange}
          />
          {formFeedback}
        </Col>
      </FormGroup>
    );
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  componentWillMount() {
    // the code below reads a pre-existing matching path, which may be set
    // to a valid token string AFTER the changeHandler() detected a valid
    // login after a ForceReload. This is a bit hacky and the app would benefit
    // from not relying on forced reloads. See handleChange().
    let token = this.props.match.params.token;
    let decoded = SESSION.DecodeToken(token) || {};
    this.SetAppState("SESSION", decoded);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Main Render Function
/*/ render() {
    // FUN FACTS
    // this.state set in constructor
    // this.props.history, location, match added by withRouter(AppShell)
    // way back in init-appshell.jsx

    // no token so just render login
    let token = this.props.match.params.token;
    if (!token) return this.renderLogin();
    // try to decode token
    let decoded = SESSION.DecodeToken(token);
    if (decoded.isValid) {
      this.AppCall("GROUPID_CHANGE", token);
      return this.renderLoggedIn(decoded);
    }
    // error in decode so render login field
    return this.renderLogin(token);
  }

  /// EVENT HANDLERS ////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  handleChange(event) {
    let token = event.target.value;
    let decoded = SESSION.DecodeToken(token);
    let { classId, projId, hashedId, groupId } = decoded;
    this.setState(decoded);
    this.SetAppState("SESSION", decoded);
    if (decoded.groupId) {
      // force a page URL change
      let redirect = `/edit/${event.target.value}`;
      this.props.history.push(redirect);
    }
  }
} // UNISYS.Component SessionShell

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = SessionShell;
