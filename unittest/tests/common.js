import { i18nCollection } from 'meteor/illuminist:i18n-db';

import { lpad } from './helpers';

export const maxDocumentId = 30;

export const testCollections = {
  a        : new i18nCollection("a"),
  b        : new i18nCollection("b"),
  c        : new i18nCollection("c"),
  a_aa     : new i18nCollection("a_aa", {
    base_language: "aa"
  }),
  b_aa     : new i18nCollection("b_aa", {
    base_language: "aa"
  }),
  c_aa     : new i18nCollection("c_aa", {
    base_language: "aa"
  }),
  "a_aa-AA": new i18nCollection("a_aa-AA", {
    base_language: "aa-AA"
  }),
  "b_aa-AA": new i18nCollection("b_aa-AA", {
    base_language: "aa-AA"
  }),
  "c_aa-AA": new i18nCollection("c_aa-AA", {
    base_language: "aa-AA"
  }),
};

export const translationsEditingTestsCollection = new i18nCollection("trans_editing");

translationsEditingTestsCollection.allow({
  insert: () => true,
  update: () => true,
  remove: () => true,
});

if (Meteor.isServer) {
  Meteor.publish("trans_editing", function() {
    return translationsEditingTestsCollection.find({});
  });
} else {
  Meteor.subscribe("trans_editing");
}

_.each(testCollections,(collection)=>{
  collection.allow({
    insert: () => true,
    update: () => true,
    remove: () => true,
  });
});

var collection_classes_map = {
  a: 0,
  b: 1,
  c: 2
};

var languages = ["en", "aa", "aa-AA"];


if (Meteor.isClient) {
  window.testCollections = testCollections;
  window.translationsEditingTestsCollection = translationsEditingTestsCollection;
  window.i18n = Meteor.i18n;
}

const init_collections = function() {
  _.each(testCollections, (collection) => {
    collection.remove({});
  });
  var properties_to_translate = [
    "not_translated_to_en", 
    "not_translated_to_aa", 
    "not_translated_to_aa-AA",
  ];
  _.times(maxDocumentId, (i) => {//0 1 2 3...
    _.each(testCollections, (collection, collection_name) => {
      var base_language = collection_name.replace(/(.*_|.*)/, "") || "en";
      var collection_class = collection_name.replace(/_.*/, "");
      if (i % 3 !== collection_classes_map[collection_class]) {
        return;
      }
      var doc = {
        _id: "" + (lpad(i, 4)),
        id: i,
        i18n: {},
        nested: {
          i18n: {},
        },
        baseLang: base_language,
      };
      // init languages subdocuments
      _.each(languages, (language_tag) => {
        if(language_tag !== base_language) {
          doc.i18n[language_tag] = {};
          doc.nested.i18n[language_tag] = {};
        }
        _.each(properties_to_translate, (property) => {
          var not_translated_to = property.replace("not_translated_to_", "");
          var value = property + "^" + language_tag + "-" + i;
          if (language_tag !== not_translated_to) {
            var set_on, set_on_nested;
            if (language_tag === base_language) {
              set_on = doc;
              set_on_nested = doc.nested;
            } else {
              set_on = doc.i18n[language_tag];
              set_on_nested = doc.nested.i18n[language_tag];
            }
            set_on[property] = value;
            set_on_nested[property] = value;
          }
        });
      });
      collection.insert(doc); console.log(doc)
    });
  });
};

if (Meteor.isServer) {
  init_collections();
  _.each(["a", "b", "c"],(_class)=>Meteor.i18nPublish("class_" + _class, function(fields) {
    if (fields == null) {
      fields = null;
    }
    var cursors = [];
    if (fields == null) {
      cursors = cursors.concat(testCollections[_class].i18nFind());
      cursors = cursors.concat(testCollections[_class + "_aa"].i18nFind());
      cursors = cursors.concat(testCollections[_class + "_aa-AA"].i18nFind());
    } else {
      cursors = cursors.concat(testCollections[_class].i18nFind({}, {
        fields: fields
      }));
      cursors = cursors.concat(testCollections[_class + "_aa"].i18nFind({}, {
        fields: fields
      }));
      cursors = cursors.concat(testCollections[_class + "_aa-AA"].i18nFind({}, {
        fields: fields
      }));
    }
    return cursors;
  }));
}
