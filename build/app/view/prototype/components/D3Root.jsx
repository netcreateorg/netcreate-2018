/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    D3 INTEGRATION NOTES

    We're using react-faux-dom to provide the D3 integration within React.
    Read this for reason: https://medium.com/@tibotiber/4da35f912484

    Since D3 and React have competing update methods with the DOM, the
    react-faux-dom approach creates the bridge by making a FAKE DOM that
    is good enough to fool D3, and provides the glue to React update cycles.

    The gist is that you can write pure d3 inside of the React component
    and it generally is supposed to work.

    In this prototype, <D3Root> is included by <Prototype>, which is loaded
    by the init-appshell router <Switch>. I think we can write a fancy
    render() that selectively changes views.

    Prototype
      div#left
      div#middle
        D3Root <--- this component
      div#right

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const ReactStrap = require('reactstrap');
const { Row, Col, Card, CardTitle, CardText, Button } = ReactStrap;
const { TabContent, TabPane } = ReactStrap;
const { Nav, NavItem, NavLink } = ReactStrap;
const classnames = require('classnames');

/// OTHER COMPONENTS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const D3Chart = require('./D3ChartExample');
const RSFormExample = require('./RSFormExample');



/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class D3Root extends React.Component {

  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      activeTab: '1'
    };
  }

  toggle(tab) {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab
      });
    }
  }


  render() {
    return (
    <div>
      <Nav pills>
        <NavItem>
          <NavLink
          className={classnames({ active: this.state.activeTab === '1' })}
          onClick={() => { this.toggle('1'); }}
          >
          D3 Chart Example
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
          className={classnames({ active: this.state.activeTab === '2' })}
          onClick={() => { this.toggle('2'); }}
          >
          ReactStrap Form Example
          </NavLink>
        </NavItem>
      </Nav>

      <TabContent activeTab={this.state.activeTab}>
        <TabPane tabId="1">
          <D3Chart />
        </TabPane>
        <TabPane tabId="2">
          <RSFormExample/>
        </TabPane>
      </TabContent>
    </div>
    );
  }
  componentDidMount () {
    console.log('D3Root mounted');
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = D3Root;
