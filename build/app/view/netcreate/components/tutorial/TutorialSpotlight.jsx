/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  TutorialSpotlight

  Renders the dim/highlight layer for guided-rails mode. Two modes:

    1. targetSelector === null      -> one full-dim rectangle covering the
                                       viewport (.tut-dim-full).
    2. targetSelector === 'foo'     -> look up `[data-tut-id="foo"]` and
                                       render four .tut-dim rectangles that
                                       form an open frame around the target,
                                       plus a .tut-spotlight-ring outlining
                                       it. If the element is not found, fall
                                       back to full-dim.

  The dim rectangles have pointer-events: auto so they absorb wrong clicks.
  The ring has pointer-events: none so the user's click reaches the live
  target (button, input, dropdown, etc.).

  ## Scroll forwarding

  pointer-events: auto on the dim rectangles also blocks wheel events, which
  would freeze the left panel: in steps where the spotlight target sits below
  the fold (e.g. EDGES section, edge form fields), the user couldn't scroll
  to reach it. So each dim rectangle attaches a non-passive wheel listener
  that:
    1. uses elementsFromPoint(clientX, clientY) to find what's behind the
       dim div at the cursor (skipping the dim div itself);
    2. walks up that element's ancestors for the first scrollable container
       (overflow auto|scroll AND scrollHeight > clientHeight);
    3. applies deltaY/deltaX to that container's scrollTop/scrollLeft and
       calls preventDefault() so the page doesn't double-scroll.
  Click events stay absorbed because we don't intercept them.

  Recomputes on:
    - mount
    - prop change (targetSelector)
    - window resize
    - window scroll (rAF-throttled)

  PROPS
    targetSelector  string | null   value of the data-tut-id to spotlight

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');

const RING_PAD = 6; // px breathing room around the target rect

// Walk up the parent chain from `el` looking for the first scrollable
// container — overflow auto/scroll AND content actually overflows. Returns
// null if none found (page-level scroll left to the browser).
function findScrollableAncestor(el) {
  let node = el;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    const canScrollY = (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay')
                        && node.scrollHeight > node.clientHeight;
    if (canScrollY) return node;
    node = node.parentElement;
  }
  return null;
}

class TutorialSpotlight extends React.Component {
  constructor(props) {
    super(props);
    this.state = { rect: null };
    this.recompute = this.recompute.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this._scrollPending = false;
  }

  componentDidMount() {
    this.recompute();
    window.addEventListener('resize', this.recompute);
    window.addEventListener('scroll', this.onScroll, true); // capture: catch scroll on inner panels too
    // Document-level wheel listener (capture, non-passive). Only acts when
    // the event hit a .tut-dim or .tut-dim-full element. Forwards the wheel
    // delta to the scrollable ancestor of whatever sits behind the cursor.
    document.addEventListener('wheel', this.onWheel, { capture: true, passive: false });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.targetSelector !== this.props.targetSelector) {
      this.recompute();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.recompute);
    window.removeEventListener('scroll', this.onScroll, true);
    document.removeEventListener('wheel', this.onWheel, { capture: true });
  }

  onWheel(e) {
    const target = e.target;
    if (!target || !target.classList) return;
    if (!target.classList.contains('tut-dim') && !target.classList.contains('tut-dim-full')) return;
    // Find what is actually behind the dim layer at the cursor. We hide the
    // dim element briefly (via visibility: hidden so it keeps its size) so
    // elementsFromPoint doesn't keep hitting the dim. We could also walk
    // the elementsFromPoint list directly — that's simpler and avoids any
    // visual flicker.
    const stack = document.elementsFromPoint(e.clientX, e.clientY);
    let behind = null;
    for (let i = 0; i < stack.length; i++) {
      const el = stack[i];
      if (el && el.classList &&
          !el.classList.contains('tut-dim') &&
          !el.classList.contains('tut-dim-full') &&
          !el.classList.contains('tut-spotlight-ring') &&
          !el.classList.contains('tut-overlay') &&
          !el.classList.contains('tut-card')) {
        behind = el;
        break;
      }
    }
    if (!behind) return;
    const scrollable = findScrollableAncestor(behind);
    if (!scrollable) return;
    // deltaMode: 0=pixel (trackpad), 1=line (some mouse wheels), 2=page.
    // Convert lines and pages to a sensible pixel approximation.
    const LINE_PX = 16;
    const PAGE_PX = scrollable.clientHeight;
    const mult = e.deltaMode === 1 ? LINE_PX : (e.deltaMode === 2 ? PAGE_PX : 1);
    e.preventDefault();
    scrollable.scrollTop += e.deltaY * mult;
    if (e.deltaX) scrollable.scrollLeft += e.deltaX * mult;
  }

  onScroll() {
    if (this._scrollPending) return;
    this._scrollPending = true;
    window.requestAnimationFrame(() => {
      this._scrollPending = false;
      this.recompute();
    });
  }

  recompute() {
    const { targetSelector } = this.props;
    if (!targetSelector) {
      if (this.state.rect !== null) this.setState({ rect: null });
      return;
    }
    // accept string OR array of strings; array spotlights the union bbox
    const ids = Array.isArray(targetSelector) ? targetSelector : [targetSelector];
    const rects = [];
    ids.forEach((id) => {
      const el = document.querySelector('[data-tut-id="' + id + '"]');
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return; // hidden / not laid out
      rects.push(r);
    });
    if (rects.length === 0) {
      // Target not in DOM yet (or 0×0). This happens when the previous
      // step's matched action just mounted a new component (e.g. opening
      // the EdgeEditor) and React hasn't laid it out yet. Retry once on
      // the next animation frame before falling back to full-dim, which
      // would briefly block clicks on the freshly-rendered control.
      if (!this._retryPending) {
        this._retryPending = true;
        window.requestAnimationFrame(() => {
          this._retryPending = false;
          // re-run recompute; on the second pass we either find the rect
          // or accept full-dim.
          this._retryAccepted = true;
          this.recompute();
          this._retryAccepted = false;
        });
        return;
      }
      if (this.state.rect !== null) this.setState({ rect: null });
      return;
    }
    // union bounding box across all found targets
    const top    = Math.min.apply(null, rects.map((r) => r.top));
    const left   = Math.min.apply(null, rects.map((r) => r.left));
    const right  = Math.max.apply(null, rects.map((r) => r.right));
    const bottom = Math.max.apply(null, rects.map((r) => r.bottom));
    this.setState({
      rect: { top: top, left: left, width: right - left, height: bottom - top }
    });
  }

  render() {
    const { rect } = this.state;

    // full-dim: no target, or target not found
    if (!rect) {
      return <div className="tut-dim-full" />;
    }

    // hole bounds (slightly inflated for breathing room)
    const holeTop    = Math.max(0, rect.top - RING_PAD);
    const holeLeft   = Math.max(0, rect.left - RING_PAD);
    const holeWidth  = rect.width + RING_PAD * 2;
    const holeHeight = rect.height + RING_PAD * 2;
    const holeRight  = holeLeft + holeWidth;
    const holeBottom = holeTop + holeHeight;

    // four dim rectangles forming an open frame around the hole
    const top    = { top: 0, left: 0, width: '100vw', height: holeTop + 'px' };
    const bottom = { top: holeBottom + 'px', left: 0, width: '100vw', bottom: 0 };
    const left   = { top: holeTop + 'px', left: 0, width: holeLeft + 'px', height: holeHeight + 'px' };
    const right  = { top: holeTop + 'px', left: holeRight + 'px', right: 0, height: holeHeight + 'px' };

    const ring = {
      top: holeTop + 'px',
      left: holeLeft + 'px',
      width: holeWidth + 'px',
      height: holeHeight + 'px'
    };

    return (
      <div>
        <div className="tut-dim" style={top} />
        <div className="tut-dim" style={bottom} />
        <div className="tut-dim" style={left} />
        <div className="tut-dim" style={right} />
        <div className="tut-spotlight-ring" style={ring} />
      </div>
    );
  }
}

module.exports = TutorialSpotlight;
