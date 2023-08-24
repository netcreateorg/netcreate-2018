/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

  InfoPanel shows a tab panel for selecting:
  * hiding (showing the Graph)
  * Filters
  * Nodes Table
  * Edges Table
  * More -- Export/Import, Vocabulary, Help

  The panel itself can be resized vertically.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const UNISYS = require('unisys/client');
const React = require('react');
const ReactStrap = require('reactstrap');
const { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Button } = ReactStrap;
const classnames = require('classnames');

const NodeTable = require('./NodeTable');
const EdgeTable = require('./EdgeTable');
const More = require('./More');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var UDATA = null;

const defaultTabPanelHeight = 42; // show only tab buttons, no gap

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class InfoPanel extends UNISYS.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeTab: '1',
      tabpanelTop: '0',
      draggerMouseOffsetY: '0', // Mouse click position inside dragger
      // Allows user to grab dragger from the middle
      tabpanelHeight: `${defaultTabPanelHeight}px`,
      tableHeight: '308px', // 350 - defaultTabPanelHeight
      savedTabpanelHeight: '350px',
      draggerTop: 'inherit',
      hideDragger: true,
      filtersSummary: ''
    };

    this.toggle = this.toggle.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.endDrag = this.endDrag.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.UpdateFilterSummary = this.UpdateFilterSummary.bind(this);
    this.OnClearBtnClick = this.OnClearBtnClick.bind(this);
    this.CloseMore = this.CloseMore.bind(this);

    UDATA = UNISYS.NewDataLink(this);
    UDATA.HandleMessage('FILTER_SUMMARY_UPDATE', this.UpdateFilterSummary);
    UDATA.HandleMessage('UI_CLOSE_MORE', this.CloseMore);
  } // constructor

  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/
  /*/
  toggle(tab) {
    window.event.stopPropagation();
    if (this.state.activeTab !== tab) {
      this.setState({ activeTab: tab });
      if (tab === `1` || tab === '6') {
        // graph or help
        this.setState({
          tabpanelHeight: `${defaultTabPanelHeight}px`, // show only tab buttons
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
        tabpanelHeight: `${defaultTabPanelHeight}px`, // show only tab buttons
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
    // limit to 122 to keep from dragging up past the tabpanel
    // 122 = navbar + tabpanel height
    let top = Math.max(
      122,
      e.clientY + this.state.draggerMouseOffsetY + defaultTabPanelHeight
    );
    this.setState({
      tabpanelHeight: top - this.state.tabpanelTop - 40 + 'px',
      tableHeight: top - this.state.tabpanelTop - 40 - defaultTabPanelHeight + 'px',
      savedTabpanelHeight: top - this.state.tabpanelTop - 40 + 'px' // remember height when switching tabs
    });
  }
  endDrag() {
    document.onmouseup = null;
    document.onmousemove = null;
  }

  UpdateFilterSummary(data) {
    this.setState({ filtersSummary: data.filtersSummary });
  }

  OnClearBtnClick() {
    UDATA.LocalCall('FILTER_CLEAR');
  }

  CloseMore() {
    this.toggle('1');
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

  componentWillUnmount() {
    UDATA.UnhandleMessage('FILTER_SUMMARY_UPDATE', this.UpdateFilterSummary);
    UDATA.UnhandleMessage('UI_CLOSE_MORE', this.CloseMore);
  }

  shouldComponentUpdate(props) {
    return true;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/
  /*/
  render() {
    const {
      activeTab,
      tabpanelHeight,
      tableHeight,
      hideDragger,
      draggerTop,
      filtersSummary
    } = this.state;
    //send flag in with tableheight
    return (
      <div>
        <div
          id="tabpanel"
          style={{
            height: tabpanelHeight,
            overflow: 'hidden',
            backgroundColor: '#eee'
          }}
        >
          <Nav tabs className="">
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === '1' })}
                onClick={() => {
                  this.toggle('1');
                  this.sendGA('Graph', window.location);
                }}
              >
                Graph
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === '3' })}
                onClick={() => {
                  this.toggle('3');
                  this.sendGA('Nodes Table', window.location);
                }}
              >
                Nodes Table
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === '4' })}
                onClick={() => {
                  this.toggle('4');
                  this.sendGA('Edges Table', window.location);
                }}
              >
                Edges Table
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === '6' })}
                onClick={() => {
                  this.toggle('6');
                  this.sendGA('Help', window.location);
                }}
              >
                More...
              </NavLink>
            </NavItem>
          </Nav>
          <TabContent
            activeTab={activeTab}
            style={{
              height: '100%',
              overflow: 'hidden',
              backgroundColor: 'rgba(0,0,0,0.1)'
            }}
          >
            <TabPane tabId="1"></TabPane>
            <TabPane tabId="3">
              <Row>
                <Col sm="12">
                  {activeTab === '3' && <NodeTable tableHeight={tableHeight} />}
                </Col>
              </Row>
            </TabPane>
            <TabPane tabId="4">
              <Row>
                <Col sm="12">
                  {activeTab === '4' && <EdgeTable tableHeight={tableHeight} />}
                </Col>
              </Row>
            </TabPane>
            <TabPane tabId="6">
              <More />
            </TabPane>
          </TabContent>
        </div>

        <div
          id="dragger"
          hidden={hideDragger}
          style={{
            position: 'relative',
            top: '0px',
            left: '0px',
            right: '0px',
            height: '10px',
            backgroundColor: 'gray',
            cursor: 'ns-resize'
          }}
          onMouseDown={this.handleMouseDown}
        ></div>

        <div
          hidden={!hideDragger || filtersSummary === ''}
          style={{
            padding: '3px 5px',
            fontSize: '0.8em',
            textAlign: 'right',
            color: '#fff',
            backgroundColor: '#3339'
          }}
        >
          {filtersSummary}&nbsp;
          <Button
            size="sm"
            outline
            onClick={this.OnClearBtnClick}
            style={{
              color: '#eee',
              borderColor: '#ddd',
              fontSize: '0.8em',
              padding: '0.1rem 0.2rem'
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>
    );
  }

  sendGA(actionType, url) {
    let googlea = NC_CONFIG.googlea;
    if (googlea != '0') {
      ga('send', {
        hitType: 'event',
        eventCategory: 'Tab',
        eventAction: actionType,
        eventLabel: '' + url
      });
    }
  }
} // class InfoPanel

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = InfoPanel;
