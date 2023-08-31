/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    init-appshell.jsx
    application shell loaded and rendered in init.jsx

    These are the top-level React components ("view") that are mapped to
    routes as seen in render() function's <Switch>. There are three styles:
    (1) a loaded React 'view' that is built entirely with our modular app API
      and displayed in this application shell.
    (2) a plain .html file loaded into an IFRAME, useful for adding stand-alone
      test code with access to the modular app API system, but not other web
      apps (e.g. can use the data storage module)
    (3) a NO ROUTE FOUND component function.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// REACT LIBRARIES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const { Alert, Collapse } = require('reactstrap');
const { Navbar, NavbarToggler } = require('reactstrap');
const { NavbarBrand, Nav, NavItem, NavLink } = require('reactstrap');
const { UncontrolledDropdown, DropdownToggle } = require('reactstrap');
const { DropdownMenu, DropdownItem } = require('reactstrap');
//
const UNISYS = require('unisys/client');

/// 1. MAIN VIEWS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Used by render()'s <Switch> to load a React component (what we call a
    'view' in the NetCreate app). The component should return its elements
    wrapped in a div with the suggested flexbox pr

    index.html           | body          min-height: 100%
    index.html           | div#app
    init-appshell        |   div         display:flex, flex-flow:column nowrap,
                                        width:100%, height:100vh
    init-appshell        |     Navbar    position:fixed
    --- COMPONENT BELOW ---
    <RequiredComponent>  |     div       this is a child of a flexbox
/*/
const SETTINGS = require('settings');
const AppDefault = require('view/default/AppDefault');
const NetCreate = require('view/netcreate/NetCreate');
const HTMLFrame = require('view/html-frame/HTMLFrame');

/// 3. NO ROUTE ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Used by render()'s <Switch> when there are no matching routes
function NoMatch(props) {
  let hash = props.location.pathname.substring(1);
  return (
    <Alert color="warning">
      No Match for route <tt>#{hash}</tt>
    </Alert>
  );
}

/// APPLICATION NAVBAR + ROUTER VIEW //////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** The application shell consists of a navbar implemented with Reactstrap
 *  components and a React view associated with the current route via
 *  ReactRouter <Switch> and <Route>.
 *  The AppShell class is exported as the main module object for use with
 *  require() statements (thanks to brunch magic)
 */
class AppShell extends UNISYS.Component {
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  constructor(props) {
    super(props);
    this.toggle = this.toggle.bind(this);
    this.state = {
      isOpen: false
    };
    // bind handler
    this.redirect = this.redirect.bind(this);
    // add UNISYS message for redirects
    this.HandleMessage('SHELL_REDIRECT', this.redirect);
  }
  /** Handle changes in state of his toggle switch */
  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }
  /** Called by SHELL_REDIRECT unisys message */
  redirect(data) {
    let { redirect } = data;
    this.props.history.push(redirect);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Draw top navbar w/ menus. Add route information
   *  To add a new HTML, add the link to both the <Nav> and <Switch> staments.
   *  To add a new VIEW, load the component
   */
  render(props) {
    const { route, routeProps } = SETTINGS.GetRouteInfoFromURL(window.location.href);
    const isLocalHost = window.location.href.indexOf('localhost') > -1;
    return (
      <div
        style={{
          display: 'flex',
          flexFlow: 'column nowrap',
          width: '100%',
          height: '100vh'
        }}
      >
        <Navbar
          fixed="top"
          light
          expand="md"
          style={{ backgroundColor: '#f0f0f0', padding: '4px 10px' }}
        >
          <NavbarBrand href="#" style={{ padding: '0' }}>
            <img src="images/netcreate-logo.svg" height="26px" />
          </NavbarBrand>
          <NavbarToggler onClick={this.toggle} />
          <Collapse isOpen={this.state.isOpen} navbar>
            {/*/ (1) add navigation links here /*/}
            <Nav className="ml-auto" navbar hidden={!isLocalHost}>
              {/* extra menu items
                  <NavItem>
                    <NavLink to="/d3forcedemo" tag={RRNavLink} replace>D3 ForceDemo</NavLink>
                  </NavItem>
                  <UncontrolledDropdown direction="right" nav size="sm">
                    <DropdownToggle>
                      Extras
                    </DropdownToggle>
                    <DropdownMenu>
                      <DropdownItem>
                        <NavLink to="/dev-react" tag={RRNavLink} replace>dev-react</NavLink>
                      </DropdownItem>
                      <DropdownItem>
                        <NavLink to="/dev-unisys" tag={RRNavLink} replace>dev-unisys</NavLink>
                      </DropdownItem>
                      <DropdownItem>
                        <NavLink to="/dev-db" tag={RRNavLink} replace>dev-db</NavLink>
                      </DropdownItem>
                      <DropdownItem>
                        <NavLink to="/dev-session" tag={RRNavLink} replace>dev-session</NavLink>
                      </DropdownItem>
                      <DropdownItem>
                        <NavLink to="/simple" tag={RRNavLink} replace>SimpleHTML Example</NavLink>
                      </DropdownItem>
                      <DropdownItem>
                        <NavLink to="/vocabulary" tag={RRNavLink} replace>Network Vocabulary</NavLink>
                      </DropdownItem>
                    </DropdownMenu>
                  </UncontrolledDropdown>
              */}
            </Nav>
          </Collapse>
        </Navbar>
        <div style={{ height: '3.5em' }}>
          {/*/ add space underneath the fixed navbar /*/}
        </div>
        <NetCreate />
      </div>
    );
  } // render()
} // AppShell()

/// EXPORT REACT CLASS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = AppShell;
