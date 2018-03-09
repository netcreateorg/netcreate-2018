DEV LOG for WEEK STARTING MAR 04 2018

I've been sick all this week and haven't been productive. Been angry at the Internet and imperfection, and this negative energy robs me of initiative. To develop zen attitude to terrible development tools, processes, etc would go a LONG WAY toward being more productive instead of being annoyed all the time. How to convert ANNOYANCE into CLARITY?

Q. There's a list of HTML input elements I need.
A. Let's just lay them in using ReactStrap...seems to work

Q. Now need to lay in some complete lists of stuff...wireframe!





DEV LOG for WEEK STARTING FEB 26 2018

Q. Can I easily add D3 to our framework?
A. The Brunch way says just NPM it. This works within the view modules, but not in simplehtml.
For that, load the library from CDN.

Q. How to think about Forms and Data Entry
A. Form Element Styling is less important now; we can assume on('event') is our main interface, and I need to look up FLEXBOXES

FLEXBOX - HOW DO THEY WORK
they are a single dimension collection
parent: display:flex, flex-flow: row nowrap // direction, wrapping
children: flex: 0 1 auto // grow shrink default size

FLEXBOX - HOW DOES BOOTSTRAP AFFECT THIS?
largely it doesn't if we are not using its grid layout, though I suspect there might be grid controls that do what we want.

Q. What is the Javascript Event Declaration Standard?
A. the current best practice is to use these:
   btn.addEventListener('click', function(event) {});
   btn.removeEventListener('click',function);
   btn.dispatchEvent('click',event);
A. See EventTarget interface: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
   these methods apply to certain high level objects.
A. See Event interface: https://developer.mozilla.org/en-US/docs/Web/API/Event

Q. What are the HTML5 Form Elements?
A. here is the canonical list:
   https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form

Q. What about fancier components?
A. catalog - https://github.com/brillout/awesome-react-components
A. List virtualizer - https://react.rocks/example/react-virtualized
A. A solution to rendering large lists is to use "virtualization"
   https://blog.jscrambler.com/optimizing-react-rendering-through-virtualization/

DEBUGGING IFRAME HEIGHT

	index.html           | body          min-height: 100%
	index.html           | div#app
	init-appshell        |   div         display:flex, flex-flow:column nowrap,
	                                     width:100%, height:100vh
	init-appshell        |     Navbar    position:fixed
	--- COMPONENT BELOW ---
	init-appshell.HTML() |     div       display:flex, flex-flow:column nowrap,
	                                     width:100%
	init-appshell.HTML() |       iframe  flex:1 0 auto, border:0

Q. How to control sizes in flexbox items?
A. flex-grow, flex-shrink, flex-basis (shortcut: flex)

flex-grow is set to 0 if no adaptive growing is desired.
.. set it to positive value "how fast to grow" relative to other siblings.
flex-shrink is set to 0 if no adaptive shrinking is desired.
.. set it to positive for "how fast to shrink" relative to other siblings.
flex-basis is the initial size of the box, and default to size of content.
.. set it to a size like 200px if you want it to be a fixed size

PREDICTIVE TYPING

Q. Where is there a nice REACT PREDICTIVE example to garbage trial?
A. https://github.com/moroshko/react-autosuggest#installation

Q. What are the new-to-me javascript bits to familiarize self with?
A. .map and .filter
map - produces new array from output of a transforming function
filter - produces new array from test result of filtering function

Q. What is ARIA and why should I care?
A. It's a set of assistive properties for devices like screenreaders. Properties describe what's happening with sliders of importance, for example, or what a button does.
A. Some React components have ARIA support built-in, or provide a means of setting it?

CSS GRID versus FLEXBOX

FLEXBOX works in 1 dimension, and uses content as basis (size)
GRID works in 2 dimensions, and uses layout as basis (size). It's newer.

GRID lets you define relationships in fr units for columns and rows
GRID defines sizes of grid element on numbered boundaries
display:grid
	grid-template-columns, grid-template-rows - uses sizes or new fr (fraction) units (explicit grid)
	use repeat(count,1fr) macro to make large grids
	grid-auto-rows and grid-auto-columns create new content that don't fit in explicit grid.
	grid-auto-rows: minmax(min,max) where min is minimum size, max can be set to auto
	grid-column-gap, grid-row-gap
ITEMS:
	for positioning, uses grid LINES, not the size of the grid tracks.
	grid-column-start, grid-column-end, grid-row-start, grid-row-end
	note: grid items can overlap, control stack with z-index


DEV LOG for WEEK STARTING FEB 19 2018

Q: Now that I have the module stuff figured out, can I load hyperapp merely by importing it?
A: No, hyperapp has some weird dependency on babel. there are no docs on brunch+hyperapp, and it looks like hyperapp may not even support JSX in future.

Q: Adding bootstrap 4. Instead of installing it into the dev environment, I'm copying bootstrap, jquery3.2.1, and popper.js into the vendor directory.
A: After figuring out how to modify brunch-config.js, I put this back into the package.json itself. Everything now runs cleanly on install.

Q: Let's add ReactBootstrap
A: Added reactstrap for 4.0.0, which adds react-popper and react-transition
Have to convert AppContainer to use the new reactstrap stuff

Q: Let's add Routing through ReactRouter
A: ReactRouter has issues loading as an 'import' compatible library
A: Changed all source to use CommonJS 'require'

Now that routing and components are available, can start to lay D3 into it. However, it would be nice to also just jump to a plain html file.








- - -
NOTE: BRUNCH BASICS

* modular code is in app/, but module names do not include app in the path
* the app/assets directory is special; it's copied as-is (without processing) to the root level of the public folder
* source code in app/ is grouped into 'javascripts', 'stylesheets', and 'templates'
* the vendor directory is also special; when included in a joinTo, it's always compiled-in first
* brunch looks at filename extensions to determine what to process with which file chain
* 'app', 'vendor', 'public' are relative to brunch-config.js file. Can modify with conventions.assets
* change source paths through paths.watched. change target folder in paths.public
* brunch wraps javascript in commonjs modules. exports, module.exports, and require() are available through its wrapper.
* brunch plugins just have to be in node_modules and it will work without additional config!

note: had to install babel, babel-brunch, and then also configure babel through babel-brunch's config in brunch-config.js (WHUT)

npm install --save-dev auto-reload-brunch

- - -
NOTE: COMMONJS BASICS

Set module.exports to an object. The module object is set up by the loader I think and passed to our module code as it executes
from: https://stackoverflow.com/questions/16383795

"module is a plain JavaScript object with an exports property. exports is a plain JavaScript variable that happens to be set to module.exports. At the end of your file, node.js will basically 'return' module.exports to the require function. A simplified way to view a JS file in Node could be this:"

Note that require() is a CommonJS function that loads CommonJS modules which is BRUNCH STANDARD. The ES6 module command is import() and is used by tools like Webpack. We can use both formats in brunch, but sometimes the browser seems to get confused and need to launch a new tab to clear state (???). Standardizing on Brunch's require() approach.

BRUNCH CONFIG

files.javascripts - 'joinTo' combines source files to designated destination file
files.stylesheets - 'joinTo' combines css files to designated destination file
files.templates   - 'joinTo' combines template to destination (???)

paths.public      - where to put compiled output files (default 'public')
paths.watched     - what paths to watch for changes (implication: all sources) (default 'app', 'test', 'vendor')

