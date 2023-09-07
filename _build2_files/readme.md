this is an alternate build system of new file organization leftover from the attempt for a quick conversion of source to replace brunch 2.x.

however, brunch 2.x is too weirdly shimmed to convert straightforwardly due to:

* various node.js browser shims that aren't present even in later versions of brunch
* a built-in require shim that duplicated the filesystem rather than looked at imports (?)
* nodejs strictness in handling modules

