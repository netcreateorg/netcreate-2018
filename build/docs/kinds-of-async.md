GULP is an example of chainable named tasks

* parallel (gulp parallel)
* sequence (run sequence)
* prerequisite tasks

* gulp is not re-entrant
* how do you write loop
* gulp callbacks ('task end event') can invoke another function


WHAT KIND OF INVOCATIONS

* react componentDidMount
* D3 enter, update, exit

Javascript asynchronous operations

* loading a file assets -> callback
* Promises
* await - async
* subscribers
* notifications
* callbacks
* anononymous functions
* closures, this binding
* hooks
* timers that invoke code regular
* asynchronous threads (webworkers and coroutines)
* Javascript User-generated UI events
* Server data requests
* chains of requests and multiple prerequisites
* Broadcast events to trigger code elsewhere
* Conditional event execution / error handling waiting
* Resource availability events (online/offline) error handling chain
* Multiple conditional chains of actions depending on success/failure
* Remote Procedure Call invocations (UNISYS)
* Four kinds of parameter: prequisites, acknowledgement/failure, data payload sent/forwarded/received, continuation (next invocation, chain, condition)
* System lifecycle phase events
* System change notification events
* Behavior/Agent change events, internal milestone events
* Level or Application lifecycle events

Level of detail I want:

* a named tasks associated with an object
* defining prequisites as named tasks that completed successfully
* lightweight data payload object
* a way of defining response to named task invocation
* a way of defining periodic emission of named task invocations
* a way of chaining named task invocations conditionally
* a way of catching errors with a clear failure cascading order
* easy to see where a task is defined, and who calls it
* identify callers, callees, multiple recipients
* handle aggregate responses when multiple recipients are involves

Behavior trees says ben were difficult to debug. Is there a way to see when what task is triggered at what time.

INIT - LOAD ASSETS - SUBSYSTEMS ALL READY - LOAD STATE - OPENAPP
in RUN state:
* accept UI events
* dispatch server calls
* access state of the system anywhere
CLOSEAPP - SAVE ASSETS -

PAUSE/UNPAUSE EVENT:
presumes that there are other events driving the system for sim, and to block firing of UI handlers.
* UI elements (no visual update / no messages)
* simulation state (anything realtime updating) is disabled
* simulation clock is stopped
* local clocks continue to run, if they don't impact simulation state

RESET EVENT:
this tells any resetable system that it should initialize to a state that is ready for a subsequent LOAD STATE event.
* reset state UI / appearance
* reset subsystems to known state

GRANULARITY of PERSISTENCE of MODULE STATE
* be able to control when they reset
* a way of defining the lifecycle of a particular session, and knowing what mode it is in.

KINDS OF LIFECYCLES
* web application React load
* application subsystem initialization, run, shutdown
* within app.run we have sessions, and session-specific substates

MULTIPLE INVOCATIONS OF EVENT SERVICES
* manage transactions in predictable manner (e.g. 3 people writing to same database)
* handling race conditions
* handling blocks, interlocks, starvation
* design for

TYPES OF INVOCATION:
* many-to-many: broadcast a system-wide event for all interested subscribers
* one-to-one: establish a direct link between two objects for messaging (sub/notify)
* parent-child distribution of events up and down:
* communicating state separate from change, change separet from state

ABILITY TO REFACTOR:
* how to group rename everything?
* methodology, or a utility to rewrite or alias messages
* names of the messages

OTHER ELEMENTS
* it's another way of handling an API through named events
* our unisys packets are a form of state change management, but only if there's a disciplined way of managing global application state
* UNISYS gets a state management sidechain or filter (UNISYS STATE PROPAGATION).

INSPECTABLE
* UNISYS was easy to inspect by just making some other

NEXT ACTION:
* gather examples of each of these things

