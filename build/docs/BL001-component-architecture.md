# Component Architecture Overview
=================================

Updated 5/16/2018

This is an evolving overview of the way that react components are wired together in the current working prototype captured in the "AutoComplete Demo" application in the NetCreate tab bar.



# Auto Complete Demo
====================

The basic structure of the app looks like this:

    AutoCompleteDemo
    |
    +- NodeSelector
    |  |
    |  +- NodeDetail
    |  |
    |  +- AutoComplete
    |     |
    |     +- AutoSuggest
    |
    +- EdgeEntry
    |  |
    |  +- *AutoComplete (for Target Node)*
    |
    +- NetGraph
       |
       +- D3SimpleNetGraph
          |
          +- D3



---

## AutoCompleteDemo.jsx

`AutoCompleteDemo.jsx` is the root element.  

*   It maintains the graph data in `this.state.data`
*   It handles events from NodeSelector, EdgeEntry, and NetGraph components
    and passes data and upates across them.

See the class comments for `AUtoCompleteDemo.jsx` for a detailed description.



---

## NodeSelector.jsx

NodeSelector is a form for searching for, viewing, selecting, and editing Node information.

NodeSelector does not modify any data.  It passes all events (text updates,
highlights, and suggestion selections) up to the parent.  The parent
object should process the events and update the data accordingly.  The
updated data is then rendered by NodeSelect.

NodeSelector is mostly a form control using react-strap form components.  The one exception is the `AutoComplete.jsx` component, which is built on top of the `AutoSuggest.jsx` component. 

See `build/docs/Feature_NodeSelector.md` for a description of the rationale and challenges in developing the component.

See class comments in `build/app/view/autocompletedemo/components/NetGraph.jsx` for a comprehensive description of how the component works.



---

## AutoComplete.jsx
## AutoSuggest.jsx

AutoComplete is the text input field for entering node labels to:
* search for nodes, 
* edit existing nodes, 
* and add new nodes.  

Main features:

* It interactively provides a list of suggestions that match the current input, e.g. typing "ah" will display a list of suggestions including "Ah Long", "Ah Seung", and "Oahu Railroad Station".

* Users can highlight suggestions (via mouseover or with keyboard arrows)

* Users can select a suggestion (via clicking or hitting return)

AutoComplete is a wrapper class for the open source AutoSuggest component, which handles the actual rendering of the suggestions list.  AutoComplete provides an interface to NodeSelector and EdgeEntry.  AutoComplete also provides the handler routines for generating the suggestions list and handling highlights and selections.

See class comments in `build/app/view/autocompletedemo/components/AutoComplete.jsx` for a comprehensive description of how the component works.



---

## NodeDetail.jsx

NodeDetail is primarily a display component that can show the details in a node data object.  It is used to provide a preview of a node as the user highlights different nodes.

See class comments in `build/app/view/autocompletedemo/components/NodeDetail.jsx` for a comprehensive description of how the component works.




---

## EdgeEntry.jsx

EdgeEntry is a form for searching for, viewing, selecting, and editing Edge information.

It works in conjunction with NodeSelector to define edges.  NodeSelector defines the source node, and EdgeEntry defines the target node.

EdgeEntry does not modify any data.  It passes all events (text updates,
highlights, and suggestion selections) up to the parent.  The parent
object should process the events and update the data accordingly.  The
updated data is then rendered by EdgeEntry.

EdgeEntry is mostly a form control using react-strap form components.  The one exception is the TARGET field, which uses the `AutoComplete.jsx` component, which is built on top of the `AutoSuggest.jsx` component. 

See `build/docs/Feature_EdgeEntry.md` for a description of the rationale and challenges in developing the component.

See class comments in `build/app/view/autocompletedemo/components/EdgeEntry.jsx` for a comprehensive description of how the component works.



---

## NetGraph.js

NetGraph is a wrapper for a D3 force simulation graph component: `D3SimpleNetGraph.js`.  It provides the data interface to AutoCompleteDemo, and allows the D3SimpleNetGraph to run outside of react's render loop.

It also handles node and edge click events detected by D3SimpleNetGraph and passes the events back up to AutCompleteDemo.



---

## D3SimpleNetGraph.js

D3SimpleNetGraph is a class that renders a D3 force simulation graph.  It runs independently of react.

It currently accepts data as defined in `build/app/assets/htmldemos/d3forcedemo/data.json`.

Lessons Learned

*   Watch out for v3 vs v4 documentation on force simulations.  v4 has changed
    the way force simulations work.

*   Most example code out there does not handle link merges during the D3
    update, so changing the link data structures during a session results in disconected links.  `D3NetGraph.jsx` was the initial implementation that did not account for this.  It has since been deprecated in favor of `D3SimpleNetGraph.js`

*   Similarly, most example code does not properly handle link ids.  
    Our implementation of link ids might be problematic.  Right now in `build/app/view/autocompletedemo/components/D3SimpleNetGraph.js` `_UpdateGraph` when linkElements are defined in line 190, we return a unique identifier constructed of `source.id + "-" + target.id` per various code examples.  This is problematic in two ways:
    1.  It does not allow multiple edges to be defined between any two sources and targets.
    2.  It ignores the edge.id field that should already be defined and should be unique.
    We can probably get away with returning `edge.id` instead.




===============================================================================
# ISSUES
===============================================================================

Data Representation

The data structure as defined in `build/app/assets/htmldemos/d3forcedemo/data.json` is somewhat arbitrary -- it's the format that Google Fusion Tables (I think...it may have been Gephy) used when exporting the data.  As a result, it has some peculiarities that we probably don't want to follow, in particular, it uses string keys for attributes.  e.g.

`node` objects in the D3 data (AutoCompleteDemo's `this.state.data.nodes[n]`) look like this:

    {
      "id": "85",
      "label": "William McKinley",
      "attributes": {
        "Node_Type": "Person",
        "Extra Info": "",
        "Notes": ""
      }
    },

But `node` objects in `NodeSelect` form are saved like this:
    {
      "id": "85",
      "label": "William McKinley",
      "type": "Person",
      "info": "",
      "notes": ""
    },

We probably want to standardize on a format and/or provide an interface class for translating between the two.













