import globals from './globals';
import { dialectOf, commonCollectionExtensions } from './illuminist_i18n_db-common';
const Fiber = Npm.require('fibers');

export const i18nCollectionExtensions = function(obj) {
  obj.i18nFind = function(selector, options) {

    var lang;
    var current_language = Fiber.current.language_tag;

    if (typeof current_language === "undefined") {
      throw new Meteor.Error(500, "i18nCollection.i18nFind should be called only from Meteor.i18nPublish functions");
    }
    if (_.isUndefined(selector)) {
      selector = {};
    }

    var dialect_of = dialectOf(current_language);
    var collection_base_language = this._base_language;
    var supported_languages = Meteor.settings.public.supportedLanguages;

    if ((current_language != null) && !_.contains(supported_languages, current_language)) {
      throw new Meteor.Error(400, "Not supported language");
    }

    if (options == null) {
      options = {};
    }

    var original_fields = options.fields || {};

    if(!_.isUndefined(original_fields) && !_.isObject(original_fields)){
      var mappedField = original_fields;
      original_fields = {};
      original_fields[mappedField] = 1; 
    }

    var i18n_fields = _.extend({}, original_fields);

    if (!_.isEmpty(i18n_fields)) {
      // determine the projection kind
      // note that we don't need to address the case where {_id: 0}, since _id: 0
      // is not allowed for cursors returned from a publish function
      delete i18n_fields._id;

      var white_list_projection = _.first(_.values(i18n_fields)) === 1;

      if ("_id" in original_fields) {
        i18n_fields["_id"] = original_fields["_id"];
      }

      if (white_list_projection) {
        if (current_language !== null) {
          _.each(supported_languages, lang => {
            if (lang !== collection_base_language && (lang === current_language || lang === dialect_of)) {
              _.each(_.keys(original_fields), field => {
                if (field !== "_id") { // aaa.0.field >> aaa.0.i18n.lang.field
                  var splitfields = field.split(".");
                  var i18n_field = _.initial(splitfields).concat('i18n',lang,_.last(splitfields)).join(".");
                  i18n_fields[`${i18n_field}`] = 1;
                }
              });
            }
          });
        }
      } else {
        // black list
        if (current_language === null) {
          i18n_fields.i18n = 0;
        } else {
          _.each(supported_languages, lang => {
            if (lang !== collection_base_language) {

              if (lang !== current_language && lang !== dialect_of) {

                i18n_fields[`i18n.${lang}`] = 0;
              } else {
                _.each(_.keys(original_fields), field => {
                  if (field !== "_id") {
                    var splitfields = field.split(".");
                    var i18n_field = _.initial(splitfields).concat('i18n',lang,_.last(splitfields)).join(".");
                    i18n_fields[`${i18n_field}`] = 0;
                  }
                });
              }
            }
          });
        }
      }
    } else {

      if (current_language === null) {
        i18n_fields.i18n = 0;
      } else {
        _.each(supported_languages, lang => {
          if (lang !== collection_base_language && lang !== current_language && lang !== dialect_of) {
            i18n_fields[`i18n.${lang}`] = 0;
          }
        });
      }

    }

    return this.find(selector, _.extend({}, options, {
      fields: i18n_fields
    }));
  };
  return obj;
};

Meteor.i18nPublish = function(name, handler, options) {
  if (name === null) {
    throw new Meteor.Error(500, "Meteor.i18nPublish doesn't support null publications");
  }
  const i18n_handler = function() {
    var args = Array.prototype.slice.call(arguments);
    // last subscription argument is always the language tag
    var language_tag = _.last(args);
    this.language = language_tag;
    // Set handler context in current fiber's
    Fiber.current.language_tag = language_tag;
    // Call the user handler without the language_tag argument
    var cursors = handler.apply(this, args.slice(0, -1));
    // Clear handler context
    delete Fiber.current.language_tag;
    if (cursors != null) {
      return cursors;
    }
  };
  // set the actual publish method
  return Meteor.publish(name, i18n_handler, options);
};

export const i18nCollection = function(name, options = {}) {
  var collection;
  
  collection = i18nCollectionExtensions(commonCollectionExtensions(new Meteor.Collection(name, options)));

  collection._base_language = "base_language" in options ? options["base_language"] : globals.fallback_language;
  return collection;
};
