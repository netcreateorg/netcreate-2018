/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Tutorial

  CI489 onboarding overlay. Mounted once at the top of NetCreate.jsx, it:

    1. shows a Welcome modal on first visit (gated by localStorage)
    2. walks the user through tutorial-steps.js, advancing on '>' OR on
       any matching user action — see "Adaptive auto-advance" below
    3. listens for a UDATA 'TUTORIAL_RESTART' message so a navbar link
       (or `window.ncRestartTutorial()`) can re-launch it

  ## Adaptive auto-advance

  The tutorial subscribes to a small set of UDATA messages and normalises
  each one into an event of the form `{kind, ...payload}`. On every event,
  it scans STEPS *forward from the current step* for the first step whose
  optional `match(event)` predicate returns true, and jumps to it.

  Forward-only scan = the user can never be bounced backward by saving a
  second node, opening the same tab again, etc.

  Steps without a `match` are pure prose; the user must click '>' to advance
  past them. They are NOT skipped past by an event, so they remain a stop on
  the path.

  Subscribed messages and how they're normalised:
    SOURCE_SELECT  -> {kind:'node-selected'}   (a node became selected)
    SOURCE_UPDATE  -> {kind:'node-saved'}      (a node was saved)
    EDGE_UPDATE    -> {kind:'edge-saved'}      (an edge was saved)
    TUT_EVENT      -> passed through as-is     (UI events broadcast by
                                                instrumented components)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const UNISYS = require('unisys/client');

const TutorialWelcome = require('./TutorialWelcome');
const TutorialCard = require('./TutorialCard');
const TutorialSpotlight = require('./TutorialSpotlight');
const STEPS = require('./tutorial-steps');
// Tutorial.css is auto-bundled by brunch into styles/netc-app.css
// (matches the codebase convention; do NOT require() CSS files).

const STORAGE_KEY = 'netcreate.tutorialSeen';
// flip to true while iterating on matchers / step flow; commit as false.
const DBG = false;

// Map of UDATA message names to the {kind} event they translate into.
const MESSAGE_TO_EVENT = {
  'SOURCE_UPDATE': () => ({ kind: 'node-saved' }),
  'EDGE_UPDATE':   () => ({ kind: 'edge-saved' }),
  'SOURCE_SELECT': () => ({ kind: 'node-selected' })
};

let UDATA = null;

class Tutorial extends UNISYS.Component {
  constructor(props) {
    super(props);

    // gate Welcome on localStorage; SSR-safe guard for `window`
    let seen = false;
    try {
      seen = typeof window !== 'undefined' &&
             window.localStorage &&
             window.localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (e) { /* private mode etc — fall through, just show it */ }

    this.state = {
      showWelcome: !seen,
      running: false,
      stepIndex: 0
    };

    // Synchronous mirror of state.stepIndex / state.running. handleTutEvent
    // can fire multiple times in the same React tick (a save message can
    // trigger downstream messages that translate to events), and setState
    // is async — without this mirror, the second call would scan from the
    // stale state.stepIndex and either re-match the same step or jump too
    // far. Always update this BEFORE calling setState.
    this._stepIndex = 0;
    this._running = false;

    this.handleYes = this.handleYes.bind(this);
    this.handleNo = this.handleNo.bind(this);
    this.handleSkip = this.handleSkip.bind(this);
    this.handleNext = this.handleNext.bind(this);
    this.handleRestart = this.handleRestart.bind(this);
    this.handleTutEvent = this.handleTutEvent.bind(this);

    UDATA = UNISYS.NewDataLink(this);
  }

  componentDidMount() {
    UDATA.HandleMessage('TUTORIAL_RESTART', this.handleRestart);

    // Subscribe to TUT_EVENT (the main bus) plus the legacy data messages
    // we want to treat as user actions. Each subscriber stores its bound
    // function reference so componentWillUnmount can hand it back.
    this._boundHandlers = new Map();

    const tutFn = (data) => this.handleTutEvent(data || {});
    this._boundHandlers.set('TUT_EVENT', tutFn);
    UDATA.HandleMessage('TUT_EVENT', tutFn);

    Object.keys(MESSAGE_TO_EVENT).forEach((msg) => {
      const fn = (data) => {
        // Stamp _lastSaveAt synchronously when a save message comes in,
        // BEFORE dispatching to handleTutEvent. NodeSelector subscribes to
        // SOURCE_UPDATE / EDGE_UPDATE in its constructor (mounted before
        // Tutorial), and inside its handler it re-broadcasts SOURCE_SELECT
        // to refresh the form. UNISYS dispatches handlers in subscription
        // order, so without this stamp the cascade (`node-selected`) hits
        // Tutorial *before* Tutorial's own save handler runs — and the
        // 600ms suppression window in handleTutEvent never sees the save.
        // Stamping here ensures the window is open by the time the
        // cascade lands.
        if (msg === 'SOURCE_UPDATE' || msg === 'EDGE_UPDATE') {
          this._lastSaveAt = Date.now();
        }
        const event = MESSAGE_TO_EVENT[msg](data);
        if (event) this.handleTutEvent(event);
      };
      this._boundHandlers.set(msg, fn);
      UDATA.HandleMessage(msg, fn);
    });

    // dev convenience: lets anyone re-launch from the JS console
    if (typeof window !== 'undefined') {
      window.ncRestartTutorial = this.handleRestart;
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // skipIf: a step can declare itself irrelevant in the current app state
    // (e.g. "create-first-node" is pointless if a node form is already open).
    // Evaluate after each state change; if true, advance one step. Guard
    // with stepIndex change to avoid checking on unrelated re-renders, and
    // never skip the final step.
    if (!this.state.running) return;
    if (prevState.stepIndex === this.state.stepIndex && prevState.running === this.state.running) return;
    const step = STEPS[this.state.stepIndex];
    if (!step || !step.skipIf) return;
    if (this.state.stepIndex >= STEPS.length - 1) return;
    try {
      if (step.skipIf()) {
        if (DBG) console.log('[TUT] skipIf true for', step.id, '— advancing');
        this.handleNext();
      }
    } catch (e) {
      console.warn('[TUT] skipIf threw for', step.id, e);
    }
  }

  componentWillUnmount() {
    UDATA.UnhandleMessage('TUTORIAL_RESTART', this.handleRestart);
    if (this._boundHandlers) {
      this._boundHandlers.forEach((fn, msg) => UDATA.UnhandleMessage(msg, fn));
      this._boundHandlers.clear();
    }
    if (typeof window !== 'undefined' && window.ncRestartTutorial === this.handleRestart) {
      delete window.ncRestartTutorial;
    }
  }

  /// HANDLERS ////////////////////////////////////////////////////////////////

  handleYes() {
    if (DBG) console.log('[TUT] handleYes — starting tutorial');
    this._stepIndex = 0;
    this._running = true;
    this.setState({ showWelcome: false, running: true, stepIndex: 0 });
  }

  handleNo() {
    this.persistSeen();
    this._running = false;
    this.setState({ showWelcome: false, running: false });
  }

  handleSkip() {
    this.persistSeen();
    this._running = false;
    this._stepIndex = 0;
    this.setState({ running: false, stepIndex: 0 });
  }

  handleNext() {
    const stepIndex = this._stepIndex;
    if (stepIndex >= STEPS.length - 1) {
      // END button on the final card
      this.persistSeen();
      this._running = false;
      this._stepIndex = 0;
      this.setState({ running: false, stepIndex: 0 });
      return;
    }
    this._stepIndex = stepIndex + 1;
    this.setState({ stepIndex: stepIndex + 1 });
  }

  handleRestart() {
    if (DBG) console.log('[TUT] handleRestart — opening Welcome');
    try {
      if (window.localStorage) window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
    this._running = false;
    this._stepIndex = 0;
    this.setState({ showWelcome: true, running: false, stepIndex: 0 });
  }

  /// adaptive auto-advance: forward-only scan for the first matching step ///
  handleTutEvent(event) {
    if (DBG) console.log('[TUT]', event, 'running=', this._running, 'step=', this._stepIndex, STEPS[this._stepIndex] && STEPS[this._stepIndex].id);
    if (!this._running) return;

    // Suppress the spurious 'node-selected' that NodeSelector fires right
    // after a node/edge save (it re-broadcasts SOURCE_SELECT to refresh the
    // form). Without this, saving a node teleports the user past prose
    // steps to the next step that matches 'node-selected'.
    const now = Date.now();
    if (event.kind === 'node-saved' || event.kind === 'edge-saved') {
      this._lastSaveAt = now;
    } else if (event.kind === 'node-selected' && this._lastSaveAt && (now - this._lastSaveAt) < 600) {
      if (DBG) console.log('[TUT] suppressed post-save node-selected cascade');
      return;
    }

    // Read from the synchronous mirror, not state — multiple events can fire
    // in the same React tick before setState has flushed.
    const stepIndex = this._stepIndex;
    // start at stepIndex (NOT stepIndex+1) so the matcher on the *current*
    // step also gets a chance — that's the common case (the prompt asks
    // the user to do X, and X is what just happened).
    //
    // `requires` predicate: a step can refuse to consume an event when its
    // precondition isn't met (e.g. edge-type-target only matches node-selected
    // when an edge form is open). This stops events from teleporting users
    // across many steps via shared matchers.
    for (let i = stepIndex; i < STEPS.length; i++) {
      const step = STEPS[i];
      if (!step.match || !step.match(event)) continue;
      if (step.requires) {
        try {
          // requires receives the current step's *index*, so a step can
          // gate on "user has reached step N already" if needed.
          if (!step.requires(stepIndex)) continue;
        } catch (e) {
          console.warn('[TUT] requires threw for', step.id, e);
          continue;
        }
      }
      if (i === stepIndex) {
        this.handleNext(); // matched current step — advance one
      } else {
        // matched a future step — jump there directly
        const next = i + 1 < STEPS.length ? i + 1 : i;
        this._stepIndex = next;
        this.setState({ stepIndex: next });
      }
      return;
    }
  }

  /// HELPERS /////////////////////////////////////////////////////////////////

  persistSeen() {
    try {
      if (window.localStorage) window.localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) { /* ignore */ }
  }

  /// RENDER //////////////////////////////////////////////////////////////////

  render() {
    const { showWelcome, running, stepIndex } = this.state;

    if (showWelcome) {
      return (
        <div>
          <TutorialSpotlight targetSelector={null} />
          <TutorialWelcome onYes={this.handleYes} onNo={this.handleNo} />
        </div>
      );
    }

    if (!running) return null;

    const step = STEPS[stepIndex];
    if (!step) return null;
    const isLast = stepIndex === STEPS.length - 1;

    return (
      <div>
        {!step.nodim && <TutorialSpotlight targetSelector={step.target || null} />}
        <TutorialCard
          body={step.body}
          position={step.position}
          isLast={isLast}
          onSkip={this.handleSkip}
          onNext={this.handleNext}
        />
      </div>
    );
  }
}

module.exports = Tutorial;
