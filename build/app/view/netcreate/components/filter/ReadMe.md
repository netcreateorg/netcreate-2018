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

Programmatically, any node or edge that is filtered is marked with a `isFilteredOut` flag.  If `isFilteredOut` is true, the object is hidden.  If `isFilteredOut` is absent or is false, the object is displayed.

Hiding is simply done by setting the opacity of the node or edge.  Nodes and edges are not actually removed from the graph.



### Storyboard

With the Filtering system, we introduce a new development toolkit [storybook.js](https://storybook.js.org/).  This is primarily used for the basic component development and data architecture design.  

* It is not yet fully integrated with the UNISYS architecture.
* It is not yet fully integrated with bootstrap/css, so components are not displayed using the site's settings.

To run storybook, use `npm run storybook`.

