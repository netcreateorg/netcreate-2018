/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const D3 = require('d3');
const D3Shell = require('./components/D3Shell');



/// React Component ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class D3Test extends React.Component {
	render() {
		return (
			<D3Shell />
		);
	}
	componentDidMount () {
		console.log('D3',D3);
	}
}



/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = D3Test;

