/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

  InfoPanel shows a tab panel for selecting:
  * hiding (showing the Graph)
  * Filters
  * Nodes Table
  * Edges Table
  * Vocabulary
  * Help

  The panel itself can be resized vertically.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

var DBG = false;

/// UNISYS INITIALIZE REQUIRES for REACT ROOT /////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS = require('unisys/client');

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const ReactStrap = require('reactstrap');
const { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Button } = ReactStrap;
const classnames = require('classnames');

const FiltersPanel = require('./filter/FiltersPanel');
const NodeTable = require('./NodeTable');
const EdgeTable = require('./EdgeTable');
const Vocabulary = require('./Vocabulary');
const Help = require('./Help');

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
      hideDragger: true,
      filtersSummary: ''
    }

    this.toggle = this.toggle.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.endDrag = this.endDrag.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.UpdateFilterSummary = this.UpdateFilterSummary.bind(this);

    var UDATA = UNISYS.NewDataLink(this);
    UDATA.HandleMessage("FILTER_SUMMARY_UPDATE", this.UpdateFilterSummary);

  } // constructor



  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/
  /*/
  toggle(tab) {
    window.event.stopPropagation();
    if (this.state.activeTab !== tab) {
      this.setState({ activeTab: tab });
      if ((tab === `1`) || (tab === '6')) { // graph or help
        this.setState({
          tabpanelHeight: '50px', // show only tab buttons
          hideDragger: true,
          bIgnoreTableUpdates: true
        });
      } else {
        this.setState({
          tabpanelHeight: this.state.savedTabpanelHeight,
          hideDragger: false,
          bIgnoreTableUpdates: true
        });
      }
    } else {
      // Second click on currently open tab
      // so select tab 1
      this.setState({ activeTab: `1` });
      this.setState({
        tabpanelHeight: '50px', // show only tab buttons
        hideDragger: true,
        bIgnoreTableUpdates: true
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
    // limit to 80 to keep from dragging up past the tabpanel
    // 80 = navbar + tabpanel height
    let top = Math.max(80, e.clientY + this.state.draggerMouseOffsetY);
    this.setState({
      tabpanelHeight: (top - this.state.tabpanelTop - 40) + 'px',
      tableHeight: (top - this.state.tabpanelTop) + 'px',
      savedTabpanelHeight: (top - this.state.tabpanelTop - 40) + 'px',  // remember height when switching tabs
      bIgnoreTableUpdates: true // ignore this update at the table level if it is a large data set
    });
  }
  endDrag() {
    this.setState({bIgnoreTableUpdates: false})
    document.onmouseup = null;
    document.onmousemove = null;
  }

  UpdateFilterSummary(data) {
    this.setState({ filtersSummary: data.filtersSummary });
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

  shouldComponentUpdate(props) {
    return true;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/
  /*/
  render() {
    let { tabpanelHeight, tableHeight, hideDragger, draggerTop, bIgnoreTableUpdates, filtersSummary} = this.state;
    //send flag in with tableheight
    return (
      <div>
        <div id='tabpanel'
          style={{ height: tabpanelHeight, overflow: 'hidden', backgroundColor: '#eee'}}>
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
                onClick={() => { this.toggle('2'); this.sendGA('Filter', window.location); }}
              >
                Filters
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: this.state.activeTab === '3' })}
                onClick={() => { this.toggle('3'); this.sendGA('Nodes Table', window.location); }}
              >
                Nodes Table
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: this.state.activeTab === '4' })}
                onClick={() => { this.toggle('4'); this.sendGA('Edges Table', window.location); }}
              >
                Edges Table
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: this.state.activeTab === '5' })}
                onClick={() => { this.toggle('5'); this.sendGA('Vocabulary', window.location); }}
              >
                Vocabulary
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: this.state.activeTab === '6' })}
                onClick={() => { this.toggle('6'); this.sendGA('Help', window.location); }}
              >
                Help
              </NavLink>
            </NavItem>
          </Nav>
          <TabContent activeTab={this.state.activeTab} style={{height:'100%',overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.1)'}}>
            <TabPane tabId="1">
            </TabPane>
            <TabPane tabId="2">
              <FiltersPanel tableHeight={tableHeight} />
            </TabPane>
            <TabPane tabId="3">
              <Row>
                <Col sm="12">
                  <NodeTable tableHeight={tableHeight} bIgnoreTableUpdates={bIgnoreTableUpdates}/>
                </Col>
              </Row>
            </TabPane>
            <TabPane tabId="4">
              <Row>
                <Col sm="12">
                  <EdgeTable tableHeight={tableHeight} bIgnoreTableUpdates={bIgnoreTableUpdates} />
                </Col>
              </Row>
            </TabPane>
            <TabPane tabId="5">
              <Row>
                <Col sm="12">
                  <Vocabulary tableHeight={tableHeight} />
                </Col>
              </Row>
            </TabPane>
            <TabPane tabId="6">
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
            position: 'relative', top: '0px', left: '0px', right: '0px', height: '10px', backgroundColor: 'gray',
            cursor: 'ns-resize'
          }}
          onMouseDown={this.handleMouseDown}
        ></div>

        <div hidden={!hideDragger || filtersSummary===''}
          style={{ padding: '3px', fontSize: '0.8em', color:'#999', backgroundColor:'#eef'}}
        >
          FILTERED BY: {filtersSummary}
        </div>
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
