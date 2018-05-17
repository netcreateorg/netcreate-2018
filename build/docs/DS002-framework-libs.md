## FRAMEWORK DEPENDENT LIBRARIES

[Feb 19, 2018]

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

Q. Can I easily add D3 to our framework?
A. The Brunch way says just NPM it. This works within the view modules, but not in simplehtml.
For that, load the library from CDN.
