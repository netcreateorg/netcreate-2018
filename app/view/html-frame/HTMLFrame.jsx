/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Root View for an IFrame-based HTML page

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// COMPONENT DECLARATION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function HTMLFrame(props) {
  SETTINGS.ForceReloadOnNavigation();
  let loc;
  if (props && props.location && props.location.pathname) {
    loc = props.location.pathname.substring(1);
  }
  loc = '/htmldemos/' + loc + '/' + loc + '.html';
  return (
    <div
      style={{
        display: 'flex',
        flexFlow: 'column nowrap',
        width: '100%',
        height: '100%'
      }}
    >
      <iframe style={{ flex: '1 0 auto', border: '0' }} src={loc} />
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = HTMLFrame;
