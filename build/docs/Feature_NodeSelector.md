# Node Selector
===============



===============================================================================
# USER NOTES
===============================================================================
Updated 4/25/2018


This is a first pass at a Node Entry interface.

## TO TEST
1. Checkout the `node-entry` branch.
2. `npm install`
3. `npm run dev`
4. Point browser to `http://localhost:3000`
5. Select "AutoCompleteDemo"

### Editing Existing Node
1. Start typing in the "NODE SELECTOR > LABEL" field to highlight all matching existing nodes, e.g. type "bo".
2. Move the mouse over a suggestion to view the details for that node.  Notice the graph highlight also updates to reflect the current highlight.
2. Click on a suggested label, e.g. "Board of Health"
3. View the meta details in the form.
4. Click on the "Edit" button to modify the details.
5. Type some new information in any field, or select a new Type.
6. Click on "Save" to save the node.  (Note this just saves it temporarily in the current data store.  There is no permanent data store yet, so the data will be deleted next time you reload the browser).
7. Find the node again to make sure your values were saved.

### Creating a New Node
1. Type the new node in the "NODE SELECTOR > LABEL" field.  Notice this is a good way of making sure there isn't an existing node that is similar.
2. Click on the "Add New Node" button (you may have to click outside the suggestions list to hide it if it's covering the "Add New Node" button.
3. Notice a new ID is automatically created for you.
4. Enter some data.
5. Click "Save" to save the node.


## NEW FEATURES
* The NodeDetails component has been replaced by a NodeSelector component that is capable of handling selection, editing, and adding a new node.
* AutoComplete now matches partial strings.
* NodeDetails now displays the suggestions to the right of the suggestions.  This makes it easier for users to quickly browse the meta data for all the suggested nodes.
* AutoComplete API has been simplified to make it more self contained.
* AutoComplete has been moved out of the root AutoCompleteDemo component and placed into the new NodeSelector component.
* The NodeSelector API is very simple: you essentially pass it graph data, and set a handler for receiving graph data updates.  Everything else is handled internally.
* New node data and node data updates are now saved temporarily in the current data store.  (They will be lost upon browser reload).



## ISSUES
* We probably want to come up with a naming scheme to distinguish between d3 graph nodes, the full data store, and the currently selected data being handled by the React component.


---

===============================================================================
# DEVELOPER NOTES
===============================================================================
Updated 5/16/2018


## HOW IT WORKS

See class comments in `build/app/view/autocompletedemo/components/NetGraph.jsx` for a comprehensive description of how the component works.


## CHALLENGES

* Managing Data

        In the original implementation of NodeSelector, we exposed only two props: a data prop (setter) and a data update prop.  This made it really simple to work with a NodeSelector component and much of the "magic" was hidden.

        However, with the addition of EdgeEntry, we needed to coordinate data and states between NodeSelector and EdgeEntry, and the AutoCompletedDemo root component needed to arbitrate that.  

        Our first attempt at this had NodeSelector updating the core graph data, passing it up to AutoCompleteDemo, which then passed it back down to EdgeEntry.  The problem was that both NodeSelector and EdgeEntry needed to modify the data simultaneously (e.g. if you select a node, you need to modify the data highlight it, and if you also select an edge, you also need to modify the data).  This led to conflicts.

        The solution was to pull the data (state) management out of the NodeSelector component and have AutoCompleteDemo handle it.  So NodeSelector now essentially just passes events up, AutoCompleteDemo processes the events (e.g. user inputs a character), modifies the data as needed, and then passes the modified data back down to NodeSelector, which then updates the display (e.g. show the user input character).


* Controlled vs Uncontrolled Inputs

        React does not like a component to switch back and forth between being a controlled and uncontrolled input element.  

        In order to enforce a controlled input, the input fields, especially 'AutoComplete' needs to have its value bound to the component's state.  For example, AutoComplete's value is bound to this.state.formData.label.

        Since the parent component, AutoCompleteDemo also needs to keep track of the input value (e.g. so it can keep the highlighted graph items up to date, and so it can keep the EdgeEntry Source node up to date), we store the input changes locally in this.state.formData.label, but we also pass it up to AutoCompleteDemo by calling the this.props.onInputUpdate handler.

        Highlights are handled in a similar manner.


* Modes: Search vs Select vs View vs Edit vs Add New

        The component serves five different functions: 

        1. Search -- User types in field to search for a matching node.
        2. Select -- User can browse list of matching nodes and select one from the list.
        3. View -- Once a node is selected, the form displays the content of hte node.
        4. Edit -- When the form elements are enabled, the user can edit and submit th e changes.
        5. Add -- The user can also start with a blank (or partially filled label field) to create a new node.
        
        These different functions affect:
        * The content shown in each form element
        * Whether the form input elements are enabled or disabled.
        * The button on the lower right: "Add Node Node" vs "Edit Node" vs "Save"

        The form display is mostly handled via the `this.state.isEditable` flag, as is the "Save" button.

        In addition, the distinction between "Add New Node" vs "Edit Node" is handled by the presence or absence of `this.props.selectedNode.id`.  If there is no `selectedNode` or the `selectedNode` does not have a valid `id`, then the form data is considered new, so "Add New Node" is displayed.  If there is a valid `selectedNode.id` then we assume there is an existing node being edited so the button reads `Edit Node`
        
        



## TESTING

* Modes: Search vs Select vs View vs Edit vs Add New

        SEARCH
        0.  Starting up
            => The label field should show placeholder "Type node name..."
            => The form should be empty
            => The form should be disabled
            => The bottom right button should say "Add New Node"
        1.  Type "a" 
            => AutoComplete/AutoSuggest should show a list of matching items.
            => The graph should bold the matching items.
            => The other form items should remain blank, especially ID.
        2.  Mouseover suggestions
            --or--  Use keyboard Up/Down Arrows on the highlight
            => AutoComplete/AutoSuggest should show highlight on one item.
            => The graph should bold only one item, and unhighlight the rest.
            => The details of the highlighted item should be displayed in a NodeDetail
        3.  If you click outside the input field
            => The suggestions list should disappaer
        4.  If you type a string that doesn't match any existing node, 
            e.g. "abcd"
            => The suggestions list should show only a blank
            => The bottom right button should display "Add New Node"

        VIEW
        5.  If you click on a suggestion
            => The suggestions list should disappear
            => The clicked on suggestion should be highlighted in the graph
               (and other nodes unhighlighted)
            => The clicked-on suggestion details should be displayed in the 
               form
            => The form items except for the label should remain disabled
            => The bottom right buttons should display "Edit Node"

        ADD NEW NODE
        6.  If you click on "Add New Node" button
            => The form should become editable.
            => There should be a unique ID (generally the last ID + 1) 
               displayed in the ID field.
            => The bottom right button should display "Save"

        EDIT NODE
        7.  If you click on "Edit Node" button
            => The form items should become enabled (editable)
            => You should be able to select a type
            => You should be able to type in the NOTES field
            => You should be able to type in the GEOCODE or DATE field
            => The current node ID should be displayed
            => The bottom right button should display "Save"

        SAVE
        8.  If you click on the "Save" button
            => The newly added node should appear in the graph
            => The form should be blanked out, including ID
            => The form should become disabled
            => The bottom right button should display "Add New Node"










