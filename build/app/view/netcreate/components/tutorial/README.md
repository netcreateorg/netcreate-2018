# Tutorial Subsystem — Developer Guide

The CI489 onboarding overlay that walks first-time users through NetCreate:
creating nodes, connecting them with edges, opening tables, and exploring
the graph with filters.

This README is for developers who need to **change the tutorial** — edit
copy, add/remove/reorder steps, spotlight a new UI element, or wire a
brand-new user action into the auto-advance flow. It is not a runtime
walkthrough for end users.

---

## Quick map

```
app/view/netcreate/components/tutorial/
├── Tutorial.jsx          orchestrator: state machine, event bus subscriber
├── tutorial-steps.js     ordered list of steps — this is what you usually edit
├── TutorialCard.jsx      one card (body + Skip / > / END buttons)
├── TutorialSpotlight.jsx the dim layer + orange ring around a target element
├── TutorialWelcome.jsx   first-run "Would you like a tutorial?" modal
└── Tutorial.css          all overlay styling (auto-bundled by brunch)
```

Mounted once at `app/view/netcreate/NetCreate.jsx:196` (`<Tutorial />`).
There is no per-route mounting — the overlay sits above the entire app.

---

## Mental model

The tutorial is a **forward-only state machine** over an ordered list of
steps. Each step is either:

- **Prose** — text only; advances when the user clicks `>`.
- **Action** — has a `match(event)` predicate; advances automatically when
  the user does the requested action in the live UI.

When a user action fires, `Tutorial.jsx` scans the step list **forward from
the current step** for the first step whose `match` returns true and jumps
there. This means:

- The user can never be bounced backward by repeating an action.
- Prose steps are not skipped past automatically — they are a stop on the
  path even when later steps match the event.
- A shared matcher (e.g. multiple steps that listen for `node-selected`)
  needs a `requires` predicate to prevent teleporting across sections.

---

## Editing copy in a step

Open `tutorial-steps.js`. Each step's `body` is plain JSX. Wrap key terms
with the `HL(...)` helper for the orange highlight treatment:

```jsx
body: (
  <p>
    Click {HL('Add New Node')} to start.
  </p>
)
```

Don't add HTML/inline styles; use the existing classes (`tut-bullets`,
`tut-numbered`) so the visual style stays consistent. Color tokens live
in `Tutorial.css` at the top.

---

## Adding / removing / reordering steps

`tutorial-steps.js` exports an ordered array. To add a step, insert an
object at the right position; to remove one, delete it; to reorder, move
the object.

### Step shape

```js
{
  id:        'unique-string',          // used by `reachedStep('…')` and for debug logs
  body:      <JSX/>,                   // card content
  position:  'center' | 'left' | 'right',  // where the card floats; defaults to 'center'
  target:    'data-tut-id'             // OR ['id-a', 'id-b'] — element(s) to spotlight
  nodim:     true,                     // optional — no dim layer at all (free interaction)
  skipIf:    () => boolean,            // optional — skip the step if returns true on entry
  requires:  () => boolean,            // optional — gate `match` (event ignored if false)
  match:     (event) => boolean,       // optional — auto-advance trigger
}
```

### Common patterns

- **Pure prose card** (e.g. "What is a node?"): `body` + `position` only.
  User clicks `>` to advance.
- **Spotlighted action card** (e.g. "Click Add New Node"): add `target` and
  `match`. The orange ring will outline the live element.
- **Multi-target spotlight** (e.g. "type a name AND click Add"): pass an
  array to `target` — the spotlight unions the bounding boxes.
- **Free-interaction step** (e.g. "drag a node around"): set `nodim: true`
  so nothing is dimmed. The card still floats on top.
- **Conditional skip** (e.g. step is meaningless if a form is already
  open): write a `skipIf` predicate.
- **Shared matcher disambiguation** (e.g. two steps both listen for
  `node-selected`): add `requires` to the later step so it doesn't grab
  events meant for the earlier step.

### Position cheatsheet

- `'center'` — middle of the viewport. Use for prose and end-of-flow cards.
- `'left'` — left half. Use when the user is looking at the right-side
  filter panel or graph area.
- `'right'` — right half. Use when the spotlight is on the left form
  panel (search, node form, edge form) so the card doesn't sit over it.

---

## Spotlighting a new UI element

The spotlight finds elements by their `data-tut-id` attribute (not by CSS
selector). To add a new spotlight target:

1. Pick a short, kebab-case ID, e.g. `data-tut-id="btn-export-csv"`.
2. Add the attribute to the live element's JSX in whichever component
   owns it. Existing examples:

   | Element                 | Component               | data-tut-id            |
   |-------------------------|-------------------------|------------------------|
   | Search input            | `Search.jsx:74`         | `search-input`         |
   | Add New Node button     | `NodeSelector.jsx:1048` | `btn-add-node`         |
   | Node type dropdown      | `NodeSelector.jsx:1093` | `node-type-select`     |
   | Save node button        | `NodeSelector.jsx:1199` | `btn-save-node`        |
   | Add New Edge button     | `NodeSelector.jsx:1245` | `btn-add-edge`         |
   | Edge target input       | `EdgeEditor.jsx:1101`   | `edge-target-input`    |
   | Save edge button        | `EdgeEditor.jsx:1265`   | `btn-save-edge`        |
   | Nodes Table tab         | `InfoPanel.jsx:188`     | `tab-nodes`            |
   | Edges Table tab         | `InfoPanel.jsx:197`     | `tab-edges`            |
   | VIEWS / filters toggle  | `NetCreate.jsx:209,224` | `btn-toggle-filters`   |

3. Reference the ID in a step's `target` field.

If the spotlight target is below the fold inside a scrollable panel (the
EDGES section in `NodeSelector`, edge form fields in `EdgeEditor`), the
dim layer transparently forwards wheel events to the underlying scroll
container — see "Scroll forwarding" in `TutorialSpotlight.jsx`. You don't
need to do anything special for scrollable spotlights, but the **user
must already be able to scroll the parent panel** for it to work; that
is, the spotlighted element has to be inside an `overflow: auto|scroll`
ancestor whose content overflows.

If the target is not in the DOM yet when the step becomes current (common
when the previous step's action just mounted a new component), the
spotlight retries once on the next animation frame before falling back to
a full-dim layer. You usually don't need to think about this.

---

## Wiring a new user action into auto-advance

There are two ways an action becomes a tutorial event:

### A. Reuse an existing `kind`

If the action you care about already maps to one of these, you're done —
just write a `match` for it:

| Event kind             | Source                                                      |
|------------------------|-------------------------------------------------------------|
| `node-selected`        | UDATA `SOURCE_SELECT` (a node became selected in the graph) |
| `node-saved`           | UDATA `SOURCE_UPDATE` (a node was just saved)               |
| `edge-saved`           | UDATA `EDGE_UPDATE` (an edge was just saved)                |
| `node-form-opened`     | `NodeSelector.jsx:728` — "Add New Node" clicked             |
| `node-form-cancelled`  | `NodeSelector.jsx:951` — Cancel on node form                |
| `edge-form-opened`     | `NodeSelector.jsx:900` — "Add New Edge" clicked             |
| `edge-form-cancelled`  | `EdgeEditor.jsx:710`  — Cancel on edge form                 |
| `tab-opened`           | `InfoPanel.jsx:80`    — InfoPanel tab clicked (`event.tab`) |
| `analysis-opened`      | `NetCreate.jsx:143`   — VIEWS / filter panel opened         |

Example `match`:

```js
match: (e) => e.kind === 'tab-opened' && e.tab === '4',  // Edges table
```

### B. Add a brand-new event kind

If the action isn't broadcast yet:

1. Pick a new event kind name (`'foo-opened'`, `'bar-saved'`, …).
2. In the component that handles the user action, broadcast it:

   ```js
   UDATA.LocalSignal('TUT_EVENT', { kind: 'foo-opened' });
   ```

   Look at `InfoPanel.jsx:80` or `NodeSelector.jsx:728` for the pattern.
   Broadcast at the point where the action is *committed* — don't fire on
   hover or focus, or the tutorial will advance prematurely.

3. (Optional) If you also want to carry payload, attach extra fields:
   `{ kind: 'tab-opened', tab: tab }` is the existing template.
4. Write a step in `tutorial-steps.js` with `match: (e) => e.kind === 'foo-opened'`.

No changes to `Tutorial.jsx` are needed for new event kinds — it's an
opaque pass-through.

---

## Restarting the tutorial

`Tutorial.jsx` subscribes to a UDATA message `TUTORIAL_RESTART`. Any
component can re-launch the welcome modal by signaling it:

```js
UDATA.LocalSignal('TUTORIAL_RESTART');
```

For dev convenience the same handler is exposed on `window`:

```js
window.ncRestartTutorial();
```

The welcome-modal "seen" flag lives in `localStorage` under
`netcreate.tutorialSeen`. Restart clears it; clicking "No" or completing
the tutorial sets it.

---

## State machine internals (when you'd touch `Tutorial.jsx`)

You usually don't need to. But if you're debugging an auto-advance that
doesn't fire or jumps too far, the things to know:

- **Synchronous step-index mirror.** `this._stepIndex` and `this._running`
  mirror state, because a single save message can cascade into multiple
  events in the same React tick (a `SOURCE_UPDATE` triggers
  `NodeSelector` to re-broadcast `SOURCE_SELECT`). React's `setState` is
  async; without the mirror, the second event would read stale state.
  **Always update the mirror BEFORE calling `setState`.**
- **Post-save suppression window.** After `node-saved` / `edge-saved`,
  any `node-selected` that arrives within 600 ms is suppressed (it's the
  form-refresh cascade, not a real user pick). The save handler stamps
  `_lastSaveAt` *before* dispatching to `handleTutEvent` because
  subscription order means the cascade can land first.
- **`skipIf` runs in `componentDidUpdate`**, gated on `stepIndex` /
  `running` change so it doesn't fire on every re-render. The final step
  is never skipped (no infinite loop on END).
- **Debug logging.** Flip `DBG = true` near the top of `Tutorial.jsx`
  while iterating. Commit as `false`.

---

## CSS

All styles live in `Tutorial.css`. Brunch concatenates everything under
`app/*.css` into `styles/netc-app.css` — do **not** `require()` the file
from JS.

Color tokens (define new ones at the top if you need them):

| Token         | Color     | Used for                          |
|---------------|-----------|-----------------------------------|
| `--tut-blue`  | `#1f3658` | card border, buttons, body text   |
| `--tut-orange`| `#ec6c2d` | `.tut-hl` highlights, spotlight ring |
| `--tut-card`  | `#ffffff` | card background                   |

Z-index layering (be careful when adding new fixed-position elements
anywhere in the app):

| Layer                         | z-index | Notes                              |
|-------------------------------|---------|------------------------------------|
| Disconnect banner             | 3000    | Always on top                      |
| `.tut-overlay` (card)         | 2500    | Above filter panel                 |
| `.tut-spotlight-ring`         | 2450    | Above dim, `pointer-events: none`  |
| `.tut-dim` / `.tut-dim-full`  | 2400    | Absorbs wrong clicks               |

---

## Common gotchas

- **Spotlight is full-dim instead of ringed.** The element doesn't have a
  `data-tut-id`, or the value in the step's `target` doesn't match, or
  the element isn't laid out yet (0×0). Inspect the DOM first.
- **Step auto-advances immediately when it becomes current.** Your
  `skipIf` is returning true unexpectedly, or a previous step's `match`
  matched a future step (forward scan jumped past). Add a `requires` on
  the future step.
- **Step never auto-advances.** Either no one is broadcasting the event,
  or `requires` is returning false. Turn on `DBG` and watch the
  `[TUT] {kind:…}` logs; they print on every event with the current step
  ID.
- **Saving a node teleports past prose steps.** The post-save
  `node-selected` cascade is leaking past the 600 ms suppression window.
  Make sure the save broadcast lands before the cascade — i.e. the save
  handler runs first in subscription order.
- **Two action steps both listen for `node-selected` and the second one
  always wins.** Forward-scan finds the second matching step too. Add
  `requires: reachedStep('the-step-before-it')` to the second one, OR a
  state-probe like `isEdgeFormOpen` to scope which step consumes the
  event.

---

## Where things live in one paragraph

`NetCreate.jsx` mounts `<Tutorial />` once and broadcasts
`analysis-opened` when the filter panel opens. `Tutorial.jsx` is the
state machine: it subscribes to `TUT_EVENT` plus three legacy UDATA
messages (`SOURCE_SELECT`, `SOURCE_UPDATE`, `EDGE_UPDATE`), normalizes
each to `{kind, …}`, and forward-scans `tutorial-steps.js` for the next
matching step. Steps spotlight live elements by their `data-tut-id`
attribute (defined in `NodeSelector`, `EdgeEditor`, `InfoPanel`,
`Search`, `NetCreate`). The visual layer (dim rectangles + orange ring +
card) is rendered by `TutorialSpotlight.jsx` and `TutorialCard.jsx`; the
first-run modal is `TutorialWelcome.jsx`. All styling is in
`Tutorial.css`.
