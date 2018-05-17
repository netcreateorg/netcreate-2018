Edge Entry
==========

Updated 5/9/2018


This is a first pass at an Edge Entry interface.

## TO TEST
1. Checkout the `edge-entry` branch.
2. `npm install`
3. `npm run dev`
4. Point browser to `http://localhost:3000`
5. Select "AutoCompleteDemo"


### Create a New Edge
1. Select a Source node by clicking on a node, e.g. "Board of Health"
2. Notice the "Board of Health" will be selected in the blue "NODE SELECTOR" area.
2. Notice the "Board of Health" node is outlined in blue on the graph.
3. Notice also, "Board of Health" will be selected as the "SOURCE" in the green "EDGE SELECTOR" area.
4. Select a Target node by clicking in the green "EDGE SELECTOR" "TARGET" input area, and start typing another node name, e.g. "Bl" and then select "Blount".
4. Notice the "Blount" target node is outlined in red.  The Source nodes are blue and the target nodes are red.  (We can obviously change the colors once we figure out a color scheme).
5. Click the "Add New Edge" button.
6. Select the "Type" of relationship.
7. Type in some "NOTES"
8. Type in "APPROXIMATE DATE OF INTERACTION"
9. Click the "Save" button.
10. This should add a new edge.  You should see the graph update itself.


### Edit an Existing Edge
1. Select a Source node by clicking on a node, e.g. "Board of Health"
2. Select an existing edge Target node by clicking in the green "EDGE SELECTOR" "TARGET" input area, and start typing another node name, e.g. "Pl" and then select "Plague Victims".
3. Notice the EDGE SELECTOR will automatically fill itself out with the selected edge, and the edge itself will be highlighted on the graph.
3. You can also select an edge by clicking on it.
4. Try changing the TARGET node.  Notice as soon as you type, the selected edge is deselected.  The same thing will happen if you change the NODE SELECTOR Source.
5. Reselect "Plague Victims"
6. Click "Edit Edge"
7. Change  the TYPE or NOTES or DATE.
8. Click "Save"


## RATIONALE
Getting the UI interactions right for this ended up being much more hairy than I originally thought.  The general idea with this approach was to minimize the number of clicks one would have to make while adding/editing nodes and edges.  So rather than having a completely separate Edge Entry UI, I thought we could take advantage of the node already selected by the NODE SELECTOR.  You would use the NODE SELECTOR to do any node editing.  And then can quickly add related edges.  Through a quirk of the UI, the selected SOURCE node remains selected after you submit the edge, so you can quickly add a second edge.

Another goal was to support quick data entry via the keyboard.  This isn't quite there yet, but it's close.  We can refine the workflow some more so that you can quickly enter data dynamically with the keyboard.

The challenge is that the NODE SELECTOR and EDGE SELECTOR objects then have all these different modes and serve different display/edit purposes. So we have to carefully manage those states and make the transitions as intuitive as possible (e.g. letting the user know when they can and cannot edit the contents).  It still needs some refinement.


## NEW FEATURES
* **Clickable Nodes and Edges** -- You can now click on either a node or an edge to select it.  Edges can be difficult to select since they're so thin, so you may have to try a few times before it'll take.
* **Select Edge via Source/Target** -- Selecting both a valid source and target node will automatically select any relevant edges.  This ought to prevent duplicate edges.
* **Highlight using UP/DOWN Arrows and RETURN** -- I didn't mention this last time, but you can select highlighted suggestions using the arrow keys and the RETURN key.
* **Node Radius Related to Edges** -- The size of each node is now determined by the number of edges it has.  We've replaced the full data set with a reduced set showing only 4 edges to make it easier to see what's happening with edge editing.  This is really more of a hack and D3 exploration than a feature per-se.  Force Atlas 2 would probably replace some of these features.


## ISSUES
* We don't really have any data validation at the moment.
* Some of the graph highlighting can be off sometimes (e.g. selected nodes/edges are not marked).
* You can't quite do everything with the keyboard yet.