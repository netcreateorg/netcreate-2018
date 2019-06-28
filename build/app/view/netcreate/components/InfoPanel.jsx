/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

  InfoPanel shows a tab panel for selecting:
  * hiding (showing the Graph)
  * Nodes Table
  * Edges Table
  * Help

  The panel itself can be resized vertically.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var DBG = true;

/// UNISYS INITIALIZE REQUIRES for REACT ROOT /////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS = require('unisys/client');

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const ReactStrap = require('reactstrap');
const { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Button } = ReactStrap;
const classnames = require('classnames');

const Help = require('./Help');
const Vocabulary = require('./Vocabulary');
const NodeTable = require('./NodeTable');
const EdgeTable = require('./EdgeTable');


/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class InfoPanel extends UNISYS.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeTab: '1',
      tabpanelTop: '0',
      draggerMouseOffsetY: '0',   // Mouse click position inside dragger
                                  // Allows user to grab dragger from the middle
      tabpanelHeight: '50px',
      tableHeight: '350px',
      savedTabpanelHeight: '350px',
      draggerTop: 'inherit',
      hideDragger: true
    }

    this.toggle = this.toggle.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.endDrag = this.endDrag.bind(this);
    this.handleDrag = this.handleDrag.bind(this);

  } // constructor



  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/
  /*/
  toggle(tab) {
    window.event.stopPropagation();
    if (this.state.activeTab !== tab) {
      this.setState({ activeTab: tab });
      if ((tab === `1`) ||  (tab === '5')) {
        this.setState({
          tabpanelHeight: '50px', // show only tab buttons
          hideDragger: true
        });
      } else {
        this.setState({
          tabpanelHeight: this.state.savedTabpanelHeight,
          hideDragger: false
        });
      }
    } else {
      // Second click on currently open tab
      // so select tab 1
      this.setState({ activeTab: `1` });
      this.setState({
        tabpanelHeight: '50px', // show only tab buttons
        hideDragger: true
      });
    }
  }

  handleMouseDown(e) {
    e.stopPropagation();

    let dragger = e.target;
    this.setState({ draggerMouseOffsetY: dragger.offsetTop - e.clientY });

    document.onmouseup = this.endDrag;
    document.onmousemove = this.handleDrag;
  }
  handleDrag(e) {
    e.stopPropagation();
    let top = e.clientY + this.state.draggerMouseOffsetY;
    this.setState({
      tabpanelHeight: (top - this.state.tabpanelTop) + 'px',
      tableHeight: (top - this.state.tabpanelTop - 95) + 'px',    // Hacked tab button + thead offset
      draggerTop: top + 'px',
      savedTabpanelHeight: (top - this.state.tabpanelTop) + 'px'  // remember height when switching tabs
    });
  }
  endDrag() {
    document.onmouseup = null;
    document.onmousemove = null;
  }


  /// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ This is not yet implemented as of React 16.2.  It's implemented in 16.3.
      getDerivedStateFromProps (props, state) {
        console.error('getDerivedStateFromProps!!!');
      }
  /*/
  /*/ This this fires after render().
  /*/
  componentDidMount() {
    let tabpanel = document.getElementById('tabpanel');
    this.setState({
      tabpanelTop: tabpanel.offsetTop
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/
  /*/
  render() {
    let { tabpanelHeight, tableHeight, hideDragger, draggerTop } = this.state;
    return (
      <div>
        <div id='tabpanel'
          style={{ height: tabpanelHeight, overflow: 'hidden', backgroundColor: '#eee', padding: '5px' }}>
          <Nav tabs>
            <NavItem>
              <NavLink
                className={classnames({ active: this.state.activeTab === '1' })}
                onClick={() => { this.toggle('1'); this.sendGA('Graph', window.location); } }
              >
                Graph
                        </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: this.state.activeTab === '2' })}
                onClick={() => { this.toggle('2'); this.sendGA('Nodes Table', window.location); }}
              >
                Nodes Table
                        </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: this.state.activeTab === '3' })}
                onClick={() => { this.toggle('3'); this.sendGA('Edges Table', window.location); }}
              >
                Edges Table
                        </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: this.state.activeTab === '4' })}
                onClick={() => { this.toggle('4'); this.sendGA('Vocabulary', window.location); }}
              >
                Vocabulary
                        </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: this.state.activeTab === '5' })}
                onClick={() => { this.toggle('5'); this.sendGA('Help', window.location); }}
              >
                Help
                        </NavLink>
            </NavItem>
          </Nav>
          <TabContent activeTab={this.state.activeTab} >
            <TabPane tabId="1">
            </TabPane>
            <TabPane tabId="2">
              <Row>
                <Col sm="12">
                  <NodeTable tableHeight={tableHeight} />
                </Col>
              </Row>
            </TabPane>
            <TabPane tabId="3">
              <Row>
                <Col sm="12">
                  <EdgeTable tableHeight={tableHeight} />
                </Col>
              </Row>
            </TabPane>
            <TabPane tabId="4">
              <Row>
                <Col sm="12">
                  <Vocabulary tableHeight={tableHeight} />
                </Col>
              </Row>
            </TabPane>
            <TabPane tabId="5">
              <Row>
                <Col sm="12">
                  <Help />
                </Col>
              </Row>
            </TabPane>
          </TabContent>
        </div>

        <div id='dragger' hidden={hideDragger}
          style={{
            top: draggerTop,
            position: 'absolute', width: '100%', height: '10px', backgroundColor: 'gray',
            cursor: 'ns-resize'
          }}
          onMouseDown={this.handleMouseDown}
        ></div>

      </div>
    );
  }

  sendGA(actionType, url){

          let googlea = NC_CONFIG.googlea;
          if(googlea != "0"){
            ga('send', { hitType: 'event', eventCategory: 'Tab', eventAction: actionType, eventLabel: '' + url  });
          }
  }

} // class InfoPanel


/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = InfoPanel;
