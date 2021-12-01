/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

  "More" displays:
  * Export/Import
  * Help
  * Vocabulary



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var DBG = false;
var UDATA = null;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const ReactStrap   = require('reactstrap');
const { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Button } = ReactStrap;
const classnames = require('classnames');
const Help = require('./Help');
const Vocabulary = require('./Vocabulary');
const ImportExport = require('./ImportExport');

const UNISYS   = require('unisys/client');


/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class More extends UNISYS.Component {
  constructor (props) {
    super(props);
    this.state = {
      isExpanded: true,
      activeTab: '1'
    };
    this.toggleTab = this.toggleTab.bind(this);
    this.onToggleExpanded = this.onToggleExpanded.bind(this);

    UDATA = UNISYS.NewDataLink(this);
  } // constructor


  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  toggleTab(tab) {
    window.event.stopPropagation();
    if (this.state.activeTab !== tab) {
      this.setState({ activeTab: tab });
    }
  }

  onToggleExpanded(event) {
    this.setState({
      isExpanded: !this.state.isExpanded
    })
  }

/// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ This is not yet implemented as of React 16.2.  It's implemented in 16.3.
    getDerivedStateFromProps (props, state) {
      console.error('getDerivedStateFromProps!!!');
    }
/*/
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  render() {
    const { activeTab } = this.state;

    return (
      <div className="help"
        style={{
          overflow: 'scroll',
          position: 'fixed',
          right: '10px',
          width: '50%',
          zIndex: '3000'
        }}
      >
        <Button size="sm" outline hidden
          style={{float:'right'}}
          onClick={this.onToggleExpanded}
        >{this.state.isExpanded ? "Hide Help" : "Help"}</Button>
        <div hidden={!this.state.isExpanded}
          style={{backgroundColor:'rgba(240,240,240,0.95)',padding:'10px'}}>
          <div id='tabpanel'
            style={{ overflow: 'hidden', backgroundColor: '#eee'}}>
            <Nav tabs>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTab === '1' })}
                  onClick={() => { this.toggleTab('1') } }
                >
                  Help
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTab === '2' })}
                  onClick={() => { this.toggleTab('2') }}
                >
                  Vocabulary
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: activeTab === '3' })}
                  onClick={() => { this.toggleTab('3') }}
                >
                  Import / Export
                </NavLink>
              </NavItem>
            </Nav>
          </div>
          <TabContent activeTab={activeTab} style={{height:'100%',overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.1)'}}>
            <TabPane tabId="1">
              <Row>
                <Col sm="12">
                  {activeTab==="1" && <Help /> }
                </Col>
              </Row>
            </TabPane>
            <TabPane tabId="2">
              <Row>
                <Col sm="12">
                  {activeTab==="2" && <Vocabulary /> }
                </Col>
              </Row>
            </TabPane>
            <TabPane tabId="3">
              <Row>
                <Col sm="12">
                  {activeTab==="3" && <ImportExport /> }
                </Col>
              </Row>
            </TabPane>
          </TabContent>
        </div>
      </div>
    );
  }

} // class Help


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = More;
