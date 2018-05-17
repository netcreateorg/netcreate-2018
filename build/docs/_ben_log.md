Ben's Daily Development Log
===========================

These are my daily notes as I work on features.



2018-03-27 Auto Complete Demo
=============================
    PROBLEM     Demo an auto completion system
    SOLUTION    https://www.npmjs.com/package/react-autosuggest

    PROBLEM     Should autocomplete be working with a data/node object
                instead of a string of arrays?   That way we can 
                return more interesting information when selected?

    PROBLEM     D3 is now displayed but...
                ...it isn't being updated?
    
                Props are being received with every FauxDom animation frame?
    
                So maybe we need a different mechanism to pass the data.nodes?  Or at least not do the initialization?
    
                Have a special handler?
    
                Redo NetGraph without fauxDom
                    Shut React out of updating the component
                    and let d3 handle it
                    http://ahmadchatha.com/writings/article1.html
                    https://stackoverflow.com/questions/21903604/is-there-any-proper-way-to-integrate-d3-js-graphics-into-facebook-react-applicat/21943949#21943949
                    https://mikewilliamson.wordpress.com/2016/06/03/d3-and-react-3-ways/
    
                What should happen with props updates?
                    Can we update the data without adding new components?
                    or do we need to delete old components?
                    keep the data in this.state?
                    or should it be in this.props.data?
    
                    Or do we call some d3 update without changing data?
    
                    or do we delete the old data first?
    
                What's the key events?
                    Initial Data Object Creation is in initializedisplay?
                    WHat if we create a new svg with each update?
                    componentDidMount is constructor
    
                When setState is called, when is the state actually updated?
                    => Sometime later...use callback on setState
    
                Replace existing data or update somehow?
                    Which call creates a new object and which merely updates?
                      x initializeDisplay( data )
                            -- maybe just sets the source?
                            => Calling this creates new objects.
                      x initializeSimulation( data )
                            -- maybe just sets forces?
                      showNodes( data )
                            -- not calling it on update doesn't do anything
                            -- Calling this does not do anything?
                What's the call in d3 that updates the sim?
    
                NEXT: update the data without recreating nodes?
                    how do we update existing nodes?
                    http://bl.ocks.org/alansmithy/e984477a741bc56db5a5
                    this article might represent a better way to deal withthe objects -- split out circle.enter, exist, and transition into separate calls?
    
                After data update, drag stops working
                    Somehow initializeDisplay is not calling enter()?


2018-04-18 Integrate ReactStrap
===============================
    PROBLEM     Integrate ReactStrap into AutoComplete Demo
    SOLUTION    


2018-04-25 Handling Data Entry
==============================
    PROBLEM     How should the data entry workflow go?
    ANALYSIS    Issues
                *   How do you indicate that you want to create something new?
                    Use the Search field and click "Add New"?
                    Click a "New Node" button?
                *   How do you update an existing node?
                    Need to populate the form with existing data!
                *   After clicking Create, do we clear the form?
                *   Or does the form go back and forth between edit mode and 
                    display mode?
                
                Create a new nodeObject in AutoComplete when a new suggestion is added?  This way NodeEntry always deals with valid node objects.
    
                STATUS: 
                    Saved node is not propagating to main app data.
                    Also need to clear form after Save

    PROBLEM     How to handle edge creation?
    ANALYSIS    Possible Solutions:
                1.  NodeSelector Component
                        Encapsulates AutoComplete and NodeEntry into a single component.  This might simplify the data passing.
                2.  EdgeCreator Component
                        Uses two NodeSelector Components along with some extra edge-related fields.

    ISSUES      *   How do you handle click-selection when you need to select 
                    two different nodes?  Only one NodeSelector is active at a time?  
    
                *   How do you distinguish between node selection/exploration
                    and Edge Entry mode?  Do you always have both available?  Or do you have click "Open Second Node for Edge" or something like that?
    
                *   Should NodeSelector include AutoComplete and NodeEditor?
                    --  Makes the component easy to use with edge editor
                    --  Would you ever want to use AutoComplete or NodeEditor
                        by itself without the other?
    
                *   Should `lexicon` be created/maintained at the at app level
                    or should the autoComplete component create and maintain it?
                    This way we can just blindly pass a data object back and
                    forth and have the autoComplete component take care of it instead of splitting the functionality across two different components.
    
                *   Should NodeSelector combine AutoComplete and NodeEditor
                    or should it replace NodeEditor?
                    Would we want the AutoComplete field to ever show something other than what is being edited in the NodeEditor?  Probably not.
                    Related Issues:
                    --  When the Autocomplete input changes, we need to 
                        update the data object to show currently selected items
                        so the data object needs to be passed from NodeSelector to its parents.
                    --  Should there be a common data object shared across all 
                        objects?  Or should each object keep its own copy?
                        =>  SHARED would make more sense?
                    --  Remove the following from NodeSelector
                            {/* 
                              selectedNode={this.state.selectedNode}
                              onNewNode={this.handleNewNode} 
                          */}
    
    PROBLEM     How to handle two NodeSelectors?
    ISSUES      *   Each will clear the other's selection during update cycles.
                *   Selections all show as black circles -- use diff colors?
                *   Handle simultaneous selections?
    
    SOLUTIONS   Tags?  Markers?

    ISSUES      Conditions
                *   Click "Add New Node" without typing
                *   Type new node, and click "Add New Node"
                *   Type new, click "Add New Node" next to new label
                *   Type new, click "Add New Node" and then type somem ore
                *   Type existing, click "Edit"

    PROBLEM     HighlightedNode vs SelectedNode
                Multiple Issues here
                *   After you unhighlight the suggestion, you want the 
                    form to clear so that you have a fresh start, otherwise the previously highlighted data remains in the form.
                *   If we just use highlight and selection both to call
                    onSelection, then if we higlight a suggestion, then try to type in another selection, and click "Edit" the old highlighted data is still there.
                *   As you type, if there are no matches, we don't necessarily
                    want to clear the selectedNode because you haven't selected anything yet?  Or is this being confused with the issue of highlighting the circles?
                When trying to create a new node, sometimes you type in the field, then click "Create New Node" without highlighting 
    
                There are three items being updated with typing:
                1.  List of suggestions          -- ALL matches
                2.  Preview of node data in form -- First match
                3.  Bold circles in graph        -- ALL matches



2018-05-03 Handling Data Entry
==============================
    PROBLEM     Handling Node Detail vs Node Edit
                *   onHighlight
                    -   Update nodedetail
                    -   Update circle highlight
                *   onHighlightSelect
                    -   Remove nodedetail
                    -   UPdate node editor
                    -   Update circle highlight

    PROBLEM     Nuances
                *   Highlight graph node when highlight changes
                *   Creating a new node is awkward
                    -   Always show "Add New"
                    -   Don't show "Edit Node" until something is selected.
                *   When input is cleared, then selectedNode should be cleared too
                *   After submit, form should be cleared
                *   Once you're editing, the input field needs to stop autocomplete
                    -   Use a different label field?
                    -   Turn off autosuggest?
                *   Remove use of "[+] Add New" suggestion
                *   On unhighlight, re-select all matching graph nodes



2018-05-03 Handling Edge Entry
==============================
                *   Allow multiple node selections -- highlight with different colors?

    PROBLEM     Edges aren't being drawn relative to the nodes?
    ANALYSIS    Look into how to add an edge D3
                *   Edge is drawn, but not tied to segments
                *   Force more ticks?
                *   Why is dragging also wrong?
    
               Annotated explanation of modifying a force layout for d3 version 3
               https://gist.github.com/rdpoor/3a66b3e082ffeaeb5e6e79961192f7d8
    
               For d3 version 4
               https://bl.ocks.org/tezzutezzu/cd04b3f1efee4186ff42aae66c87d1a7 
    
               <line stroke-width="1" opacity="1" x1="196.18291814249372" y1="439.0660937482182" x2="202.71449856576265" y2="408.7405528029853"></line>
    
               Blount
                151
                x 197.89
                y 441.81
    
                Hawaiian Language Press
                    160
                    x 209
                    y 410

    PROBLEM     Handling two selections and clicking
    ISSUES      How do you switch control back and forth between the 
                two input sources?
    
                Who should handle selection updates?
    
                When do selections happen?
                *   INT: During typing matching many sources
                *   INT: After a specific suggestion item is highlighted
                *   INT: After a specific suggestion item is selected (clicked)
                *   EXT: After a direct click selecting a node
    
                How should state be handled?
                *   The parent container should have state for all subcontainers.
                *   Subcontainer changes should propagate upwards.
                *   The parent container should maintaing the main data store.
                *   The auto input field should be manged locally?
                    How do you pass the state to the local, and then respond?
                        AutoCompleteDemo
                        =>  setValue
                        NodeSelect
                        =>  setSelectedNode.Label( setValue )
                        =>  selectedNode.label( set )
                        =>  Propagagtes back up to AutoCompleteDemo
                    If a local change?
    
                AutoCompleteDemo holds ALL State
                    state = {
                        data:
                        
                        // pass to child
                        selectedSourceNodeId:
                        highlightedSourceNode:
                        sourceInputValue:
    
                        // receive from child
                        handleSourceInputUpdate
                        handleSourceNodeSelection
                        handleSourceNodeHighlight
    
                        selectedTargetNodeId:
                        highlightedTargetNode:
        
                    }


    PROBLEM     AutoCompleteDemo.handleSourceInputUpdate is changing
                NodeSelect's selectedNode (formData) to empty if 
                it does not match an existing node.

    PROBLEM     When EdgeEntry submits the edge, what should be cleared?
                TargetSource should be cleared.  Should Main source?
    
                *   Clean up unused methods, varaibles from NodeSelect
                *   Revamp edge entry to pass data to parent



2018-05-08 Edge Entry Refinement
================================
    PROBLEM     warning.js:37 Warning: A component is changing an uncontrolled 
                input of type text to be controlled. Input elements should not switch from uncontrolled to controlled (or vice versa). Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://fb.me/react-controlled-components
    ANALYSIS    Explanation of when an element is 'controlled'
                https://goshakkk.name/controlled-vs-uncontrolled-inputs-react/
    
                => Fix was to make sure value={} was set
                => Also using value={this.state.selectedNode?selectedNode.label||''} doesn't work.


    PROBLEM     When should "Add New Node" be shown?
    ANALYSIS    Conditions
                *   When NodeSelector.props.selectedNode is blank?
                *   Highlights need to use id?  not label?
                *   Add New Node is not showing?


    PROBLEM     How to count link strength
                https://stackoverflow.com/questions/43906686/d3-node-radius-depends-on-number-of-links-weight-property

2018-05-09 Edge Entry Refinement
================================
    PROBLEM     If you select an edge, then select another node, the edge 
                needs to be deselected if the source and targets don't match the current edge.  In other words, in EdgeEntry, when either source or target changes, if the edge already exists, load it, otherwise, erase it? or create a new one?  And deselect the existing one.
    ANALYSIS    Trigger on source or target selection
                Edge selection should happen at the root level?
                So whenever a target or source node get selected, the root needs to check to see if a matching edge is found?
    
                *   BUG: Can't add new edges
                *   BUG: Board of Health label is getting cleared somehow (selectedNode)
                    -   This is happening on EdgeEntry edit
                *   If Node is being edited, do not pass inputUpdate to AutoComplete
                    to prevent constant selection and deselection of node?
                *   Check for existing edge before adding
                *   Make edges clickable/selectable
                *   Retrieve existing node


NEXT:
*   Are edges bidirectional?
*   Edge types can't be set -- if you select an item, it reverts to the first selection.

*   Highlighting and hitting enter results in a new edge
    -   Combine Save/Submit into one button to allow keyboard behavior?
*   Error check -- empty form elements!
*   
*   Remove Edge
*   Remove Node
*   
*   Redo node data structure -- attribute or no attribute?
*   Select autosuggest on Enter?
*   
*   Test suites!
*   
*   Show complete list of nodes?
*   Allow selection of nodes directly from list?
*   Fix touch drag?
*   Dynamically set height/width/zoom?
*   Calculate radii based on links?
*   Calculate distance based on links?
*   Label overlap -- Use a separate simulation to use collision/charge to spread out label?


ISSUES:
*   D3: When does "source" and "target" get converted from ids to objects?
*   Distinguish between form data and d3 data formats
    -   e.g. should it be edge.source or edge.sourceId?
    -   should they have different names, e.g. edgeD3Data vs edgeFormData
