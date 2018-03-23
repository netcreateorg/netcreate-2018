/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    EXAMPLE USE OF REACT-FAUX-DOM
    https://codesandbox.io/s/github/tibotiber/rfd-animate-example/tree/master/

    This is an example use of react-faux-dom. React provides the UI
    scaffolding. How does it work?

    (1) the component is exported through withFauxDOM( Component ),
    which adds several new methods to props for use during the lifecycle.

    (2) D3 makes the faux element available to react as a prop through
    this call at the beginning of componentDidMount()
      var faux = this.props.connectFauxDOM('div', 'chart')
    where 'div' is the element to create, and 'chart' is what is stored
    as a prop (see step 4)

    (3) Use the faux DOM element with D3 using D3 conventions.

    (4) render() with {this.props.chart} in the JSX wrapper.

    You can have multiple faux nodes to D3 with! See the docs for
    react-faux-dom connectFauxDOM().

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/



/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const d3 = require('d3');
const { withFauxDOM } = require('react-faux-dom');



/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class Chart extends React.Component {

  constructor (props) {
    super(props)
    this.toggle = this.toggle.bind(this)
    this.state = { look: 'stacked' }
  }

  render () {
    return (
      <div>
        <button onClick={this.toggle}>Toggle</button>
        {this.props.chart}
      </div>
    )
  }

  toggle () {
    if (this.state.look === 'stacked') {
      this.setState({ look: 'grouped' })
      this.transitionGrouped()
    } else {
      this.setState({ look: 'stacked' })
      this.transitionStacked()
    }
  }

  componentDidMount () {
    // This will create a faux div and store its virtual DOM
    // in state.chart
    var faux = this.props.connectFauxDOM('div', 'chart')

    var component = this

    /*
       D3 code below by Mike Bostock, https://bl.ocks.org/mbostock/3943967
       The only changes made for this example are...
       1) feeding D3 the faux node created above
       2) calling this.animateFauxDOM(duration) after each animation kickoff
       3) attaching the radio button callbacks to the component
       4) deleting the radio button (as we do the toggling through the react button)
    */

    var n = 4 // number of layers
    var m = 58 // number of samples per layer
    var layers = d3.stack().keys(d3.range(n))(d3.transpose(d3.range(n).map(function () { return bumpLayer(m, 0.1) })))
    var yGroupMax = d3.max(layers, function (layer) { return d3.max(layer, function (d) { return d[1]-d[0] }) })
    var yStackMax = d3.max(layers, function (layer) { return d3.max(layer, function (d) { return d[1] }) })

    var margin = {top: 40, right: 10, bottom: 20, left: 10}
    var width = 960 - margin.left - margin.right
    var height = 500 - margin.top - margin.bottom

    var x = d3.scaleBand()
        .domain(d3.range(m))
        .rangeRound([0, width])
        .padding(0.08)

    var y = d3.scaleLinear()
        .domain([yStackMax, 0])
        .range([height, 0])

    var color = d3.scaleLinear()
        .domain([0, n - 1])
        .range(['#aad', '#556'])

    var xAxis = d3.axisBottom(x)
        .tickSize(0)
        .tickPadding(6)

    var svg = d3.select(faux).append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    var layer = svg.selectAll('.layer')
        .data(layers)
      .enter().append('g')
        .attr('class', 'layer')
        .style('fill', function (d, i) { return color(i) })

    var rect = layer.selectAll('rect')
        .data(function (d) { return d })
      .enter().append('rect')
        .attr('x', function (d, i) { return x(i) })
        .attr('y', height)
        .attr('width', x.bandwidth())
        .attr('height', 0)

    rect.transition()
        .delay(function (d, i) { return i * 10 })
        .attr('y', function (d) { return height - y(d[1]) })
        .attr('height', function (d) { return y((d[1] - d[0])) })

    this.props.animateFauxDOM(800)

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis)

    this.transitionGrouped = function () {
      y.domain([0, yGroupMax])

      rect.transition()
          .duration(500)
          .delay(function (d, i) { return i * 10 })
          .attr('x', function (d, i) { return x(i) + x.bandwidth() / n * this.parentNode.__data__.key; })
          .attr('width', x.bandwidth() / n)
        .transition()
          .attr('y', function (d) { return y(d[1] - d[0]) })
          .attr('height', function (d) { return height - y(d[1] - d[0]) })

      component.props.animateFauxDOM(2000)
    }

    this.transitionStacked = function () {
      y.domain([yStackMax, 0])

      rect.transition()
          .duration(500)
          .delay(function (d, i) { return i * 10 })
          .attr('y', function (d) { return height - y(d[1]) })
          .attr('height', function (d) { return y(d[1] - d[0]) })
        .transition()
          .attr('x', function (d, i) { return x(i) })
          .attr('width', x.bandwidth())

      component.props.animateFauxDOM(2000)
    }

    // Inspired by Lee Byron's test data generator.
    function bumpLayer (n, o) {
      function bump (a) {
        var x = 1 / (0.1 + Math.random())
        var y = 2 * Math.random() - 0.5
        var z = 10 / (0.1 + Math.random())
        for (var i = 0; i < n; i++) {
          var w = (i / n - y) * z
          a[i] += x * Math.exp(-w * w)
        }
      }

      var a = []
      var i
      for (i = 0; i < n; ++i) a[i] = o + o * Math.random()
      for (i = 0; i < 5; ++i) bump(a)
      return a.map(function (d) { return Math.max(0, d) })
    }
  }
}

Chart.defaultProps = {
  chart: 'loading'
}



/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FauxChart = withFauxDOM(Chart);
module.exports = FauxChart;
