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

/// OTHER COMPONENTS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const D3Chart = require('./D3ChartExample');



/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class D3Root extends React.Component {
	render() {
		return (
		<div>
			<D3Chart />
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
