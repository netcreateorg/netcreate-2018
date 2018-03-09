/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const ReactStrap = require('reactstrap');
const { InputGroup, InputGroupAddon, InputGroupText, Input } = ReactStrap;
const { Col, Button, Form, FormGroup, Label, FormText } = ReactStrap;

/** REACT COMPONENT **********************************************************\
\* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
class NodeEntry extends React.Component {
	render() {
		return (
		<div>
			<h3>Modify/Add NodeEntry</h3>
			<FormGroup row>
				<Label for="exampleEmail" sm={2}>Name (to sort on)</Label>
				<Col sm={10}>
					<Input type="text" name="name1" id="name1" placeholder="placeholder" />
				</Col>
			</FormGroup>
			<FormGroup row>
				<Label for="exampleEmail" sm={2}>Name2 (first?)</Label>
				<Col sm={10}>
					<Input type="text" name="name2" id="name2" placeholder="placeholder" />
				</Col>
			</FormGroup>
			<FormGroup row>
				<Label for="exampleEmail" sm={2}>Name3 (middle?)</Label>
				<Col sm={10}>
					<Input type="text" name="name3" id="name3" placeholder="placeholder" />
				</Col>
			</FormGroup>
			<FormGroup row>
				<Label for="exampleSelect" sm={2}>Select</Label>
				<Col sm={10}>
					<Input type="select" name="select" id="exampleSelect">
						<option>1</option>
						<option>2</option>
						<option>3</option>
					</Input>
				</Col>
			</FormGroup>
			<FormGroup row>
				<Label for="exampleEmail" sm={2}>Disambiguation</Label>
				<Col sm={10}>
					<Input type="text" name="disambiguation" id="disa1" placeholder="placeholder" />
				</Col>
			</FormGroup>
			<FormGroup row>
				<Label for="exampleText" sm={2}>Notes</Label>
				<Col sm={10}>
					<Input type="textarea" name="text" id="exampleText" rows="10"/>
				</Col>
			</FormGroup>
			<FormGroup row>
				<Label for="exampleText" sm={2}>Geocode or Date</Label>
				<Col sm={10}>
					<Input type="textarea" name="text" id="exampleText" rows="10"/>
				</Col>
			</FormGroup>
		</div>
		);
	}
	componentDidMount () {
		console.log('NodeEntry mounted');
	}
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NodeEntry;
