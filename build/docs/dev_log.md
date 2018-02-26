DEV LOG for WEEK STARTING FEB 26 2018

Q. Can I easily add D3 to our framework?
A. The Brunch way says just NPM it. This works within the view modules, but not in simplehtml.
For that, load the library from CDN.


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

