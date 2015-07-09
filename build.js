var fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    YAML = require('js-yaml'),
    _ = require('lodash'),
    jsonschema = require('jsonschema'),
    fieldSchema = require('./schema/field.json'),
    presetSchema = require('./schema/preset.json');

function readtxt(f) {
    return fs.readFileSync(f, 'utf8');
}

function read(f) {
    return JSON.parse(readtxt(f));
}

function stringify(o) {
    return JSON.stringify(o, null, 4);
}

function validate(file, instance, schema) {
    var result = jsonschema.validate(instance, schema);
    if (result.length) {
        console.error(file + ": ");
        result.forEach(function(error) {
            if (error.property) {
                console.error(error.property + ' ' + error.message);
            } else {
                console.error(error);
            }
        });
        process.exit(1);
    }
}

var translations = {
    categories: {},
    fields: {},
    presets: {}
};

function generateCategories() {
    var categories = {};
    glob.sync(__dirname + '/categories/*.json').forEach(function(file) {
        var field = read(file),
            id = 'category-' + path.basename(file, '.json');

        translations.categories[id] = {name: field.name};

        categories[id] = field;
    });
    return categories;
}

function generateFields() {
    var fields = {};
    glob.sync(__dirname + '/fields/**/*.json').forEach(function(file) {
        var field = read(file),
            id = file.match(/presets\/fields\/([^.]*)\.json/)[1];

        validate(file, field, fieldSchema);

        var t = translations.fields[id] = {
            label: field.label
        };

        if (field.placeholder) {
            t.placeholder = field.placeholder;
        }

        if (field.strings) {
            for (var i in field.strings) {
                t[i] = field.strings[i];
            }
        }

        fields[id] = field;
    });
    return fields;
}

function generatePresets() {
    var presets = {};

    glob.sync(__dirname + '/presets/**/*.json').forEach(function(file) {
        var preset = read(file),
            id = file.match(/presets\/presets\/([^.]*)\.json/)[1];

        validate(file, preset, presetSchema);

        translations.presets[id] = {
            name: preset.name,
            terms: (preset.terms || []).join(',')
        };
        presets[id] = preset;
    });

    return presets;

}

function generateTranslate(fields, presets) {
    var translate = _.cloneDeep(translations);

    _.forEach(translate.fields, function(field, id) {
        var f = fields[id];
        if (f.keys) {
            field['label#'] = _.each(f.keys).map(function(key) { return key + '=*'; }).join(', ');
            if (!_.isEmpty(field.options)) {
                _.each(field.options, function(v,k) {
                    if (id === 'access') {
                        field.options[k]['title#'] = field.options[k]['description#'] = 'access=' + k;
                    } else {
                        field.options[k + '#'] = k + '=yes';
                    }
                });
            }
        } else if (f.key) {
            field['label#'] = f.key + '=*';
            if (!_.isEmpty(field.options)) {
                _.each(field.options, function(v,k) {
                    field.options[k + '#'] = f.key + '=' + k;
                });
            }
        }

        if (f.placeholder) {
            field['placeholder#'] = id + ' field placeholder';
        }
    });

    _.forEach(translate.presets, function(preset, id) {
        var p = presets[id];
        if (!_.isEmpty(p.tags))
            preset['name#'] = _.pairs(p.tags).map(function(pair) { return pair[0] + '=' + pair[1]; }).join(', ');
        if (p.terms && p.terms.length)
            preset['terms#'] = 'terms: ' + p.terms.join();
        preset.terms = "<translate with synonyms or related terms for '" + preset.name + "', separated by commas>";
    });

    return translate;
}

function validateCategoryPresets(categories, presets) {
    _.forEach(categories, function(category) {
        if (category.members) {
            category.members.forEach(function(preset) {
                if (presets[preset] === undefined) {
                    console.error('Unknown preset: ' + preset + ' in category ' + category.name);
                    process.exit(1);
                }
            });
        }
    });
}

function validatePresetFields(presets, fields) {
    _.forEach(presets, function(preset) {
        if (preset.fields) {
            preset.fields.forEach(function(field) {
                if (fields[field] === undefined) {
                    console.error('Unknown preset field: ' + field + ' in preset ' + preset.name);
                    process.exit(1);
                }
            });
        }
    });
}

// comment keys end with '#' and should sort immediately before their related key.
function sortKeys(a, b) {
    return (a === b + '#') ? -1
        : (b === a + '#') ? 1
        : (a > b ? 1 : a < b ? -1 : 0);
}

var categories = generateCategories(),
    fields = generateFields(),
    presets = generatePresets(),
    translate = generateTranslate(fields, presets);

// additional consistency checks
validateCategoryPresets(categories, presets);
validatePresetFields(presets, fields);

// Save individual data files
fs.writeFileSync('categories.json', stringify(categories));
fs.writeFileSync('fields.json', stringify(fields));
fs.writeFileSync('presets.json', stringify(presets));
fs.writeFileSync('presets.yaml',
    YAML.dump({en: {presets: translate}}, {sortKeys: sortKeys})
        .replace(/\'.*#\':/g, '#')
);

// Write taginfo data
var taginfo = {
    "data_format": 1,
    "data_url": "https://raw.githubusercontent.com/osmlab/editor-presets/master/taginfo.json",
    "project": {
        "name": "Editor Presets",
        "description": "Common OpenStreetMap editor presets.",
        "project_url": "https://github.com/osmlab/editor-presets",
        "doc_url": "https://github.com/osmlab/editor-presets/blob/master/README.md",
        "keywords": [ "editor" ]
    },
    "tags": []
};

_.forEach(presets, function(preset) {
    var keys = Object.keys(preset.tags),
        last = keys[keys.length - 1],
        tag = {key: last};

    if (!last)
        return;

    if (preset.tags[last] !== '*') {
        tag.value = preset.tags[last];
    }

    taginfo.tags.push(tag);
});

fs.writeFileSync('taginfo.json', stringify(taginfo));
