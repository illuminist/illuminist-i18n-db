var test_collections = share.test_collections;

var translations_editing_tests_collection = share.translations_editing_tests_collection;

var idle_time = 2000;

Tinytest.add('illuminist-i18n-db - translations editing - insertTranslations - valid test', function(test) {
  var _id = translations_editing_tests_collection.insertTranslations({
    a: 1,
    b: 5
  }, {
    aa: {
      c: 3
    },
    en: {
      b: 2,
      d: 4
    }
  });
  return test.equal(translations_editing_tests_collection.findOne(_id, {
    transform: null
  }), {
    a: 1,
    b: 2,
    d: 4,
    i18n: {
      aa: {
        c: 3
      }
    },
    _id: _id
  },"Able to insert");
});

Tinytest.add('illuminist-i18n-db - translations editing - insertTranslations - no translations', function(test) {
  var _id = translations_editing_tests_collection.insertTranslations({
    a: 1,
    b: 2
  });
  return test.equal(translations_editing_tests_collection.findOne(_id, {
    transform: null
  }), {
    a: 1,
    b: 2,
    _id: _id
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - insertTranslations - unsupported lang', function(test, onComplete) {
  var result;
  result = translations_editing_tests_collection.insertTranslations({
    a: 1,
    b: 2
  }, {
    ru: {
      c: 3
    }
  }, function(err, id) {
    test.isUndefined(id);
    test.instanceOf(err, Meteor.Error);
    if(err) test.equal(err.reason, "Not supported language: ru");
    test.isNull(result);
    return onComplete();
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - insertLanguage - language: collection\'s base language', function(test, onComplete) {
  return translations_editing_tests_collection.insertLanguage({
    a: 1,
    b: 5
  }, {
    b: 2,
    d: 4
  }, "en", function(err, id) {
    test.equal(translations_editing_tests_collection.findOne(id, {
      transform: null
    }), {
      a: 1,
      b: 2,
      d: 4,
      _id: id
    });
    return onComplete();
  });
});

Tinytest.add('illuminist-i18n-db - translations editing - insertLanguage - language: not collection\'s base language', function(test) {
  var _id = translations_editing_tests_collection.insertLanguage({
    a: 1,
    b: 5
  }, {
    b: 2,
    d: 4
  }, "aa");
  return test.equal(translations_editing_tests_collection.findOne(_id, {
    transform: null
  }), {
    a: 1,
    b: 5,
    i18n: {
      aa: {
        b: 2,
        d: 4
      }
    },
    _id: _id
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - insertLanguage - language: not supported language', function(test, onComplete) {
  var result;
  return result = translations_editing_tests_collection.insertLanguage({
    a: 1,
    b: 5
  }, {
    b: 2,
    d: 4
  }, "ru", function(err, id) {
    test.isUndefined(id);
    test.instanceOf(err, Meteor.Error);
    if(err) test.equal(err.reason, "Not supported language: ru");
    test.isNull(result);
    return onComplete();
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - insertLanguage - language: not specified', function(test, onComplete) {
  var result;
  return result = translations_editing_tests_collection.insertLanguage({
    a: 1,
    b: 5
  }, {
    b: 2,
    d: 4
  }, function(err, id) {
    test.isUndefined(id);
    test.instanceOf(err, Meteor.Error);
    if(err) test.equal(err.reason, "Missing language_tag");
    test.isNull(result);
    return onComplete();
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - updateTranslations - valid update', function(test, onComplete) {
  var _id = translations_editing_tests_collection.insertTranslations({
    a: 5,
    b: 6
  }, {
    aa: {
      x: 4,
      y: 5
    },
    "aa-AA": {
      l: 1,
      m: 2
    }
  });
  var result = translations_editing_tests_collection.updateTranslations(_id, {
    en: {
      a: 1
    },
    aa: {
      x: 1
    }
  });
  result = translations_editing_tests_collection.updateTranslations(_id, {
    en: {
      b: 2,
      c: 3
    },
    aa: {
      y: 2,
      z: 3
    },
    "aa-AA": {
      n: 3
    }
  });
  test.equal(result, 1, "Correct number of affected documents");
  test.equal(translations_editing_tests_collection.findOne(_id, {
    transform: null
  }), {
    a: 1,
    b: 2,
    c: 3,
    i18n: {
      aa: {
        x: 1,
        y: 2,
        z: 3
      },
      "aa-AA": {
        l: 1,
        m: 2,
        n: 3
      }
    },
    _id: _id
  });
  return onComplete();
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - updateTranslations - empty update', function(test, onComplete) {
  var _id = translations_editing_tests_collection.insertTranslations({
    a: 1
  }, {
    aa: {
      x: 1
    }
  });
  // After 2014 version of mongodb, empty modifier wasn't allowed anymore
  translations_editing_tests_collection.updateTranslations(_id,{},function(err, affected_rows){
    test.instanceOf(err, Meteor.Error);
    test.isUndefined(affected_rows);
    if(err) test.equal(err.reason, "Modifier is empty");
    test.equal(translations_editing_tests_collection.findOne(_id, {
      transform: null
    }), {
      a: 1,
      i18n: {
        aa: {
          x: 1
        }
      },
      _id: _id
    });
    return onComplete();
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - updateTranslations - unsupported lang', function(test, onComplete) {
  var _id = translations_editing_tests_collection.insertTranslations({
    a: 1
  }, {
    aa: {
      x: 1
    }
  });
  var result;
  return result = translations_editing_tests_collection.updateTranslations(_id, {
    ru: {
      c: 3
    }
  }, function(err, id) {
    test.isUndefined(id);
    test.instanceOf(err, Meteor.Error);
    if(err) test.equal(err.reason, "Not supported language: ru");
    test.isNull(result);
    return onComplete();
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - translate - valid update', function(test, onComplete) {
  var result;
  var _id = translations_editing_tests_collection.insertTranslations({
    a: 5,
    b: 2
  }, {
    aa: {
      x: 4,
      y: 2
    }
  });
  result = translations_editing_tests_collection.translate(_id, {
    a: 1,
    c: 3
  }, "en");
  test.equal(result, 1, "Correct number of affected documents");
  result = translations_editing_tests_collection.translate(_id, {
    x: 1,
    z: 3
  }, "aa", {});
  test.equal(result, 1, "Correct number of affected documents");
  return result = translations_editing_tests_collection.translate(_id, {
    l: 1,
    m: 2,
    n: 3
  }, "aa-AA", {}, function(err, affected_rows) {
    return Meteor.setTimeout((function() {
      test.equal(affected_rows, 1);
      test.equal(translations_editing_tests_collection.findOne(_id, {
        transform: null
      }), {
        a: 1,
        b: 2,
        c: 3,
        i18n: {
          aa: {
            x: 1,
            y: 2,
            z: 3
          },
          "aa-AA": {
            l: 1,
            m: 2,
            n: 3
          }
        },
        _id: _id
      });
      return onComplete();
    }), 1000);
  });
});

Tinytest.add('illuminist-i18n-db - translations editing - remove translation - valid remove', function(test) {
  var result;
  var _id = translations_editing_tests_collection.insertTranslations({
    a: 1,
    b: 2
  }, {
    aa: {
      x: 1,
      y: 2
    },
    "aa-AA": {
      l: 1,
      m: 2
    }
  });
  result = translations_editing_tests_collection.removeTranslations(_id, ["en.a", "aa.y", "aa-AA"]);
  test.equal(result, 1, "Correct number of affected documents");
  translations_editing_tests_collection.removeTranslations(_id, [], {}, (err, affected_rows) => {
    test.isUndefined(affected_rows);
    test.instanceOf(err, Meteor.Error);
    if(err) test.equal(err.reason, "Modifier is empty");
  });
  return test.equal(translations_editing_tests_collection.findOne(_id, {
    transform: null
  }), {
    b: 2,
    i18n: {
      aa: {
        x: 1
      }
    },
    _id: _id
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - remove translation - attempt to remove base language', function(test, onComplete) {
  var result;
  var _id = translations_editing_tests_collection.insertTranslations({
    a: 1,
    b: 2
  }, {
    aa: {
      x: 1,
      y: 2
    },
    "aa-AA": {
      l: 1,
      m: 2
    }
  });
  return result = translations_editing_tests_collection.removeTranslations(_id, ["en"], function(err, affected_rows) {
    test.isUndefined(affected_rows);
    test.instanceOf(err, Meteor.Error);
    if(err) test.equal(err.reason, "Complete removal of collection's base language from a document is not permitted");
    test.isNull(result);
    return onComplete();
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - remove translation - fields argument is not an array', function(test, onComplete) {
  var result;
  var _id = translations_editing_tests_collection.insertTranslations({
    a: 1,
    b: 2
  }, {
    aa: {
      x: 1,
      y: 2
    },
    "aa-AA": {
      l: 1,
      m: 2
    }
  });
  return result = translations_editing_tests_collection.removeTranslations(_id, {}, function(err, affected_rows) {
    test.isUndefined(affected_rows);
    test.instanceOf(err, Meteor.Error);
    test.isNull(result);
    return onComplete();
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - remove language - valid remove', function(test, onComplete) {
  var result;
  var _id = translations_editing_tests_collection.insertTranslations({
    a: 1,
    b: 2,
    c: 3
  }, {
    aa: {
      x: 1,
      y: 2
    },
    "aa-AA": {
      l: 1,
      m: 2
    }
  });
  result = translations_editing_tests_collection.removeLanguage(_id, ["a", "c"], "en");
  test.equal(result, 1, "Correct number of affected documents");
  result = translations_editing_tests_collection.removeLanguage(_id, ["x"], "aa", {}, function(err, affected_rows) {
    test.equal(affected_rows, 1, "Correct number of affected documents");
  });
  translations_editing_tests_collection.removeLanguage(_id, [], "aa", (err, affected_rows) => {
    test.instanceOf(err, Meteor.Error);
    test.isUndefined(affected_rows);
    if(err) test.equal(err.reason, "Modifier is empty");
  });
  return result = translations_editing_tests_collection.removeLanguage(_id, null, "aa-AA", function(err, affected_rows) {
    return Meteor.setTimeout((function() {
      test.equal(affected_rows, 1, "Correct number of affected documents");
      test.equal(translations_editing_tests_collection.findOne(_id, {
        transform: null
      }), {
        b: 2,
        i18n: {
          aa: {
            y: 2
          }
        },
        _id: _id
      });
      return onComplete();
    }));
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - remove language - attempt to remove base language', function(test, onComplete) {
  var _id = translations_editing_tests_collection.insertTranslations({
    a: 1,
    b: 2,
    c: 3
  }, {
    aa: {
      x: 1,
      y: 2
    },
    "aa-AA": {
      l: 1,
      m: 2
    }
  });
  return translations_editing_tests_collection.removeLanguage(_id, null, "en", function(err, affected_rows) {
    return Meteor.setTimeout((function() {
      test.isUndefined(affected_rows);
      test.instanceOf(err, Meteor.Error);
      if(err) test.equal(err.reason, "Complete removal of collection's base language from a document is not permitted");
      return onComplete();
    }));
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - remove language - fields argument is not an array', function(test, onComplete) {
  var result;
  var _id = translations_editing_tests_collection.insertTranslations({
    a: 1,
    b: 2
  }, {
    aa: {
      x: 1,
      y: 2
    },
    "aa-AA": {
      l: 1,
      m: 2
    }
  });
  return result = translations_editing_tests_collection.removeLanguage(_id, {}, "aa", function(err, affected_rows) {
    test.isUndefined(affected_rows);
    test.instanceOf(err, Meteor.Error);
    test.isNull(result);
    return onComplete();
  });
});

if (Meteor.isServer) {
  Tinytest.add('illuminist-i18n-db - i18nCollection.i18nFind works only from Meteor.i18nPublish', function(test) {
    return test.throws((function() {
      return test_collections.a.i18nFind();
    }), "i18nCollection.i18nFind should be called only from Meteor.i18nPublish functions");
  });
}

if (Meteor.isClient) {
  document.title = "UnitTest: illuminist-i18n-db used in a tap-i18n enabled project";
  var supportedLanguages = Meteor.settings.public.supportedLanguages;
  var max_document_id = share.max_document_id;

  const get_general_classed_collections = function(class_suffix) {
    if (class_suffix == null) {
      class_suffix = "";
    }
    var remap_results = function(results) {
      return _.reduce(_.values(results), (function(a, b) {
        a[b.id] = b;
        return a;
      }), {});
    };
    var collections_docs = [
      remap_results(test_collections["a" + class_suffix].find({}, {
        sort: {
          "id": 1
        }
      }).fetch()), remap_results(test_collections["b" + class_suffix].find({}, {
        sort: {
          "id": 1
        }
      }).fetch()), remap_results(test_collections["c" + class_suffix].find({}, {
        sort: {
          "id": 1
        }
      }).fetch())
    ];
    var docs = [];
    _.times(max_document_id,(i)=>{
      if (i in collections_docs[i % 3]) {
        if (collections_docs[i % 3][i] != null) {
          docs.push(collections_docs[i % 3][i]);
        }
      }
    });
    return docs;
  };

  const get_basic_collections_docs = function() {
    return get_general_classed_collections();
  };

  const get_regular_base_language_collections_docs = function() {
    return get_general_classed_collections("_aa");
  };

  const get_dialect_base_language_collections_docs = function() {
    return get_general_classed_collections("_aa-AA");
  };

  const get_all_docs = function() {
    var basic = get_basic_collections_docs();
    var regular_lang = get_regular_base_language_collections_docs();
    var dialect = get_dialect_base_language_collections_docs();
    var all = [].concat(basic, regular_lang, dialect);
    return {
      basic: basic,
      regular_lang: regular_lang,
      dialect: dialect,
      all: all
    };
  };

  var subscription_a = null;
  var subscription_b = null;
  var subscription_c = null;
  const stop_all_subscriptions = function() {
    _.chain([subscription_a, subscription_b, subscription_c])
      .filter((o)=> !_.isNull(o))
      .each((o)=> o.stop());
    return Deps.flush();
  };

  const subscribe_simple_subscriptions = function() {
    stop_all_subscriptions();
    var a_dfd = new $.Deferred();
    subscription_a = Meteor.i18nSubscribe("class_a", {
      onReady: (function() {
        return a_dfd.resolve();
      }),
      onError: (function(error) {
        return a_dfd.reject();
      })
    });
    var b_dfd = new $.Deferred();
    subscription_b = Meteor.i18nSubscribe("class_b", {
      onReady: (function() {
        return b_dfd.resolve();
      }),
      onError: (function(error) {
        return b_dfd.reject();
      })
    });
    var c_dfd = new $.Deferred();
    subscription_c = Meteor.i18nSubscribe("class_c", {
      onReady: (function() {
        return c_dfd.resolve();
      }),
      onError: (function(error) {
        return c_dfd.reject();
      })
    });
    return [[subscription_a, subscription_b, subscription_c], [a_dfd, b_dfd, c_dfd]];
  };

  const subscribe_complex_subscriptions = function() {
    stop_all_subscriptions();
    var language_to_exclude_from_class_a_and_b = supportedLanguages[(supportedLanguages.indexOf(Meteor.settings.currentLanguage) + 1) % supportedLanguages.length];
    var a_dfd = new $.Deferred();
    var projection = {
      _id: 1,
      id: 1
    };
    _.chain(supportedLanguages).filter((o)=>o!==language_to_exclude_from_class_a_and_b).each(
      (language)=> projection["not_translated_to_" + language] = 1
    );
    subscription_a = Meteor.i18nSubscribe("class_a", projection, {
      onReady: (function() {
        return a_dfd.resolve();
      }),
      onError: (function(error) {
        return a_dfd.reject();
      })
    });
    var b_dfd = new $.Deferred();
    projection = {};
    projection["not_translated_to_" + language_to_exclude_from_class_a_and_b] = 0;
    subscription_b = Meteor.i18nSubscribe("class_b", projection, {
      onReady: (function() {
        return b_dfd.resolve();
      }),
      onError: (function(error) {
        return b_dfd.reject();
      })
    });
    var c_dfd = new $.Deferred();
    projection = {};
    projection["not_translated_to_" + (Meteor.settings.currentLanguage)] = 0;
    subscription_c = Meteor.i18nSubscribe("class_c", projection, {
      onReady: (function() {
        return c_dfd.resolve();
      }),
      onError: (function(error) {
        return c_dfd.reject();
      })
    });
    return [[subscription_a, subscription_b, subscription_c], [a_dfd, b_dfd, c_dfd]];
  };

  const validate_simple_subscriptions_documents = function(test, subscriptions, documents) {
    var current_language = Meteor.settings.currentLanguage;
    var i18n_supported = current_language != null;
    var base_language_by_collection_type = {
      basic: test_collections.a._base_language,
      regular_lang: test_collections.a_aa._base_language,
      dialect: test_collections["a_aa-AA"]._base_language
    };
    _.each(_.keys(base_language_by_collection_type), (collection_type) => {
      var collection_base_language = base_language_by_collection_type[collection_type];
      var collection_type_documents = documents[collection_type];
      _.each(collection_type_documents, (doc) => {
        _.each(supportedLanguages, (language_property_not_translated_to) => {
          var should_translate_to = current_language;
          if (_.isNull(should_translate_to)) {
            should_translate_to = collection_base_language;
          }
          var should_translate_to_dialect_of = share.dialectOf(should_translate_to);
          var property = "not_translated_to_" + language_property_not_translated_to;
          var value = doc[property];
          var expected_value;
          if (should_translate_to !== language_property_not_translated_to) {
            expected_value = property + "^" + should_translate_to + "-" + doc.id;
          } else {
            if (i18n_supported) {
              if (should_translate_to_dialect_of != null) {
                expected_value = property + "^" + should_translate_to_dialect_of + "-" + doc.id;
              } else if (collection_base_language !== should_translate_to) {
                expected_value = property + "^" + collection_base_language + "-" + doc.id;
              } else {
                expected_value = void 0;
              }
            } else {
              expected_value = void 0;
            }
          }
          test.equal(value, expected_value);
        });
      });
    });
  };

  const validate_complex_subscriptions_documents = function(test, subscriptions, documents) {
    var current_language = Meteor.settings.currentLanguage;
    var i18n_supported = current_language != null;
    var base_language_by_collection_type = {
      basic: test_collections.a._base_language
    };
    _.each(_.keys(base_language_by_collection_type), (collection_type) => {
      var collection_base_language = base_language_by_collection_type[collection_type];
      var collection_type_documents = documents[collection_type];
      _.each(collection_type_documents, function(doc) {
        var expected_value, value;
        var language_excluded_from_class_a_and_b = supportedLanguages[(supportedLanguages.indexOf(current_language) + 1) % supportedLanguages.length];
        var field_excluded_from_doc = null;
        switch (doc.id % 3) {
          case 0:
            field_excluded_from_doc = language_excluded_from_class_a_and_b;
            break;
          case 1:
            field_excluded_from_doc = language_excluded_from_class_a_and_b;
            break;
          case 2:
            field_excluded_from_doc = current_language;
        }
        _.each(supportedLanguages,(language_property_not_translated_to)=>{
          var should_translate_to = current_language;
          if (should_translate_to === null) {
            should_translate_to = collection_base_language;
          }
          var should_translate_to_dialect_of = share.dialectOf(should_translate_to);
          var property = "not_translated_to_" + language_property_not_translated_to;
          value = doc[property];
          if (language_property_not_translated_to === field_excluded_from_doc) {
            expected_value = void 0;
          } else if (should_translate_to !== language_property_not_translated_to) {
            expected_value = property + "^" + should_translate_to + "-" + doc.id;
          } else {
            if (i18n_supported) {
              if (should_translate_to_dialect_of != null) {
                expected_value = property + "^" + should_translate_to_dialect_of + "-" + doc.id;
              } else if (collection_base_language !== should_translate_to) {
                expected_value = property + "^" + collection_base_language + "-" + doc.id;
              } else {
                expected_value = void 0;
              }
            } else {
              expected_value = void 0;
            }
          }
          test.equal(value, expected_value, "col_type=" + collection_type + ", property=" + property);
        });
      });
    });
  };

  const general_tests = function(test, subscriptions, documents) {
    test.equal(documents.all.length, max_document_id * 3, "Expected documents count in collections");
    return test.isTrue(_.reduce(_.map(documents.all, function(doc) {
      return doc.i18n == null;
    }), (function(memo, current) {
      return memo && current;
    }), true), "The subdocument i18n is not part of the documents");
  };

  const null_language_tests = function(test, subscriptions, documents) {};

  Tinytest.addAsync('illuminist-i18n-db - language: null; simple pub/sub - general tests', function(test, onComplete) {
    const subscriptions = subscribe_simple_subscriptions();
    const test_case = _.once(function() {
      var documents = get_all_docs();
      general_tests(test, subscriptions, documents);
      null_language_tests(test, subscriptions, documents);
      validate_simple_subscriptions_documents(test, subscriptions, documents);
      return onComplete();
    });
    return Deps.autorun(function() {
      if (subscription_a.ready() && subscription_b.ready() && subscription_c.ready()) {
        return test_case();
      }
    });
  });
  if (Package.autopublish == null) {
    Tinytest.addAsync('illuminist-i18n-db - language: null; complex pub/sub - general tests', function(test, onComplete) {
      const subscriptions = subscribe_complex_subscriptions();
      const test_case = _.once(function() {
        var documents = get_all_docs();
        general_tests(test, subscriptions, documents);
        null_language_tests(test, subscriptions, documents);
        validate_complex_subscriptions_documents(test, subscriptions, documents);
        return onComplete();
      });
      return Deps.autorun(function() {
        if (subscription_a.ready() && subscription_b.ready() && subscription_c.ready()) {
          return test_case();
        }
      });
    });
  }
  Tinytest.addAsync('illuminist-i18n-db - language: en; simple pub/sub - general tests', function(test, onComplete) {
    Meteor.settings.currentLanguage = "en";
    const subscriptions = subscribe_simple_subscriptions();
    return $.when.apply(this, subscriptions[1]).done(function() {
      const documents= get_all_docs();
      general_tests(test, subscriptions, documents);
      validate_simple_subscriptions_documents(test, subscriptions, documents);
      return onComplete();
    });
  });
  if (Package.autopublish == null) {
    Tinytest.addAsync('illuminist-i18n-db - language: en; complex pub/sub - general tests', function(test, onComplete) {
      Meteor.settings.currentLanguage = "en";
      const subscriptions = subscribe_complex_subscriptions();
      return $.when.apply(this, subscriptions[1]).done(function() {
        const documents= get_all_docs();
        general_tests(test, subscriptions, documents);
        validate_complex_subscriptions_documents(test, subscriptions, documents);
        return onComplete();
      });
    });
  }
  Tinytest.addAsync('illuminist-i18n-db - language: aa; simple pub/sub - general tests', function(test, onComplete) {
    Meteor.settings.currentLanguage = "aa";
    const subscriptions = subscribe_simple_subscriptions();
    return $.when.apply(this, subscriptions[1]).done(function() {
      const documents= get_all_docs();
      general_tests(test, subscriptions, documents);
      validate_simple_subscriptions_documents(test, subscriptions, documents);
      return onComplete();
    });
  });
  if (Package.autopublish == null) {
    Tinytest.addAsync('illuminist-i18n-db - language: aa; complex pub/sub - general tests', function(test, onComplete) {
      Meteor.settings.currentLanguage = "aa";
      const subscriptions = subscribe_complex_subscriptions();
      return $.when.apply(this, subscriptions[1]).done(function() {
        const documents= get_all_docs();
        general_tests(test, subscriptions, documents);
        validate_complex_subscriptions_documents(test, subscriptions, documents);
        return onComplete();
      });
    });
  }
  Tinytest.addAsync('illuminist-i18n-db - language: aa-AA; simple pub/sub - general tests', function(test, onComplete) {
    Meteor.settings.currentLanguage = "aa-AA";
    const subscriptions = subscribe_simple_subscriptions();
    return $.when.apply(this, subscriptions[1]).done(function() {
      const documents= get_all_docs();
      general_tests(test, subscriptions, documents);
      validate_simple_subscriptions_documents(test, subscriptions, documents);
      return onComplete();
    });
  });
  if (Package.autopublish == null) {
    Tinytest.addAsync('illuminist-i18n-db - language: aa-AA; complex pub/sub - general tests', function(test, onComplete) {
      Meteor.settings.currentLanguage = "aa-AA";
      const subscriptions = subscribe_complex_subscriptions();
      return $.when.apply(this, subscriptions[1]).done(function() {
        const documents= get_all_docs();
        general_tests(test, subscriptions, documents);
        validate_complex_subscriptions_documents(test, subscriptions, documents);
        return onComplete();
      });
    });
  }
  Tinytest.addAsync('illuminist-i18n-db - subscribing with a not-supported language fails', function(test, onComplete) {
    var dfd = new $.Deferred();
    Meteor.i18nSubscribe("class_a", "gg-GG", {
      onReady: function() {
        return dfd.reject();
      },
      onError: function(e) {
        test.equal(e.error, 400);
        test.equal(e.reason, "Not supported language");
        return dfd.resolve(e);
      }
    });
    return dfd.fail(function() {
      return test.fail("Subscriptions that should have failed succeeded");
    }).always(function() {
      return onComplete();
    });
  });
  Tinytest.addAsync('illuminist-i18n-db - reactivity test - simple subscription', function(test, onComplete) {
    Meteor.settings.currentLanguage = supportedLanguages[0];
    const subscriptions = subscribe_simple_subscriptions();
    var last_invalidation = null;
    var documents = null;
    const comp = Deps.autorun(function() {
      documents = get_all_docs();
      return last_invalidation = share.now();
    });
    var interval_handle;
    return interval_handle = Meteor.setInterval((function() {
      if (last_invalidation + idle_time < share.now()) {
        console.log("Testing simple subscriptions' reactivity: language=" + (Meteor.settings.currentLanguage));
        general_tests(test, subscriptions, documents);
        validate_simple_subscriptions_documents(test, subscriptions, documents);
        var lang_id = supportedLanguages.indexOf(Meteor.settings.currentLanguage);
        if (lang_id + 1 < supportedLanguages.length) {
          Meteor.settings.currentLanguage = supportedLanguages[lang_id + 1];
        } else {
          comp.stop();
          Meteor.clearInterval(interval_handle);
          return onComplete();
        }
      }
    }), idle_time);
  });
  if (Package.autopublish == null) {
    Tinytest.addAsync('illuminist-i18n-db - reactivity test - complex subscription', function(test, onComplete) {
      stop_all_subscriptions();
      Meteor.settings.currentLanguage = supportedLanguages[0];
      var fields_to_exclude = ["not_translated_to_en", "not_translated_to_aa", "not_translated_to_aa-AA"];
      var local_session = new ReactiveDict();
      local_session.set("field_to_exclude", fields_to_exclude[0]);
      local_session.set("projection_type", 0);
      var fields = null;
      var subscriptions = null;
      Deps.autorun(function() {
        var field_to_exclude = local_session.get("field_to_exclude");
        fields = {};
        if (local_session.get("projection_type") === 0) {
          fields[field_to_exclude] = 0;
        } else {
          _.each(fields_to_exclude,(field)=>{
            if (field !== field_to_exclude) {
              fields[field] = 1;
            }
          });
          fields["id"] = 1;
        }
        var a_dfd = new $.Deferred();
        subscription_a = Meteor.i18nSubscribe("class_a", fields, {
          onReady: (function() {
            return a_dfd.resolve();
          }),
          onError: (function(error) {
            return a_dfd.reject();
          })
        });
        var b_dfd = new $.Deferred();
        subscription_b = Meteor.i18nSubscribe("class_b", fields, {
          onReady: (function() {
            return b_dfd.resolve();
          }),
          onError: (function(error) {
            return b_dfd.reject();
          })
        });
        var c_dfd = new $.Deferred();
        subscription_c = Meteor.i18nSubscribe("class_c", fields, {
          onReady: (function() {
            return c_dfd.resolve();
          }),
          onError: (function(error) {
            return c_dfd.reject();
          })
        });
        return subscriptions = [[subscription_a, subscription_b, subscription_c], [a_dfd, b_dfd, c_dfd]];
      });
      var interval_handle;
      var last_invalidation = null;
      var documents = null;
      var comp = Deps.autorun(function() {
        documents = get_all_docs();
        return last_invalidation = share.now();
      });
      return interval_handle = Meteor.setInterval((function() {
        var lang_id, projection_id;
        if (last_invalidation + idle_time < share.now()) {
          console.log("Testing complex subscriptions' reactivity: language=" + (Meteor.settings.currentLanguage) + "; field_to_exclude=" + (local_session.get("field_to_exclude")) + "; projection_type=" + (local_session.get("projection_type") ? "inclusive" : "exclusive") + "; projection=" + (EJSON.stringify(fields)));
        }
        general_tests(test, subscriptions, documents);
        documents.all.forEach(function(doc) {
          return test.isUndefined(doc[local_session.get("field_to_exclude")]);
        });
        if (local_session.get("projection_type") === 0) {
          return local_session.set("projection_type", 1);
        } else if (local_session.get("projection_type") === 1 && ((projection_id = fields_to_exclude.indexOf(local_session.get("field_to_exclude"))) + 1) < fields_to_exclude.length) {
          local_session.set("projection_type", 0);
          return local_session.set("field_to_exclude", fields_to_exclude[projection_id + 1]);
        } else if ((lang_id = supportedLanguages.indexOf(Meteor.settings.currentLanguage)) + 1 < supportedLanguages.length) {
          Meteor.settings.currentLanguage = supportedLanguages[lang_id + 1];
          local_session.set("projection_type", 0);
          return local_session.set("field_to_exclude", fields_to_exclude[0]);
        } else {
          comp.stop();
          Meteor.clearInterval(interval_handle);
          return onComplete();
        }
      }), idle_time);
    });
  }
}

if (Meteor.isClient) {
  Tinytest.addAsync('illuminist-i18n-db - translations editing - insertLanguage - language_tag=Meteor.settings.currentLanguage', function(test, onComplete) {
    Meteor.settings.currentLanguage = "aa";
    var _id;
    return test.equal(translations_editing_tests_collection.findOne(_id = translations_editing_tests_collection.insertLanguage({
      a: 1,
      b: 5
    }, {
      b: 2,
      d: 4
    }, (function(err, id) {
      return onComplete();
    })), {
      transform: null
    }, {
      transform: null
    }), {
      a: 1,
      b: 5,
      i18n: {
        aa: {
          b: 2,
          d: 4
        }
      },
      _id: _id
    });
  });
  Tinytest.addAsync('illuminist-i18n-db - translations editing - translate - language_tag=Meteor.settings.currentLanguage', function(test, onComplete) {
    Meteor.settings.currentLanguage = "aa";
    var result;
    var _id = translations_editing_tests_collection.insertTranslations({
      a: 5,
      b: 2
    }, {
      aa: {
        x: 4,
        y: 2
      }
    });
    result = translations_editing_tests_collection.translate(_id, {
      a: 1,
      c: 3
    });
    test.equal(result, 1, "Correct number of affected documents");
    result = translations_editing_tests_collection.translate(_id, {
      x: 1,
      z: 3
    }, {});
    test.equal(result, 1, "Correct number of affected documents");
    return result = translations_editing_tests_collection.translate(_id, {
      l: 1,
      m: 2
    }, function(err, affected_rows) {
      return Meteor.setTimeout((function() {
        test.equal(1, affected_rows);
        test.equal(translations_editing_tests_collection.findOne(_id, {
          transform: null
        }), {
          a: 5,
          b: 2,
          i18n: {
            aa: {
              a: 1,
              c: 3,
              x: 1,
              y: 2,
              z: 3,
              l: 1,
              m: 2
            }
          },
          _id: _id
        });
        return onComplete();
      }), 1000);
    });
  });
  Tinytest.addAsync('illuminist-i18n-db - translations editing - removeLanguage - language_tag=Meteor.settings.currentLanguage', function(test, onComplete) {
    Meteor.settings.currentLanguage = "aa";
    var result;
    var _id = translations_editing_tests_collection.insertTranslations({
      a: 5,
      b: 2
    }, {
      aa: {
        u: 1,
        v: 2,
        w: 3,
        x: 4,
        y: 2,
        z: 1
      }
    });
    result = translations_editing_tests_collection.removeLanguage(_id, ["x", "y"]);
    test.equal(result, 1, "Correct number of affected documents");
    result = translations_editing_tests_collection.removeLanguage(_id, ["y", "z"], {});
    test.equal(result, 1, "Correct number of affected documents");
    return result = translations_editing_tests_collection.removeLanguage(_id, ["u", "v"], function(err, affected_rows) {
      return Meteor.setTimeout((function() {
        test.equal(1, affected_rows);
        test.equal(translations_editing_tests_collection.findOne(_id, {
          transform: null
        }), {
          a: 5,
          b: 2,
          i18n: {
            aa: {
              w: 3
            }
          },
          _id: _id
        });
        return onComplete();
      }), 1000);
    });
  });
  Tinytest.addAsync('illuminist-i18n-db - translations editing - removeLanguage - complete remove - language_tag=Meteor.settings.currentLanguage', function(test, onComplete) {
    Meteor.settings.currentLanguage = "aa";
    var result;
    var _id = translations_editing_tests_collection.insertTranslations({
      a: 5,
      b: 2
    }, {
      aa: {
        u: 1,
        v: 2,
        w: 3,
        x: 4,
        y: 2,
        z: 1
      }
    });
    return result = translations_editing_tests_collection.removeLanguage(_id, null, function(err, affected_rows) {
      return Meteor.setTimeout((function() {
        test.equal(1, affected_rows);
        test.equal(translations_editing_tests_collection.findOne(_id, {
          transform: null
        }), {
          a: 5,
          b: 2,
          i18n: {},
          _id: _id
        });
        return onComplete();
      }), 1000);
    });
  });
  Tinytest.addAsync('illuminist-i18n-db - translations editing - removeLanguage - attempt complete remove base language - language_tag=Meteor.settings.currentLanguage', function(test, onComplete) {
    Meteor.settings.currentLanguage = "en"; // Collection base language is a fallback language : 'en'
    var result;
    var _id = translations_editing_tests_collection.insertTranslations({
      a: 5,
      b: 2
    }, {
      aa: {
        u: 1,
        v: 2,
        w: 3,
        x: 4,
        y: 2,
        z: 1
      }
    });
    return result = translations_editing_tests_collection.removeLanguage(_id, null, function(err, affected_rows) {
      return Meteor.setTimeout((function() {
        test.isUndefined(affected_rows);
        test.instanceOf(err, Meteor.Error);
        if(err) test.equal(err.reason, "Complete removal of collection's base language from a document is not permitted");
        return onComplete();
      }), 1000);
    });
  });
}

