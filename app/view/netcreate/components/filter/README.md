# Filters

Filtering provides the ability to show and hide nodes and edges based on filter criteria.

* Matches will SHOW the resulting node or edge.
* Any nodes/edges not matching will be hidden.

Filters are set via the "Filters" tab panel.

The graph will immediately update with any changes made by the user to a filter.


## Specifying Filters via the Template Spec

The groups of available filters are drawn directly from the current database's template file, e.g. `tacitus.template`.  It will reflect any customizations made to the labels and hidden/shown status.


### Filter Types

In order for a filter to be defined for any given object key, it must have a "type" specified, e.g.

`_default.template`
```json
    "notes": {
                "type":     "string",
                "label":    "Significance",
                ...
             },
```


The available types are:

* "string"
* "number"
* "select" -- Drop down menu
* "node" -- Special type for edge "source" and "target" setting.
* "markdown" -- Special string subtype that renders markdown as "string" in view mode

Each type has specific operations associated with it, e.g. "string" supports "contains" and "not contains", whereas "number" supports ">" and "!=" etc. 

* Any prompt without a "type" specification will be ignored (e.g. no filter setting will be shown for it).
* `"hidden": true` prompts will not show as a filter.
* Alternatively, you can set the `"type": "hidden"` to have the filter not show and retain the value in the database.


## How Filtering Works


#### How are filters applied?

Filters are applied via an implicit `AND`: An item matches the filter if EVERY filter that is active matches.  For example, if we have:

Node: `Label contains ab`
Node: `Type contains Person`

...then **person** `Abraham Lincoln` will be displayed, but **event** `Abolition` will not.

A few notes:

* Search is case insensitive.

* This works across both node and edge filters.  So ALL node and ALL edge filters must pass.

* Any inactive filter is ignored (e.g. the operator is `--` or the value is `...`).

* Any edge that is connected to a hidden node is automatically hidden, overriding any filter match.


#### How are Nodes/Edges hidden?

There are three types of filtering:
* Fade -- Show matches, fade others
* Reduce -- Show matches, remove others and recalculate sizes
* Focus -- Show only nodes connected to the selected node within a designated range

Programmatically, how a node or edge is filtered depends on the filter type.

* Faded nodes/edges have their `.filteredTransparency` value set to either:
  a. the default transparency level defined in the template (usually 1.0 for nodes, and 0.7 for edges), or
  b. the transparency level set in the FiltersPane (usually 0.2)
* Reduced nodes/edges are completely removed the visible data in the table and graph (FILTEREDD3DATA)
* Focused nodes are also completely removed.

