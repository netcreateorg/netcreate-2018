/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Example of Sri's Module Style
  Designed to be more like C# in its lettercasing conventions

  * Pay attention to spacing and capitalization
  * Use the /// commants to designate major sections
  * Obey the spacing conventions in /// comments for typographic weight
  * Follow the order of sections
  * Group similar functions together under the right section

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/*/ imports happen at the very top, after the comment header
    for ease
/*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TYPE_CONSTANT_A = 'A';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_collection = [];

/// MODULE HELPER FUNCTIONS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** function names that begin with m_ are "module" helper functions. This way
 *  can always assume that such functions are the same file
 */
function m_Method() {
  // helper functions for the module begin with m_PascalCase within module
  m_collection.push('hello');
  return 'hello';
}

/// UTILITY FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** When you have 1-3 line  PURE function (no side effects), I will
 *  declare it as constant with lower case. If they are all similar then I will
 *  just stack them without separators. They should still be in their own
 *  functional section with the /// comment block format
 */
const u_Filter = arr => arr.filter(e => typeof e === 'string');
const u_Map = arr => arr.map(e => typeof e);

/// INLINE FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** In the case where you are declaring local functions, I use the convention
 *  of naming them f_function. That way I know they are defined somewhere local
 *  to the block of code, not somewhere else. They are all snakecase!
 *  Either arrow functions or function keywords are OK, though I tend to use
 *  the arrow functions for very short pure functions.
 *  Note that the only reason you would use these is if you need to access
 *  other variables in their parent scope (e.g. count). If you can write
 *  the function as a u_function or m_Function that might be preferable
 */
function m_Foo() {
  let count = 0;

  // helper functions
  function f_decrement() {
    count--;
  }
  const f_increment = () => count++;

  // cycle through data
  for (let i = 0; i < 10; i++) {
    f_increment();
    f_decrement();
  }
}

/// GENERAL FUNCTION NAMING ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
    Synchronous functions can follow the existing convention but use an
    'immediate' verb in the name like 'get/set' for simple data setting.
    The function should be SIDE EFFECT FREE.
/*/
function m_GetSomething() {}
function m_SetSomething() {}
/*/
    For API methods that operate on common kind of data structure
    or modeled concept, use verbs that use the nomenclature in
    use instead of just using Get/Set and include the concept or object
    that is being operated on. The implication is that you pick
    memorable, unique, and short names in your model design or
    mirror class/object declarations.
/*/
function QueueAction() {} // not SetAction
function ExecuteAction() {} // looks like it's related to QueueAction
/*/
    Asynchronous functions should use a 'waiting' type verb in the name
    (e.g. AwaitSomething, PromiseDoAThing) to imply that the call is asynchronous. \
    Can also use `ma_` prefix for module functions.
/*/
async function m_AwaitSomething() {}
async function ma_ProcessTaskList() {}
function API_PromiseLoadConfig() {}
/*/
    At times you'll be working on a big messy prototype function.
    If you plan on making intermediate "progress" commits to the repo,
    consider naming those big messy functions as WIP_.
/*/
function WIP_DoSomething() {}

/// ASYNC CALLBACKS & EVENTS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
    Handlers that are fired as a callback should be named to imply
    that they are delivering a result. I use cb or cb_ to make
    this distinct from an event handler or functional parameter.
    Note the use of snake_case, similar to inline functions.
    If the callback has to do more work, have it call a higher-
    level function or API method to keep the callback nice and small.
/*/
const cb_timer_expired = () => console.log('expired');
setInterval(cb_timer_expired, 1000);
/*/
    Event handlers come in two flavors: as the immediate handler that
    is registered or subscribed to a source, and the specific
    work that is done. DO NOT COMBINE THEM. In general, your immediate
    handlers should be short and call a higher-level function/method
    that follows our general function naming conventions. This is the
    old wrong way:

      SubmitButton.subscribe('click', HandleClick);
      // handle clicks
      function HandleClick() {
        // save stuff to database
        const DB = GetDB();
        const { data } = GetFormData();
        DB.Write(data);
        // notify subscribers
        SYSTEM.NotifySubscribers(data);
      }

    This is sub-literate code because (1) function names reflect the
    name of a UI event, not what the context of the button does and
    (2) there are side effects that are not hinted by the function
    name (3) these operations are not managed by a single module
    where one would expect to find such operaetions.

    Instead, split the things up using arrow functions that are
    for DISPATCHING the event to an appropriate handler. This allows
    you to centralize action processing. Talk to Sri for more examples
/*/
// this is a dummy declaration of an appcore module, which is
// the only type of module that can talk to both UI and DATA
// modules. It's equivalent to a controller in MVC.
const APPCORE_DATASUBMIT = {
  HandleFormSubmit: function (event, param) {
    const { target } = event;
    // determine what to do based on current state of application
    // do the things
  }
};
// this is a dummy component that is a UI element
const DummySubmitButton = {};
DummySubmitButton.on('click', event =>
  APPCORE_DATASUBMIT.HandleFormSubmit(event, 'param')
);

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** class declarations are used instead of API METHODS. If you are
 *  declaring a class, generally there is only one per file because
 *  you're making an object hierarchy. Name the file `class-classname.js`
 *
 *  The exceptio to the "one class per file" rule is they are related
 *  or derived classes that extend each other. In this case, name the
 *  file `classes-baseclass.js`
 */
class MyClass {
  // insert this stub to prevent prettier from collapsing it
  publicZ = 'Z'; // public field syntax from ES2022
  #privateY = 1; // private field syntax

  /** prior to ES2022, we would manually initialize all
   *  the properties even if undefined in the constructor
   *  so they were documented.
   */
  constructor() {
    console.log('z', this.publicZ);
    console.log('y', this.#privateY);
  }

  /// INNER SECTION ///////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// at times you might want to divide-up long classes, so you can use the same
  /// divider style. For extra style, crop the last characters to col 80

  /** Include a JSDOC comment if needed, and keep a space between
   *  each method. Group and order methods logically. For our own
   *  classes, we implement
   */
  MyClassMethod() {
    /* _NOT_ following lowercase method conventions because C# */
    m_collection.push(this.publicZ);
  }
} // end MyClass

// class static declarations (old style but preferable)
MyClass.StaticMethod = () => {
  /* properties attached to class declaration are class-wide (static) */
  /* and accessible by instances, but can not access instance vars (duh) */
};
MyClass.STATIC_CONSTANT = 'foo';
MyClass.staticProperty = 'bar';

/// API: METHODS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// For a major section consisting of multiple functions, you can describe the
/// section's purpose briefly with the /// comment style. Make sure all the
/// spacing rules are adherered to
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a function comment: note that the JSDOC styling here starts on the top line,
 *  and below a /// divider. The subsequent lines are aligned with the top
 *  line this improves readability with the straight left edge,
 */
function PublicA() {}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** alternatively, put the prefix API_ in the name to make it super-clear what
 *  is intended for a public methods. Rename it as an export, though, as
 *  module.exports = { PublicB: API_PublicB }
 */
function API_PublicB() {}

/// API: ANOTHER SECTION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// add as many groups as you need
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// optionally you can include 'group constants' and 'group module functions'
/// before the actual functions
const FISH_FOOD = 'yucky bugs';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function FeedFish() {
  console.log('fish are fed with', FISH_FOOD);
}

/// RUNTIME INIT //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// any code that runs when module is loaded. ALWAYS PUT THIS AT THE END
/// of the module!!!
(async function () {
  /*/
  use "immediately-invoked function express" (IIFE) for scope safety
  though you probably don't need to
  /*/
})();

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// for compatibility with ES6 modules, we are now exporint public API
/// methods like this. You don't need to export everything. DO NOT EXPORT
/// function that are helpers or utilities. Instead, turn them into an
/// API function if you MUST share them, or possibly concentrate them in
/// a utility module of some kind if they are reusable.
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  PublicA,
  PublicB: API_PublicB,
  MyClass
};

/// NOTE: COMMENTING EXAMPLES ///
/// use the short form of headers with leading and trailing /// for callouts
/// triple-slash comments are used to align with this style of header

/* C-style functions are used to highlight a gotchya or note future action */
/* TODO: Example Stuff Here */

// double-slash comments are used to identify logical sections in functions
// double-slash comments are also used to describe a line
// double-slash comments also help identify nested block ownership

/** An Extended Comment Block *************************************************\

  Use these to describe an upcoming chunk of code or section(s) at a high
  level, perhaps with terse example usage

\*****************************************************************************/

/*/ This style of comment is used for blocks of text that are are commentary
    or placeholders to "think out loud". Visually they are less heavy-weight than
    the extended comment block format.
/*/

/*/
    Alternatively you can stack them like this.
    The general goal is to maintain a multiple of two space indents,
    while also maintaining a STRAIGHT LEFT EDGE to assist in scanning.
    This style is nice because of the symmetry and enforced spacing
    that separates the comment from its surroundings.
/*/
