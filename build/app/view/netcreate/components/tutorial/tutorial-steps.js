/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

  Step list driving the CI489 onboarding tutorial overlay. Each entry maps
  one card from the prototype PDF to the live NetCreate UI.

  ## STEP SHAPE

      {
        id:        unique string,
        body:      JSX (the card content),
        position:  'center' | 'left' | 'right'  (defaults to 'center'),
        target:    optional string OR string[] — value(s) of `data-tut-id`
                   attribute(s) on live UI element(s) this step asks the
                   user to interact with. TutorialSpotlight cuts a hole in
                   the dim layer over the (union of) target rect(s). Use an
                   array when a step needs the user to act on more than one
                   element (e.g. type a name AND click Add). Omit for prose
                   cards (they get full-dim).
        nodim:     optional boolean — when true, no dim layer at all. Use
                   for "preparation" steps that ask the user to navigate
                   freely (e.g. click around the graph) before performing
                   the matched action. The card still floats on top.
        skipIf:    optional () => boolean — evaluated each time the step
                   becomes current. If it returns true, the tutorial
                   advances immediately. Use for steps that lose meaning
                   in the current app state (e.g. "create your first
                   node" when a node form is already mid-edit).
        requires:  optional () => boolean — gate on `match`. The step
                   only consumes an event when both `match(event)` AND
                   `requires()` are true. Use to prevent a shared matcher
                   (e.g. node-selected, tab-opened) from teleporting the
                   user past the current step into a far-future step.
        match:     optional (event) => boolean
                   When the tutorial sees a TUT_EVENT (or one of the legacy
                   message events normalised into a {kind} shape), it scans
                   forward from the current step and jumps to the first step
                   whose `match` returns true. Pure prose cards omit `match`
                   and require the user to click '>' to advance.
      }

  EVENT KINDS the matchers can react to:

    Broadcast by Tutorial.jsx itself:
      'node-selected'       - SOURCE_SELECT picked a node
      'node-saved'          - SOURCE_UPDATE (a node was just saved)
      'edge-saved'          - EDGE_UPDATE (an edge was just saved)

    Broadcast by instrumented components via TUT_EVENT:
      'node-form-opened'    - "Add New Node" clicked
      'node-form-cancelled' - Cancel pressed on an open node form
      'edge-form-opened'    - "Add New Edge" clicked
      'edge-form-cancelled' - Cancel/collapse pressed on an open edge form
      'tab-opened'          - InfoPanel tab clicked (event.tab is '3' for
                              Nodes Table, '4' for Edges Table)
      'analysis-opened'     - filter / analysis panel opened on the right

  Highlights of key terms use <span className="tut-hl">…</span> for the
  orange treatment in the prototype.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');

/// helper: orange-highlight a term ///////////////////////////////////////////
const HL = (text) => React.createElement('span', { className: 'tut-hl' }, text);

/// state-probe helpers used by skipIf / requires predicates //////////////////
// node-type-select is `disabled` when no node is being edited, so its
// presence + !disabled means a node form is currently open.
const isNodeFormOpen = () => {
  const t = document.querySelector('[data-tut-id="node-type-select"]');
  return !!(t && !t.disabled);
};
// edge-type-select only renders when an edge form is open (it's inside
// EdgeEditor's conditional render path).
const isEdgeFormOpen = () => {
  return !!document.querySelector('[data-tut-id="edge-type-select"]');
};

// Used as a `requires`: only consume the event when the user has already
// reached at least the step with the given id. Stops cross-section
// teleports (e.g. opening the Edges tab during edge-howto must NOT
// teleport to tables-intro). The lookup is against STEPS, defined below;
// we accept the cost of an O(n) scan (n=39) per call.
const reachedStep = (id) => (currentIndex) => {
  for (let i = 0; i <= currentIndex; i++) {
    if (STEPS[i] && STEPS[i].id === id) return true;
  }
  return false;
};

/// STEPS /////////////////////////////////////////////////////////////////////
const STEPS = [
  // 1. Intro card
  {
    id: 'intro',
    position: 'center',
    body: (
      <div>
        <p>In this tutorial, you&rsquo;ll learn how to:</p>
        <ul className="tut-bullets">
          <li>Create {HL('nodes')}</li>
          <li>Connect {HL('relationships')}</li>
          <li>Explore your {HL('network')}</li>
        </ul>
      </div>
    )
  },

  // 2. What is a node
  {
    id: 'what-is-node',
    position: 'center',
    body: (
      <p>
        A {HL('node')} is a building block of your network.<br />
        It can represent a person, place, or idea.
      </p>
    )
  },

  // 3. Create your first node — needs both fields free: type the name in
  //    the search input AND click Add New Node. Spotlight covers both.
  //    skipIf: if a node form is already open from prior interaction (the
  //    tutorial was restarted mid-edit), this step is meaningless because
  //    the Add New Node button is hidden — skip it.
  {
    id: 'create-first-node',
    position: 'right',
    target: ['search-input', 'btn-add-node'],
    skipIf: isNodeFormOpen,
    match: (e) => e.kind === 'node-form-opened',
    body: (
      <p>
        Let&rsquo;s create your first {HL('node')}.<br />
        Enter your name and click {HL('Add New Node')}.
      </p>
    )
  },

  // After the form opens, prompt for fields + Save. nodim so the user can
  // interact with the whole form freely. Matcher waits for save.
  //
  // No skipIf here: the previous step's matcher (`node-form-opened`) fires
  // *before* React re-renders NodeSelector with the form-open state, so a
  // skipIf based on isNodeFormOpen() would race and false-skip past this
  // card during the same tick. If the user dismisses the form via Cancel,
  // they can manually click '>' to advance.
  {
    id: 'select-type',
    position: 'right',
    nodim: true,
    // Accept Cancel as well as Save so the tutorial doesn't deadlock if the
    // user backs out of the form. Same pattern on every form-wait step below.
    match: (e) => e.kind === 'node-saved' || e.kind === 'node-form-cancelled',
    body: (
      <p>
        Fill in any fields you like (all optional), then click {HL('Save')}.
      </p>
    )
  },

  // After the first node is created, immediately prompt for a second node
  // (same dual-target as step 3 — needs the form to be closed, so skipIf
  // mirrors the create-first-node guard).
  {
    id: 'create-second-node',
    position: 'right',
    target: ['search-input', 'btn-add-node'],
    skipIf: isNodeFormOpen,
    requires: reachedStep('select-type'), // first node must be done
    match: (e) => e.kind === 'node-form-opened',
    body: (
      <p>
        Now let&rsquo;s create another {HL('node')}.<br />
        For this, let&rsquo;s make one for a {HL('Parent')} or {HL('Guardian')}.
      </p>
    )
  },

  // Save the second node. nodim so the user can still fill any optional
  //    fields if they want. Don't repeat the description prompt — the user
  //    already learned that pattern in the first node creation.
  {
    id: 'second-node-save',
    position: 'right',
    nodim: true,
    match: (e) => e.kind === 'node-saved' || e.kind === 'node-form-cancelled',
    body: (
      <p>Click {HL('Save')} to add this node.</p>
    )
  },

  // Now you have nodes — pivot to provenance prose.
  {
    id: 'now-you-have-a-node',
    position: 'center',
    body: (
      <p>Now you have two {HL('nodes')}!</p>
    )
  },

  {
    id: 'provenance-intro',
    position: 'center',
    body: (
      <p>Every {HL('node')} has {HL('provenance')}.</p>
    )
  },

  {
    id: 'provenance-shows',
    position: 'center',
    body: (
      <div>
        <p>{HL('Provenance')} shows:</p>
        <ul className="tut-bullets">
          <li>Who created the {HL('Node')}</li>
          <li>When it was created or updated</li>
          <li>How many times it is edited</li>
        </ul>
      </div>
    )
  },

  {
    id: 'provenance-importance',
    position: 'center',
    body: (
      <div>
        <p>{HL('Provenance')} is important for:</p>
        <ul className="tut-bullets">
          <li>Tracking changes over time</li>
          <li>Understanding where information comes from</li>
          <li>Building trust in your data</li>
        </ul>
      </div>
    )
  },

  // 14. What is an edge
  {
    id: 'what-is-edge',
    position: 'center',
    body: (
      <p>
        An {HL('edge')} connects two nodes.<br />
        It represents a relationship.
      </p>
    )
  },

  // 15. How to connect nodes with an edge — three sub-actions (click node,
  //    scroll down in the left panel to the EDGES section, click Add New
  //    Edge). nodim so the full UI is interactive across all three; matcher
  //    catches the final click. Wording explicitly mentions scrolling
  //    because on short viewports the EDGES section is below the fold.
  {
    id: 'edge-howto',
    position: 'right',
    nodim: true,
    match: (e) => e.kind === 'edge-form-opened',
    body: (
      <div>
        <p>To connect {HL('nodes')} with an {HL('edge')}:</p>
        <ol className="tut-numbered">
          <li>Click a node in the {HL('graph')}</li>
          <li>Scroll down in the left panel to the {HL('EDGES')} section</li>
          <li>Click {HL('Add New Edge')}</li>
        </ol>
      </div>
    )
  },

  // (Type picker step removed: edge save only requires source + target;
  //  forcing the user to pick a relationship type added a card that
  //  felt mechanical. Users can still pick a type when filling out the
  //  edge form during edge-add-description.)

  // 17. Connection between nodes — explanatory, no matcher. Tell the user
  //    to scroll the left panel so they're ready to see the next
  //    spotlight (target-input field, which is inside the edge form below
  //    the fold).
  {
    id: 'edge-connection-explained',
    position: 'center',
    body: (
      <p>
        You can now make a {HL('connection')} between you and your guardian.
        Scroll down in the left panel to see the next step.
      </p>
    )
  },

  // 18. Type the target node name and pick from suggestions. Combines what
  //    used to be steps 18 + 19 (which both waited for node-selected).
  //    Advances when the user picks a node from the autocomplete list.
  //    The post-save cascade is suppressed in Tutorial.jsx, so this matcher
  //    only fires on a real user pick.
  {
    id: 'edge-type-target',
    position: 'right',
    target: 'edge-target-input',
    requires: isEdgeFormOpen, // ignore node-selected fired before edge form opens
    match: (e) => e.kind === 'node-selected',
    body: (
      <p>
        Scroll down in the left panel, then type the name of the{' '}
        {HL('target node')} and pick it from the suggestions.
      </p>
    )
  },

  // 21. Target selected; add a description and save. nodim so the user can
  //    both type in the notes field AND reach the Save button. Advances
  //    on save (description is optional).
  {
    id: 'edge-add-description',
    position: 'right',
    nodim: true,
    match: (e) => e.kind === 'edge-saved' || e.kind === 'edge-form-cancelled',
    body: (
      <p>
        The {HL('target node')} is set. Fill in any fields you like
        (optional), then click {HL('Save')}.
      </p>
    )
  },

  // 23. Edges have provenance too
  {
    id: 'edge-provenance',
    position: 'center',
    body: (
      <p>
        Edges also have {HL('provenance')}.<br />
        You can track who created relationships and when.
      </p>
    )
  },

  // 24. See the edge on target node
  {
    id: 'edge-on-target',
    position: 'center',
    body: (
      <p>You can see the {HL('edge')} on the {HL('target node')}.</p>
    )
  },

  // 25. Relationship visible on target
  {
    id: 'edge-relationship-on-target',
    position: 'center',
    body: (
      <p>Here the relationship made before can be seen on the {HL('target node')}.</p>
    )
  },

  // 26. Add another person — same dual-target as step 3.
  {
    id: 'add-third-person',
    position: 'right',
    target: ['search-input', 'btn-add-node'],
    skipIf: isNodeFormOpen,
    requires: reachedStep('edge-relationship-on-target'),
    match: (e) => e.kind === 'node-form-opened',
    body: (
      <p>
        Now let&rsquo;s add another person:<br />
        They can be a sibling, relative, or guardian.
      </p>
    )
  },

  // Save the third node. nodim so any optional fields are reachable.
  // No skipIf: same form-open race as select-type.
  {
    id: 'third-node-desc',
    position: 'right',
    nodim: true,
    match: (e) => e.kind === 'node-saved' || e.kind === 'node-form-cancelled',
    body: (
      <p>Click {HL('Save')} to add this node.</p>
    )
  },

  // 30. Sibling node created
  {
    id: 'third-node-created',
    position: 'center',
    body: (
      <p>Here a sibling node has been created!</p>
    )
  },

  // 31. Now create another edge — advance when edge form opens.
  //    nodim: user may need to click a node first to make Add New Edge
  //    visible. requires: don't teleport here from earlier edge flow.
  //    Repeat the click-then-scroll-then-Add hint so the user doesn't get
  //    stuck looking for the EDGES section a second time.
  {
    id: 'second-edge-intro',
    position: 'right',
    nodim: true,
    requires: reachedStep('third-node-created'),
    match: (e) => e.kind === 'edge-form-opened',
    body: (
      <div>
        <p>
          Let&rsquo;s create another {HL('edge')} to represent the
          relationship between the nodes.
        </p>
        <p>
          Click a node in the {HL('graph')}, scroll down to the{' '}
          {HL('EDGES')} section, and click {HL('Add New Edge')}.
        </p>
      </div>
    )
  },

  // (Second-edge type-picker step removed for the same reason as the first
  //  edge: type isn't required to save, and the prompt felt mechanical.)

  // 33. Set the target — type the name and pick from suggestions. Combines
  //    what used to be steps 33 + 34 for the same reasons as steps 18+19.
  {
    id: 'second-edge-target-prompt',
    position: 'right',
    target: 'edge-target-input',
    requires: isEdgeFormOpen,
    match: (e) => e.kind === 'node-selected',
    body: (
      <p>
        Scroll down in the left panel, then type the name of the{' '}
        {HL('target node')} and pick it from the suggestions.
      </p>
    )
  },

  // 35. Target selected. nodim so the user can optionally add a description
  //    before saving. Matcher waits for save.
  {
    id: 'second-edge-save',
    position: 'right',
    nodim: true,
    match: (e) => e.kind === 'edge-saved' || e.kind === 'edge-form-cancelled',
    body: (
      <p>
        Now the {HL('target node')} has been selected.<br />
        Press {HL('Save')} to continue.
      </p>
    )
  },

  // From here on the user is in EXPLORATION mode: the network is built and
  //    the remaining steps are prose tips about features to try (drag,
  //    cluster, centrality, tables, filters). Every step in this tail uses
  //    `nodim: true` so the user can interact freely with nodes, tabs,
  //    buttons, etc. Auto-advance still fires on the action steps
  //    (tables-intro, analysis-intro) but without dimming/spotlight ring,
  //    since dim here would block the very dragging/exploration the cards
  //    are inviting.

  // 36. Try dragging — card on the left so it doesn't sit over the graph
  //    area where the user is supposed to be dragging nodes around.
  {
    id: 'try-drag',
    position: 'left',
    nodim: true,
    body: (
      <p>
        Try dragging a {HL('node')}.<br />
        What do you notice?
      </p>
    )
  },

  // 37. Cluster
  {
    id: 'cluster',
    position: 'center',
    nodim: true,
    body: (
      <p>
        A {HL('cluster')} is a group of connected {HL('nodes')}.<br />
        It reveals relationships in your network.
      </p>
    )
  },

  // 38. Centrality
  {
    id: 'centrality',
    position: 'center',
    nodim: true,
    body: (
      <p>
        Some {HL('nodes')} are more important than others.<br />
        {HL('Centrality')} shows which {HL('nodes')} are most connected.
      </p>
    )
  },

  // 39. Tables intro — action step. Spotlight both tabs so the user knows
  //    where to click. requires: don't let an Edges-tab open during the
  //    edge-creation sub-flow (step `edge-howto`) teleport here.
  {
    id: 'tables-intro',
    position: 'left',
    target: ['tab-nodes', 'tab-edges'],
    requires: reachedStep('centrality'),
    match: (e) => e.kind === 'tab-opened' && (e.tab === '3' || e.tab === '4'),
    body: (
      <div>
        <p>Open a table to explore your data:</p>
        <ul className="tut-bullets">
          <li>{HL('Nodes Table')}</li>
          <li>{HL('Edges Table')}</li>
        </ul>
      </div>
    )
  },

  // 40. Nodes table capabilities
  {
    id: 'nodes-table',
    position: 'left',
    nodim: true,
    body: (
      <div>
        <p>Here you can:</p>
        <ul className="tut-bullets">
          <li>{HL('Sort')} nodes</li>
          <li>{HL('Customize')} fields</li>
          <li>{HL('Focus')} on specific data</li>
        </ul>
      </div>
    )
  },

  // 41. Tables for understanding
  {
    id: 'tables-help',
    position: 'left',
    nodim: true,
    body: (
      <p>
        The tables help in {HL('understanding')} and {HL('looking')} at your data.
      </p>
    )
  },

  // 42. Analysis tab intro — action step. Spotlight the VIEWS button (the
  //    filter-panel toggle in the top-right) so the user knows where to
  //    click. requires: ignore early opens of the analysis panel.
  {
    id: 'analysis-intro',
    position: 'left',
    target: 'btn-toggle-filters',
    requires: reachedStep('tables-help'),
    match: (e) => e.kind === 'analysis-opened',
    body: (
      <div>
        <p>Click {HL('VIEWS')} (top-right) to open the {HL('Analysis Tab')}, where you can explore your network with:</p>
        <ul className="tut-bullets">
          <li>{HL('Focus')}</li>
          <li>{HL('Fade')}</li>
          <li>{HL('Reduce')}</li>
        </ul>
      </div>
    )
  },

  // 43. Filter by attribute
  {
    id: 'filter-by-attr',
    position: 'left',
    nodim: true,
    body: (
      <p>You can filter the {HL('nodes')} based on specific {HL('attributes')}.</p>
    )
  },

  // (Fade step removed: the explanation overlapped with the Analysis Tab
  //  intro list and didn't add new actionable info.)

  // 45. Reduce
  {
    id: 'reduce',
    position: 'left',
    nodim: true,
    body: (
      <p>{HL('Reduce')} removes all the irrelevant nodes.</p>
    )
  },

  // 46. Focus
  {
    id: 'focus',
    position: 'left',
    nodim: true,
    body: (
      <p>{HL('Focus')} shows only what&rsquo;s connected to a selected {HL('node')}.</p>
    )
  },

  // 47. Range
  {
    id: 'focus-range',
    position: 'left',
    nodim: true,
    body: (
      <p>
        {HL('Range')} is now set to 2 which means all the nodes that are
        2 degrees (connections) away are shown.
      </p>
    )
  },

  // 48. Final card — END button is driven by isLast in Tutorial.jsx.
  //    No matcher; user clicks END (or "Clear Filters" in the InfoPanel)
  //    after the tutorial dismisses to restore the original graph view.
  {
    id: 'end',
    position: 'center',
    nodim: true,
    body: (
      <div>
        <p>You&rsquo;re done!</p>
        <p>Click {HL('END')} to close this tutorial.</p>
      </div>
    )
  }
];

module.exports = STEPS;
