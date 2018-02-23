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

const AppDefault = require('view/AppDefault');

	// emit warning for unmatched routes
	function NoMatch ( props ) {
		let hash = props.location.pathname.substring(1);
		return (
			<Alert color="warning">No Match for route <tt>#{hash}</tt></Alert>
		);
	}
	// test component
	function About ( props ) {
		return (
			<p>This is the "About" Test Function</p>
		);
	}
	// test component
	function Install ( props ) {
		return (
			<p>This is the "Install" Test Function</p>
		);
	}
	// test component
	function Test ( props ) {
		let loc = props.location.pathname.substring(1);
		return (
			<p>Requesting '{loc}'...</p>
		);
	}

module.exports = class AppShell extends React.Component {
	constructor(props) {
		super(props);

		this.toggle = this.toggle.bind(this);
		this.state = {
			isOpen: false
		};
	}
	toggle() {
		this.setState({
			isOpen: !this.state.isOpen
		});
	}
	render() {
		return (
			<div>
				<Navbar fixed="top" light expand="md" style={{ backgroundColor:'#f0f0f0' }}>
					<NavbarBrand href="#">NetCreate</NavbarBrand>
					<NavbarToggler onClick={this.toggle} />
					<Collapse isOpen={this.state.isOpen} navbar>
						<Nav className="ml-auto" navbar>
							<NavItem>
								<NavLink to="/about" activeClassName="active" tag={RRNavLink} replace>About</NavLink>
							</NavItem>
							<NavItem>
								<NavLink to="/install" tag={RRNavLink} replace>Install</NavLink>
							</NavItem>
							<UncontrolledDropdown nav>
								<DropdownToggle nav caret>
									Tests
								</DropdownToggle>
								<DropdownMenu>
									<DropdownItem>
										<NavLink to="/test1" tag={RRNavLink} replace>Test 1</NavLink>
									</DropdownItem>
									<DropdownItem>
										<NavLink to="/test2" tag={RRNavLink} replace>Test 2</NavLink>
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
					<Route path='/' exact component={AppDefault}/>
					<Route path='/about' component={About}/>
					<Route path='/install' component={Install}/>
					<Route path='/test1' component={Test}/>
					<Route path='/test2' component={Test}/>
					<Route path='/test3' component={Test}/>
					<Route component={NoMatch}/>
				</Switch>
			</div>
		);
	}
}
