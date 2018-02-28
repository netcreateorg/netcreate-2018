/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

	init-appshell.jsx
	application shell loaded by init.jsx

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/



/// REACT LIBRARIES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const {
	Alert,
	Collapse,
	Navbar,
	NavbarToggler,
	NavbarBrand,
	Nav,
	NavItem,
	NavLink,
	UncontrolledDropdown,
	DropdownToggle,
	DropdownMenu,
	DropdownItem
	} = require('reactstrap');
const {
	Switch,
	Route,
	Redirect,
	Link
	} = require('react-router-dom');
// workaround name collision in ReactRouterNavLink with ReactStrap
const RRNavLink = require('react-router-dom').NavLink;



/// REACT ROUTED COMPONENTS ///////////////////////////////////////////////////
/// These are the top-level React components ("view") that are mapped to routes
/// as seen in render() function's <Switch>. There are two styles:
/// (1) a loaded React 'view' that is built entirely with our modular app API
///     and displayed in this application shell.
/// (2) a plain .html file loaded into an IFRAME, useful for adding stand-alone
///     test code with access to the modular app API system, but not other web
///     apps (e.g. can use the data storage module)
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const AppDefault  = require('view/AppDefault');
const D3Test      = require('view/d3test/d3test');
const About       = require('view/about/about');
/// REACT ROUTING FUNCTIONS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Used by render()'s <Switch> to load a plain html page that is
/// located at app/htmldemos/<route>/<route.html>
function HTML ( props, width, height ) {
	let loc = props.location.pathname.substring(1);
	loc     = '/htmldemos/'+loc+'/'+loc+'.html';
	width   = width || '100%';
	height  = height || '750px';
	return (
		<div style={{display:'flex', flexFlow:'column nowrap', width:'100%', height:'100vh'}}>
			<div style={{height:'3.5em'}}></div>
			<iframe style={{flex:'1 0 auto',border:'0'}} src={loc} />
		</div>
	);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Used by render()'s <Switch> when there are no matching routes
function NoMatch ( props ) {
	let hash = props.location.pathname.substring(1);
	return (
		<Alert color="warning">No Match for route <tt>#{hash}</tt></Alert>
	);
}



/// APPLICATION NAVBAR + SWITCHED ROUTER VIEW /////////////////////////////////
/// The application shell consists of a navbar implemented with Reactstrap
/// components and a React view associated with the current route via
/// ReactRouter <Switch> and <Route>.
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class AppShell extends React.Component {
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Initialize application shell state
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
		/// demonstrate that STORE persists between clicks
		const STORE = require('system/datastore');
		STORE.Increment();

		/// return component with matching routed view
		return (
			<div style={{ display:'flex',flexFlow:'column nowrap'}}>
				<Navbar fixed="top" light expand="md" style={{ backgroundColor:'#f0f0f0'}}>
					<NavbarBrand href="#">NetCreate</NavbarBrand>
					<NavbarToggler onClick={this.toggle} />
					<Collapse isOpen={this.state.isOpen} navbar>
					{/*/ (1) add navigation links here /*/}
						<Nav className="ml-auto" navbar>
							<NavItem>
								<NavLink to="/about" activeClassName="active" tag={RRNavLink} replace>About</NavLink>
							</NavItem>
							<NavItem>
								<NavLink to="/d3forcedemo" tag={RRNavLink} replace>D3 Force Demo</NavLink>
							</NavItem>
							<UncontrolledDropdown nav>
								<DropdownToggle nav caret>
									Tests
								</DropdownToggle>
								<DropdownMenu>
									<DropdownItem>
										<NavLink to="/simple" tag={RRNavLink} replace>SimpleHTML</NavLink>
									</DropdownItem>
									<DropdownItem>
										<NavLink to="/d3test" tag={RRNavLink} replace>D3Test</NavLink>
									</DropdownItem>
									<DropdownItem divider />
									<DropdownItem>
										<NavLink to="/test3" tag={RRNavLink} replace>Test Descriptions</NavLink>
									</DropdownItem>
								</DropdownMenu>
							</UncontrolledDropdown>
						</Nav>
					</Collapse>
				</Navbar>
				<Switch>
				{/*/ (2) add route paths here /*/}
					<Route path='/' exact component={AppDefault}/>
					<Route path='/about' component={About}/>
					<Route path='/simple' component={ (props) => {return HTML(props)} }/>
					<Route path='/d3forcedemo' component={ (props) => {return HTML(props)} }/>
					<Route path='/d3test' component={D3Test}/>
					<Route component={NoMatch}/>
				</Switch>
			</div>
		);
	}
}



/// EXPORT REACT CLASS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = AppShell;
