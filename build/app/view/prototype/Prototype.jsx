/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Prototype.jsx

    This is the main entrypoint for the Prototype react app. It's
    instantiated by init-appshell.jsx's <Router>. The DOM is stable when
    componentDidMount() is called (a REACT convention). At that point, we
    can initialize the rest of our system.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// SYSTEM INTEGRATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS = require('unisys/client');

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const ReactStrap = require('reactstrap');
const { InputGroup, InputGroupAddon, InputGroupText, Input } = ReactStrap;
const { Col, Button, Form, FormGroup, Label, FormText } = ReactStrap;
const { ListGroup, ListGroupItem } = ReactStrap;

/// REACT COMPONENTS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const D3Root = require('./components/D3Root');


/** REACT COMPONENT ***********************************************************
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
******************************************************************************/
class Prototype extends React.Component {

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/*/ REACT initialize local state, handlers and functions, and related glue
/*/ constructor () {
    super();
    this.handleClick.bind(this);
    /* UNISYS LIFECYCLE INITIALIZATION */
    // initialize UNISYS before declaring any hook functions
    UNISYS.SystemInitialize(module.id);
  }

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/*/ REACT root render() function for this view. Note that the base root is
  rendered in init.jsx, which itself loads init-appshell.jsx
/*/ render() {
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

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/*/ REACT has completely composed its view. Since Prototype is the root view
  of the application, this is where we would initialize the rest of our system
/*/ componentDidMount () {
      console.log('Prototype mounted');
    }

/** EVENT HANDLERS ***********************************************************/

    handleClick ( event ) {
      console.log(event);
    }

} // end of REACT component class

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = Prototype;
