REACT Conventions
=================

class Chart extends React.Component {

  constructor (props) {
    super(props)
    this.toggle = this.toggle.bind(this)
    this.state = { look: 'stacked' }
  }
}


CLASS
*   Upper Case Class names

FUNCTION DEFINITIONS
*   CamelCase Function Names
*   Space between function and ()
*   No space around parameters

FUNCTION CALLS
*   No space between function and ()
