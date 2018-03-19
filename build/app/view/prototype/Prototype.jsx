/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const ReactStrap = require('reactstrap');
const { InputGroup, InputGroupAddon, InputGroupText, Input } = ReactStrap;
const { Col, Button, Form, FormGroup, Label, FormText } = ReactStrap;
const { ListGroup, ListGroupItem } = ReactStrap;

/// OTHER COMPONENTS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const D3Root = require('./components/D3Root');


/*/ REACT COMPONENT ///////////////////////////////////////////////////////////
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
\* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
class Prototype extends React.Component {
	constructor () {
		super();
		this.handleClick.bind(this);
	}
	handleClick ( event ) {
		console.log(event);
	}
	render() {
		return (
		<div style={{display:'flex', flexFlow:'row nowrap',
		     width:'100%', height:'100%'}}>
			<div id="left" style={{backgroundColor:'#E0ffff', flex:'1 0 auto', padding:'10px'}}>
				<h3>Nodes</h3>
				<ListGroup>
					<ListGroupItem onClick={this.handleClick}>Click Me Cras justo odio</ListGroupItem>
					<ListGroupItem>Dapibus ac facilisis in</ListGroupItem>
					<ListGroupItem>Morbi leo risus</ListGroupItem>
					<ListGroupItem>Porta ac consectetur ac</ListGroupItem>
					<ListGroupItem>Vestibulum at eros</ListGroupItem>
				</ListGroup>
			</div>
			<div id="middle" style={{backgroundColor:'#ffE0ff', flex:'3 0 auto', padding:'10px'}}>
				<D3Root/>
			</div>
			<div id="right" style={{backgroundColor:'#ffffE0', flex:'1 0 auto', padding:'10px'}}>
				<h3>Edges</h3>
				<ListGroup>
					<ListGroupItem>Cras justo odio</ListGroupItem>
					<ListGroupItem>Dapibus ac facilisis in</ListGroupItem>
					<ListGroupItem>Morbi leo risus</ListGroupItem>
					<ListGroupItem>Porta ac consectetur ac</ListGroupItem>
					<ListGroupItem>Vestibulum at eros</ListGroupItem>
				</ListGroup>
			</div>
		</div>
		);
	}
	componentDidMount () {
		console.log('Prototype mounted');
	}
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Prototype;
