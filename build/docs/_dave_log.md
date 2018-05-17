DEV LOG for WEEK STARTING MAR 19

Last week recovered from cold and executive function disorders! This week should be more productive. Got the HTML skeleton in, now to start porting the data into a placeholder data model from Ben's demo.

- - -
Q. How to load the data? What does it look like anyway?
A. Currently it's a json file in htmldemo. It's just a bunch of properties. I'm going to remove the ones that are visual coding related (color, xy, etc)

{
  {
      "label" : "Walter Wyman",
      "id"    : "129",
      "attributes": {
        "Node_Type"         : "Person",
        "Modularity Class"  : "42",
        "Extra Info"        : "1897",
        "Notes" : "published influential report,1897  argued that pestis bacteria traveled person to person  "
      }
  },
  ...
}

- - -
SIDE NOTE: Because the attributes are likely to change, this makes me think that I want to avoid using a relational database and use an object store instead. MongoDB seems to be the hotness, so we'll use that. It's also possible to use a pure NodeJS based approach, which might be convenient since it won't require installing an additional daemon, but the advantage of using MongoDB is that Kalani can do her own queries on it. That is probably useful. We'll explore using a Node-based NoSQL database (e.g. NoSQL on npm) just for local settings.

For now, we'll implement just a data module that loads an arbitrary json file.

- - -
Q. Where do we load the system/datastore module?
A. For our React primary view, this is routed by init-appshell.jsx into view/prototype/Prototype.jsx. We don't yet have a module initialization convention, so it's time to define one.

- - -
Q. Examples of Javascript Asynchronous Operations
A. See Quiver INQ NETCREATE "RAW: Universal Events" for the working list I came up with. There are a LOT of them.
A. See WIKI Design: Asynchronous Practices for writeup

- - -
Q. write unisys lifecycle support code?
A. well, we're using .Hook() to get into the lifecycle stages.
We want to create something like SYSLOOP. Starting to put it all together.

I've made event/emitter, event/lifecycler, and network/messager all included as libraries in unisys.js

- - -
Q. How do I make these libraries return sane instances?
A. Just gotta push through with it...

- - -
Q. What's a clean structure for hooking lifecycles?

In the old system we had a Register('PHASE',function(){}) design. It was straightforward except for asynch phases like LOADASSETS. In those cases, I passed a "checkin object" that could be used to create more checkin objects, and when they all completed they would call checkin.Notify() and LOADASSETS would end.

In the new system, I attempted to use Promises as the general mechanism instead of passing a straightforward function, and the Promises would be executed in parallel through Promise.all(). However, there are two idiosyncracisies with Promises:
* You have to provide a function called an executor, which accepts resolve and reject.
* When you create a new Promise from the executor function, it is immediately executed. 

Because of the second point, the interface has to return a promiseGenerator function that is executed at PHASE EXECUTION time. So you are passing a function that returns a Promise that wraps another executor function that itself may contains asynchronous function callbacks. 

In LifeCycle.Execute(), the current mechanism grabs all the promise generator functions and creates an array of promises. It then does an await Promise.all()

* a regular function can be invoked as-is, and its return value can be checked. If it's a promise, put it on the promise stack

- - -
Q. Now that LifeCycle is done, what is the next thing?
A. Probably REACT integration!

I had some code for UISTATE that I want to add to UNISYS because it was pretty great. There are essentially two calls to implement.

UNISYS.SetState('NAMESPACE', stateObj);
UNISYS.State('NAMESPACE');
UNISYS.OnStateChange('NAMESPACE', (stateObj)=>{});

Ok, I've added them...now we want to test it by using SetState() and OnStateChange()
in both a module and in the React code.

IT WORKS, but the originating code that calls SetState() is getting echoing back through the OnStateChange() handler. I added a UniBridge stub class to serve as the liason for instanced UNISYS functions, though for now it just maintains a unique UID (aka a UNISYS ID) which can be passed to the emitter so filtering is possible. 

What I don't like is that you have to actually pass the UID in to both the OnStateChange() and SetState() calls for echo cancellation to work. Maybe a solution will come to me as I nap.








