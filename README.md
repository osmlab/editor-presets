## Presets

This repository uses a simple presets system based on [JSON](http://en.wikipedia.org/wiki/JSON)
preset definitions and simple structure.

## Individual Presets

Specific presets are located under `/presets`. They're organized in a
directory hierarchy based on OSM key/value pairs. For example, the preset that matches
the tag `leisure=park` is in the file `/presets/leisure/park.json`.

## Preset Format

A basic preset is of the form:

```javascript
{
    // Maki icon which represents this feature.
    "icon": "park",
    // An array of field names.
    "fields": [
        "address"
    ],
    // The geometry types for which this preset is valid.
    // options are point, area, line, and vertex.
    // vertexes are points that are parts of lines, like the nodes
    // in a road
    // lines are unclosed ways, and areas are closed ways
    "geometry": [
        "point", "area"
    ],
    // Terms are synonyms for the preset - these are added to fuel
    // the search functionality. searching for 'woodland' will bring
    // up this 'park' preset
    "terms": [
        "esplanade",
        "village green",
        "woodland"
    ],
    // Tags that are added to the feature when selecting the preset,
    // and also used to match the preset against existing features.
    // You can use the value "*" to match any value.
    "tags": {
        "leisure": "park"
    },
    // English language display name for this map feature.
    "name": "Park"
}
```

## Fields

Fields are, like presets, defined in JSON structures. A typical field is

```js
{
    "key": "access",
    "type": "combo"
}
```

In which `type` is the fields's type. Valid field types are

* textarea
* radio
* combo
* address
* check - a tri-state checkbox: yes, no, or unknown (no tag)
* defaultcheck - a boolean checkbox where checked produces a `*=yes` tag and
  unchecked produces no tag

The `key` property names the OSM key that the field will edit. Alternatively, for
compound fields like `address`, you can specify an array of keys in the `keys`
property.

Each field definition lives in a separate file in `/fields`. The field
name (used in the preset `fields` property) is the name of the file (minus the `.json`
extension).

## Icons

Preset icons in iD are pulled from the open source POI icon set,
[Maki](http://www.mapbox.com/maki/). Icons are stored in `dist/img/maki-sprite.png`.
The icons are identified in iD by the same name as they are on the Maki home. Use those
names when identifying the icon to be used for a given preset.

## Building

To build presets, all you need to do is run `make`.

This command will take care of running the build script, which generates:

* `categories.json` - preset categories
* `fields.json` - all fields
* `presets.json` - all presets
* `presets.yaml` - suitable as a source file for preset translation on Transifex
* `taginfo.json` - all tags used by this project

