import _ from 'lodash';
import { Tracker } from 'meteor/tracker'
import globals from './globals';
import { dialectOf, removeTrailingUndefs, commonCollectionExtensions } from './illuminist_i18n_db-common';

export const i18nCollectionTransform = function(doc, collection) {
  if (_.some(collection._disabledOnRoutes, route => route.test(window.location.pathname))){
    return doc;
  }

  const collection_base_language = collection._base_language;
  var language = Meteor.i18n.getLanguage();
  if ((language == null) || (doc.i18n == null)) {
    delete doc.i18n;
    return doc;
  }
  const dialect_of = dialectOf(language);
  doc = {...doc}; // protect original object

  const transformObject = doc => {
    var ret = {};

    if(_.isArray(doc)){
      ret = _.map(doc, transformObject);
    }else if(_.isObject(doc)){
      _.each(doc, (doc, key) => {
        if(key == 'i18n'){
          return;
        }
        if(_.isDate(doc)){
          ret[key] = doc;
        }else if(_.isObject(doc)){
          ret[key] = transformObject(doc); 
        }else{
          ret[key] = doc;
        }
      });
      if(_.isObject(doc.i18n)) {
        if ((dialect_of != null) && (doc.i18n[dialect_of] != null)) {
          if (language !== collection_base_language) {
            ret = _.extend(ret, doc.i18n[dialect_of]);
          } else {
            // if the collection's base language is the dialect that is used as the
            // current language
            ret = _.extend(doc.i18n[dialect_of], doc);
          }
        }
  
        if (doc.i18n[language] != null) {
          ret = _.extend(ret, doc.i18n[language]);
        }
        delete ret.i18n;
      }
    }else{
      ret = doc;
    }
    return ret;
  }
  return transformObject(doc);
};

export const i18nCollectionExtensions = function(obj) {
  const original = {
    find: obj.find,
    findOne: obj.findOne
  };
  const local_session = new ReactiveDict();
  const fn = function(method) {
    return obj[method] = function(selector, options) {
      local_session.get("force_lang_switch_reactivity_hook");
      return original[method].apply(obj, removeTrailingUndefs([selector, options]));
    };
  };
  for (var method in original) {
    fn(method);
  }
  obj.forceLangSwitchReactivity = _.once(function() {
    Tracker.autorun(function() {
      return local_session.set("force_lang_switch_reactivity_hook", Meteor.i18n.getLanguage());
    });
  });
  obj._disabledOnRoutes = [];
  obj._disableTransformationOnRoute = function(route) {
    return obj._disabledOnRoutes.push(route);
  };
  if (Package.autopublish != null) {
    obj.forceLangSwitchReactivity();
  }
  return obj;
};

Meteor.i18nSubscribe = function(name, ...params) {
  const local_session = new ReactiveDict;
  local_session.set("ready", false);

  var callbacks = {};
  if (params.length) {
    var lastParam = _.last(params);
    if (_.isFunction(lastParam)) {
      callbacks.onReady = params.pop();
    } else if (lastParam && (_.isFunction(lastParam.onReady) || _.isFunction(lastParam.onError))) {
      callbacks = params.pop();
    }
  }
  // We want the onReady/onError methods to be called only once (not for every language change)
  var onReadyCalled = false;
  var onErrorCalled = false;
  const original_onReady = callbacks.onReady;
  callbacks.onReady = function() {
    if (onErrorCalled) {
      return;
    }
    local_session.set("ready", true);
    if (original_onReady != null) {
      return original_onReady();
    }
  };
  if (callbacks.onError != null) {
    callbacks.onError = function() {
      if (onReadyCalled) {
        return _.once(callbacks.onError);
      }
    };
  }
  var subscription = null;
  var subscription_computation = null;
  const subscribe = function() {
    // subscription_computation, depends on Meteor.i18n.getLanguage(), to
    // resubscribe once the language gets changed.
    return subscription_computation = Tracker.autorun(function() {
      var lang_tag;
      lang_tag = Meteor.i18n.getLanguage();
      subscription = Meteor.subscribe.apply(this, removeTrailingUndefs([].concat(name, params, lang_tag, callbacks)));
      // if the subscription is already ready: 
      return local_session.set("ready", subscription.ready());
    });
  };
  // If TAPi18n is called in a computation, to maintain Meteor.subscribe
  // behavior (which never gets invalidated), we don't want the computation to
  // get invalidated when Meteor.i18n.getLanguage get invalidated (when language get
  // changed).
  var currentComputation = Tracker.currentComputation;
  if (currentComputation) {
    // If Meteor.i18nSubscribe was called in a computation, call subscribe in a
    // non-reactive context, but make sure that if the computation is getting
    // invalidated also the subscription computation 
    // (invalidations are allowed up->bottom but not bottom->up)
    Tracker.onInvalidate(function() {
      return subscription_computation.invalidate();
    });
    Tracker.nonreactive(function() {
      return subscribe();
    });
  } else {
    // If there is no computation
    subscribe();
  }
  return {
    ready: function() {
      return local_session.get("ready");
    },
    stop: function() {
      return subscription_computation.stop();
    },
    _getSubscription: function() {
      return subscription;
    }
  };
};

Meteor.i18n = (() => {
  const langSessionKey = "i18n::currentLanguage"

  const setLanguage = (langTag) => {
    Session.set(langSessionKey, langTag);
  }

  const getLanguage = () => {
    var lang = null;
    try {
      lang = Session.get(langSessionKey);
    } catch(e) {

    } 

    return lang || globals.fallback_language;
  }

  return {
    setLanguage,
    getLanguage,
  };
})();

export const i18nCollection = function(name, options = {}) {
  var collection, original_transform;
  // Set the transform option

  original_transform = options.transform || function(doc) {
    return doc;
  };
  options.transform = function(doc) {
    return i18nCollectionTransform(original_transform(doc), collection);
  };

  collection = i18nCollectionExtensions(commonCollectionExtensions(new Meteor.Collection(name, options)));

  if (Package["yogiben:admin"] != null) {
    collection._disableTransformationOnRoute(/^\/admin(\/?$|\/)/);
  }

  collection._base_language = "base_language" in options ? options["base_language"] : globals.fallback_language;
  return collection;
};
