import _ from 'lodash';
import globals from './globals';
import { i18nCollectionExtensions } from './illuminist_i18n_db-client';

globals.supportedLanguages = Meteor.settings.public.supportedLanguages;

export const dialectOf = function(lang) {
  if (_.includes(lang, "-")) {
    return lang.replace(/-.*/, "");
  }
  return null;
};

export const removeTrailingUndefs = function(arr) {
  while (!_.isEmpty(arr) && _.isUndefined(_.last(arr))) {
    arr.pop();
  }
  return arr;
};

export const commonCollectionExtensions = function(obj) {

  const reportError = function(error, attempted_operation, callback) {
    if (_.isFunction(callback)) {
      Meteor.setTimeout((function() {
        return callback(error);
      }), 0);
    } else {
      console.log(`${attempted_operation} failed: ${error.reason}`);
    }
    return error;
  };

  const throwError = function(error, attempted_operation, callback) {
    throw reportError(error, attempted_operation, callback);
  };

  const verifyI18nEnabled = function(attempted_operation, callback) {
    //TODO find another way to config i18n enable/disable
    return true;
  };

  const isSupportedLanguage = function(lang, attempted_operation, callback) {
    if (_.includes(Meteor.settings.public.supportedLanguages, lang)) {
      return;
    }
    throwError(new Meteor.Error(400, `Not supported language: ${lang}`), attempted_operation, callback);
  };

  const isModifierEmpty = function(modifier, attempted_operation, callback) {
    if(_.isEmpty(modifier)) {
      throwError(new Meteor.Error(400, "Modifier is empty"), attempted_operation, callback);
    }
  }

  const getLanguageOrEnvLanguage = function(language_tag, attempted_operation, callback) {
    // if no language_tag & isClient, try to get env lang
    if (Meteor.isClient) {
      if (language_tag == null) {
        language_tag = Meteor.i18n.getLanguage();
      }
    }
    if (language_tag != null) {
      return language_tag;
    }
    throwError(new Meteor.Error(400, "Missing language_tag"), attempted_operation, callback);
  };

  obj.insertTranslations = function(doc, translations, callback) {
    try {
      verifyI18nEnabled("insert", callback);
    } catch (error1) {
      return null;
    }
    doc = {...doc};
    translations = {...translations};
    if (translations != null) {
      for (var lang in translations) {
        try {
          // make sure all languages in translations are supported
          isSupportedLanguage(lang, "insert", callback);
        } catch (error1) {
          return null;
        }
        // merge base language's fields with regular fields
        if (lang === this._base_language) {
          doc = _.extend(doc, translations[lang]);
          delete translations[lang];
        }
      }
      if (!_.isEmpty(translations)) {
        doc = _.extend(doc, {
          i18n: translations
        });
      }
    }
    return this.insert.apply(this, removeTrailingUndefs([doc, callback]));
  };

  obj.updateTranslations = function(selector, translations, options, callback) {
    if (_.isFunction(options)) {
      callback = options;
      options = void 0;
    }
    try {
      verifyI18nEnabled("update", callback);
    } catch (error1) {
      return null;
    }
    var updates = {};
    if (translations != null) {
      for (var lang in translations) {
        try {
          // make sure all languages in translations are supported
          isSupportedLanguage(lang, "update", callback);
        } catch (error1) {
          return null;
        }
        // treat base language's fields as regular fields
        if (lang === this._base_language) {
          _.extend(updates, translations[lang]);
        } else {
          _.extend(updates, _.mapKeys(translations[lang], (val, field) => `i18n.${lang}.${field}`));
        }
      }
    }
    try {
      isModifierEmpty(updates, "update", callback);
    } catch (error1) {
      return null;
    }
    return this.update.apply(this, removeTrailingUndefs([
      selector,
      {
        $set: updates
      },
      options,
      callback
    ]));
  };

  obj.removeTranslations = function(selector, fields, options, callback) {
    if (_.isFunction(options)) {
      callback = options;
      options = void 0;
    }
    try {
      verifyI18nEnabled("remove translations", callback);
    } catch (error1) {
      return null;
    }
    if (fields == null) {
      reportError(new Meteor.Error(400, "Missing arugment: fields"), "remove translations", callback);
      return null;
    }
    if (!_.isArray(fields)) {
      reportError(new Meteor.Error(400, "fields argument should be an array"), "remove translations", callback);
      return null;
    }
    var updates = {};
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var lang = _.head(field.split("."));
      try {
        // make sure all languages are supported
        isSupportedLanguage(lang, "remove translations", callback);
      } catch (error1) {
        return null;
      }
      // treat base language's fields as regular fields
      if (lang === this._base_language) {
        field = field.replace(`${lang}.`, "");
        if (field === this._base_language) {
          reportError(new Meteor.Error(400, "Complete removal of collection's base language from a document is not permitted"), "remove translations", callback);
          return null;
        }
        updates[field] = "";
      } else {
        updates[`i18n.${field}`] = "";
      }
    }
    try {
      isModifierEmpty(updates, "remove translations", callback);
    } catch (error1) {
      return null;
    }
    return this.update.apply(this, removeTrailingUndefs([
      selector,
      {
        $unset: updates
      },
      options,
      callback
    ]));
  };

  obj.insertLanguage = function(doc, translations, language_tag, callback) {
    try {
      verifyI18nEnabled("insert", callback);
    } catch (error1) {
      return null;
    }
    // in case language_tag omitted
    if (_.isFunction(language_tag)) {
      callback = language_tag;
      language_tag = void 0;
    }
    try {
      language_tag = getLanguageOrEnvLanguage(language_tag, "insert", callback);
    } catch (error1) {
      return null;
    }
    var _translations = {};
    _translations[language_tag] = translations;
    return this.insertTranslations(doc, _translations, callback);
  };

  obj.updateLanguage = function(selector, translations, ...params) {
    try {
      verifyI18nEnabled("update", callback);
    } catch (error1) {
      return null;
    }
    var language_tag = void 0;
    var callback = void 0;
    var options = void 0;
    _.each(params, arg => {
      if (_.isFunction(arg)) {
        callback = arg;
      } else if (_.isObject(arg)) {
        options = arg;
      } else if (_.isUndefined(options) && _.isString(arg)) {
        // language_tag can't come after options
        language_tag = arg;
      }
    });
    try {
      language_tag = getLanguageOrEnvLanguage(language_tag, "update", callback);
    } catch (error1) {
      return null;
    }
    var _translations = {};
    _translations[language_tag] = translations;
    return this.updateTranslations(selector, _translations, options, callback);
  };

  // Alias
  obj.translate = obj.updateLanguage;

  obj.removeLanguage = function(selector, fields, ...params) {
    var _fields_to_remove;
    try {
      verifyI18nEnabled("remove translations", callback);
    } catch (error1) {
      return null;
    }
    var language_tag = void 0;
    var callback = void 0;
    var options = void 0;
    _.each(params, arg => {
      if (_.isFunction(arg)) {
        callback = arg;
      } else if (_.isObject(arg)) {
        options = arg;
      } else if (_.isUndefined(options) && _.isString(arg)) {
        // language_tag can't come after options
        language_tag = arg;
      }
    });
    try {
      language_tag = getLanguageOrEnvLanguage(language_tag, "remove", callback);
    } catch (error1) {
      return null;
    }
    if (!_.isNull(fields) && !_.isArray(fields)) {
      reportError(new Meteor.Error(400, "fields argument should be an array"), "remove translations", callback);
      return null;
    }
    if (_.isNull(fields)) {
      // remove entire language
      _fields_to_remove = [`${language_tag}`];
    } else {
      _fields_to_remove = _.map(fields, function(field) {
        return `${language_tag}.${field}`;
      });
    }
    return this.removeTranslations(selector, _fields_to_remove, options, callback);
  };
  return obj;

};

