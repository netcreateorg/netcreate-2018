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
    const { Switch, Route, Redirect, Link } = require('react-router-dom');
    // workaround name collision in ReactRouterNavLink with ReactStrap
    const RRNavLink = require('react-router-dom').NavLink;
    //
    const { renderRoutes } = require('react-router-config');


/** (1) ROUTED COMPONENTS ****************************************************\
  Used by render()'s <Switch> to load a React component (what we call a
  'view' in the NetCreate app). The component should return its elements
  wrapped in a div with the suggested flexbox pr

  index.html           | body          min-height: 100%
  index.html           | div#app
  init-appshell        |   div         display:flex, flex-flow:column nowrap,
                                       width:100%, height:100vh
  init-appshell        |     Navbar    position:fixed
  --- COMPONENT BELOW ---
  <RequiredComponent>  |     div       this is a child of a flexbox
\*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
    const SETTINGS          = require('settings');
    const AppDefault        = require('view/AppDefault');
    const NetCreate         = require('view/netcreate/NetCreate');
    const DevUnisys         = require('view/dev-unisys/DevUnisys');
    const DevDB             = require('view/dev-db/DevDB');
    const DevReact          = require('view/dev-react/DevReact');
    const DevSession        = require('view/dev-session/DevSession');
//  const Prototype         = require('view/prototype/Prototype');
//  const D3Test            = require('view/d3test/D3Test');

    const Routes = [
      {
        path: '/',
        exact: true,
        component: NetCreate
      },
      {
        path: '/dev-unisys',
        component: DevUnisys
      },
      {
        path: '/dev-db',
        component: DevDB
      },
      {
        path: '/dev-react',
        component: DevReact
      },
      {
        path: '/dev-session',
        component: DevSession
      },
      {
        path: '/simple',
        component: (props) => {return HTML(props)}
      },
      {
        path: '*',
        restricted: false,
        component: NoMatch
      }
    ];


/** (2) ROUTED FUNCTIONS *****************************************************\
  Used by render()'s <Switch> to load a plain html page that is
  located at app/htmldemos/<route>/<route.html>

  index.html           | body          min-height: 100%
  index.html           | div#app
  init-appshell        |   div         display:flex, flex-flow:column nowrap,
                                       width:100%, height:100vh
  init-appshell        |     Navbar    position:fixed
  --- COMPONENT BELOW ---
  init-appshell.HTML() |     div       display:flex, flex-flow:column nowrap,
                                       width:100%
  init-appshell.HTML() |       iframe  flex:1 0 auto, border:0
\*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
  function HTML ( props ) {
    SETTINGS.ForceReloadOnNavigation();
    let loc = props.location.pathname.substring(1);
    loc  = '/htmldemos/'+loc+'/'+loc+'.html';
    return (
      <div style={{display:'flex', flexFlow:'column nowrap',
           width:'100%', height:'100%'}}>
        <iframe style={{flex:'1 0 auto',border:'0'}} src={loc} />
      </div>
    );
}

/** (3) NO ROUTE *************************************************************\
  Used by render()'s <Switch> when there are no matching routes
\*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
  function NoMatch ( props ) {
    let hash = props.location.pathname.substring(1);
    return (
      <Alert color="warning">No Match for route <tt>#{hash}</tt></Alert>
    );
  }

/** APPLICATION NAVBAR + SWITCHED ROUTER VIEW ********************************\

    The application shell consists of a navbar implemented with Reactstrap
    components and a React view associated with the current route via
    ReactRouter <Switch> and <Route>.

    The AppShell class is exported as the main module object for use with
    require() statements (thanks to brunch magic)

\*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/
class AppShell extends React.Component {
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ constructor
/*/ constructor(props) {
      super(props);
      this.toggle = this.toggle.bind(this);
      this.state = {
        isOpen: false
      };
    }

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Handle changes in state of his toggle switch
/*/ toggle() {
      this.setState({
        isOpen: !this.state.isOpen
      });
    }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Draw top navbar w/ menus. Add route information
  To add a new HTML, add the link to both the <Nav> and <Switch> staments.
  To add a new VIEW, load the component
/*/ render() {
      /// return component with matching routed view
      return (
        <div style={{display:'flex', flexFlow:'column nowrap', width:'100%', height:'100vh'}}>
          <Navbar fixed="top" light expand="md" style={{ backgroundColor:'#f0f0f0'}}>
            <NavbarBrand href="#">NetCreate August Demo</NavbarBrand>
            <NavbarToggler onClick={this.toggle} />
            <Collapse isOpen={this.state.isOpen} navbar>
            {/*/ (1) add navigation links here /*/}
              <Nav className="ml-auto" navbar>
            { /* extra menu items
                <NavItem>
                  <NavLink to="/d3forcedemo" tag={RRNavLink} replace>D3 ForceDemo</NavLink>
                </NavItem>
            */ }
                <UncontrolledDropdown direction="right" nav>
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
                  </DropdownMenu>
                </UncontrolledDropdown>
              </Nav>
            </Collapse>
          </Navbar>
          <div style={{height:'3.5em'}}>{/*/ add space underneath the fixed navbar /*/}</div>
          <Switch>
            {renderRoutes(Routes)}
          </Switch>
        </div>
      );
    } // render()
  } // AppShell()

/// EXPORT ROUTE INFO /////////////////////////////////////////////////////////
AppShell.Routes = Routes;

/// EXPORT REACT CLASS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = AppShell;
