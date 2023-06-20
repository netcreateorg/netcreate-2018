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
const SETTINGS = require('settings');
const Help = require('./Help');
const Vocabulary = require('./Vocabulary');
const ImportExport = require('./ImportExport');
const Template = require('./Template');

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
    const ISADMIN = SETTINGS.IsAdmin();
    return (
      <div className="help"
        style={{
          position: 'fixed',
          right: '10px',
          width: '50%',
          height: '90%',
          overflow: 'hidden',
          zIndex: '3000',
          padding: '10px',
          backgroundColor: '#fff', // match tab
          border: '1px solid #999',
          borderTop: 'none'
        }}
      >
        <div style={{
          height: '100%',
          overflow: 'hidden',
          padding: '10px'
        }}>
          <div id='tabpanel' >
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
              <NavItem>
                <NavLink
                  hidden={!ISADMIN}
                  className={classnames({ active: activeTab === '4' })}
                  onClick={() => { this.toggleTab('4') }}
                >
                  Edit Template
                </NavLink>
              </NavItem>
            </Nav>
          </div>
          <TabContent activeTab={activeTab} style={{
            height: '100%',
            overflow: 'scroll'
          }}>
            <TabPane tabId="1">
              {activeTab==="1" && <Help /> }
            </TabPane>
            <TabPane tabId="2">
              {activeTab==="2" && <Vocabulary /> }
            </TabPane>
            <TabPane tabId="3">
              {activeTab==="3" && <ImportExport /> }
            </TabPane>
            <TabPane tabId="4">
              {activeTab==="4" && <Template /> }
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
