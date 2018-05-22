## Handling Layout

FLEXBOX - HOW DO THEY WORK
they are a single dimension collection
parent: display:flex, flex-flow: row nowrap // direction, wrapping
children: flex: 0 1 auto // grow shrink default size

FLEXBOX - HOW DOES BOOTSTRAP AFFECT THIS?
largely it doesn't if we are not using its grid layout, though I suspect there might be grid controls that do what we want.

DEBUGGING IFRAME HEIGHT

  index.html           | body          min-height: 100%
  index.html           | div#app
  init-appshell        |   div         display:flex, flex-flow:column nowrap,
                                       width:100%, height:100vh
  init-appshell        |     Navbar    position:fixed
  --- COMPONENT BELOW ---
  init-appshell.HTML() |     div       display:flex, flex-flow:column nowrap,
                                       width:100%
  init-appshell.HTML() |       iframe  flex:1 0 auto, border:0

Q. How to control sizes in flexbox items?
A. flex-grow, flex-shrink, flex-basis (shortcut: flex)

flex-grow is set to 0 if no adaptive growing is desired.
.. set it to positive value "how fast to grow" relative to other siblings.
flex-shrink is set to 0 if no adaptive shrinking is desired.
.. set it to positive for "how fast to shrink" relative to other siblings.
flex-basis is the initial size of the box, and default to size of content.
.. set it to a size like 200px if you want it to be a fixed size

[Feb 26]

FLEXBOX works in 1 dimension, and uses content as basis (size)
GRID works in 2 dimensions, and uses layout as basis (size). It's newer.

GRID lets you define relationships in fr units for columns and rows
GRID defines sizes of grid element on numbered boundaries
display:grid
  grid-template-columns, grid-template-rows - uses sizes or new fr (fraction) units (explicit grid)
  use repeat(count,1fr) macro to make large grids
  grid-auto-rows and grid-auto-columns create new content that don't fit in explicit grid.
  grid-auto-rows: minmax(min,max) where min is minimum size, max can be set to auto
  grid-column-gap, grid-row-gap
ITEMS:
  for positioning, uses grid LINES, not the size of the grid tracks.
  grid-column-start, grid-column-end, grid-row-start, grid-row-end
  note: grid items can overlap, control stack with z-index





