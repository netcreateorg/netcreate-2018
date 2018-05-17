# Edge Entry
============


===============================================================================
# USER NOTES
===============================================================================

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



---

===============================================================================
# DEVELOPER NOTES
===============================================================================
Updated 5/17/2018


## HOW IT WORKS

See class comments in `build/app/view/autocompletedemo/components/EdgeEntry.jsx` for a comprehensive description of how the component works.


## CHALLENGES

* Managing Data

        EdgeEntry has similar data management challenges to NodeSelector.  Initially it started as a simple two-prop component, but eventually we had to move the data management out of the component in favor of the parent AutoCompleteDemo.

        See `build/docs/Feature_NodeSelector.md` for details.


* Modes: Search vs Select vs View vs Edit vs Add New

        Also similar to NodeSelector, the EdgeEntry component served different functions: search, selection, view, edit, and add new.

        EdgeEntry is a little more complicated than NodeSelector because it relies on an external component to set one of its fields: The SOURCE node field is set by NodeSelector via events passed through AutoCompleteDemo.

        Whether one is in "Edit" mode or "Add New" mode depends on whether or not a valid edge has been selected.  Currently we are looking at the source node id and target node id.  If we can find an edge in the data where the source node id matches the `edge.source.id` and target id matches the `edge.target.id` then we select that edge and "Edit" the edge.  If no match is found, we consider it a new edge and display "Add New".

        A few notes/issues:
        *  All of this logic is actually handled by AutoCompleteDemo.  EdgeEntry merely passes the events and input data and AutoCompleteDemo does the selection checking.
        *  Whenever the NodeSelect changes, or when the TARGET field is changed, we do this edge selection matching check.
        *  The relationships are unidirectional -- e.g. {source:a, target:b} does not match {source:b, target:a}.  This might be the correct behavior, but we need to be conscious of this.
        *  Currently, the "Edit" vs "Add New" button behavior is not quite working right and needs debugging.  
        *  **This implementation probably needs to change because Kalani and Joshua want to allow students to be able to define multiple edges of different types between two nodes.**  For example, right now if you select a source and target and they already have a matching edge, we'll simply select that matching ege and not allow you to add a new edge.

* Save source/targets as node objects or ids?

        The form saves the source and target node information as ids.  The D3 edge data also starts out initially with source and targets as ids.  however, somewhere in the loading/processing of the data, it replaces edge.source and edge.target as id objects with references to the actual source and target nodes.

        So even though the form maintains source and target as ids, when the data is updated in AutoComplete, we use the source and target nodes.  See AutoCompleteDemo.handleEdgeUpdate().

        We may want to revisit this to see if this is a function that should be properly handled by D3 (e.g. during an enter() phase), and consider how we want to save that data in our own database.


* Updating Links in the graph

        Most example force directed graph code out there does not handle link merges during the D3 update.  We initially were using one such example, so changing the link data structures during a session results in disconected links.  We had to modify `D3SimpleNetGraph.jsx` 



## TESTING

* Modes: Search vs Select vs View vs Edit vs Add New

        EdgeEntry shares some of the same modes as NodeSelector, with a few additional nuances.

        **NOTE: Joshua has proposed an alternative interface that will make some of this moot.**

        SEARCH
        0.  Starting up
            => The SOURCE label field should be empty
            => The TARGET label field should show placeholder "Type node name..."
            => The form should be empty
            => The form should be disabled
            => The bottom right button should say "Add New Edge"
        1.  Select a node with NodeSelector ("Board of Health")
            => The SOURCE label field should show the node label.  The other fields should remain the same.
        2.  Type "p" in the TARGET field 
            => AutoComplete/AutoSuggest should show a list of matching items.
            => The graph should bold the matching items.
            => The other form items should remain blank, especially ID.
        3.  Mouseover suggestions
            --or--  Use keyboard Up/Down Arrows on the highlight
            => AutoComplete/AutoSuggest should show highlight on one item.
            => The graph should bold the highlighted item, keep the SOURCE highlighted, and unhighlight the rest.
            => The details of the highlighted item should be displayed in a NodeDetail
        4.  If you click outside the input field
            => The suggestions list should disappaer
        5.  If you type a string that doesn't match any existing node, 
            e.g. "abcd"
            => The suggestions list should show only a blank

        VIEW
        6.  If you click on a suggestion
            => The suggestions list should disappear
            => The clicked on suggestion should be highlighted in the graph
               (and other nodes except for SOURCE unhighlighted)
            => If there is already an edge between the two nodes, the edge 
               information should be loaded on the form: You should see NOTES (if set), DATE (if set), and definitely the ID.
            => The form items except for the label should remain disabled
            => The bottom right buttons should display "Edit Edge" 
               **This is currently broken ==> it shows "Add New Edge"**
            **POSSIBLE ISSUE: You can only select a TARGET field by clicking on a suggestion.  You can't click on the graph to select the target -- clicking on the graph selects the source.  You can't type in the whole name of the target to select either -- the system doesn't know if you are intending to select something or are merely continuing to type.  We might need to assume that if there is an exact match with a label, the intent is to select that target.**
        7.  If you make another SOURCE selection
            --or-- If you select another TARGET
            If after you've already loaded a valid edge, you change the source or the target...
            => if the new selection matches an edge, that edge should be 
               loaded.
            => if the new selection does not match an edge, the form should be 
               cleared, especially ID.
            **There is currently a bug where repeatedly changing the TARGET node seems to result in older nodes not being found, e.g. if you start with "Plague Victims" then switch to "George Boardman" and then try to reselect "Plague Victims", "Plaque Victims" will no longer show up in the autosuggest list.**


        ADD NEW EDGE
        8.  If you click on "Add New Edge" button
            => The form should become editable.
            => There should be a unique ID (generally the last ID + 1) 
               displayed in the ID field.
            => The bottom right button should display "Save"

        EDIT EDGE
        9.  If you click on "Edit Edge" button
            => The form items should become enabled (editable)
            => You should be able to select a type
            => You should be able to type in the NOTES field
            => You should be able to type in the DATE field
            => The current edge ID should be displayed
            => The bottom right button should display "Save"
        10. During form edit or add, if you select a different SOURCE or 
            TARGET node
            => See #7
            => The form should exit the Edit Mode.
            **ISSUES**
            * We should warn the user about unsaved changes before changing the form data.
            * We need to validate the selected items -- e.g. you can type a non-existent source/target label and blindly edit the edge and only get an error when you "Save" the edge.

        SAVE
        8.  If you click on the "Save" button
            => The newly added edge should appear in the graph
            => The form should be blanked out, including ID
            => The form should become disabled
            => The bottom right button should display "Add New Edge"        

































