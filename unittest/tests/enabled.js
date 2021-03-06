import { Tracker } from 'meteor/tracker';
import { testCollections, translationsEditingTestsCollection, maxDocumentId } from './common';
import { dialectOf, now } from './helpers';

var idle_time = 2000;

Tinytest.add('illuminist-i18n-db - translations editing - insertTranslations - valid test', (test) => {
  var _id = translationsEditingTestsCollection.insertTranslations({
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
  return test.equal(translationsEditingTestsCollection.findOne(_id, {
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

Tinytest.add('illuminist-i18n-db - translations editing - insertTranslations - no translations', (test) => {
  var _id = translationsEditingTestsCollection.insertTranslations({
    a: 1,
    b: 2
  });
  return test.equal(translationsEditingTestsCollection.findOne(_id, {
    transform: null
  }), {
    a: 1,
    b: 2,
    _id: _id
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - insertTranslations - unsupported lang', (test, onComplete) => {
  var result;
  result = translationsEditingTestsCollection.insertTranslations({
    a: 1,
    b: 2
  }, {
    ru: {
      c: 3
    }
  }, (err, id) => {
    test.isUndefined(id);
    test.instanceOf(err, Meteor.Error);
    if(err) test.equal(err.reason, "Not supported language: ru");
    test.isNull(result);
    return onComplete();
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - insertLanguage - language: collection\'s base language', (test, onComplete) => {
  return translationsEditingTestsCollection.insertLanguage({
    a: 1,
    b: 5
  }, {
    b: 2,
    d: 4
  }, "en", (err, id) => {
    test.equal(translationsEditingTestsCollection.findOne(id, {
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

Tinytest.add('illuminist-i18n-db - translations editing - insertLanguage - language: not collection\'s base language', (test) => {
  var _id = translationsEditingTestsCollection.insertLanguage({
    a: 1,
    b: 5
  }, {
    b: 2,
    d: 4
  }, "aa");
  return test.equal(translationsEditingTestsCollection.findOne(_id, {
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

Tinytest.addAsync('illuminist-i18n-db - translations editing - insertLanguage - language: not supported language', (test, onComplete) => {
  var result;
  return result = translationsEditingTestsCollection.insertLanguage({
    a: 1,
    b: 5
  }, {
    b: 2,
    d: 4
  }, "ru", (err, id) => {
    test.isUndefined(id);
    test.instanceOf(err, Meteor.Error);
    if(err) test.equal(err.reason, "Not supported language: ru");
    test.isNull(result);
    return onComplete();
  });
});

if(Meteor.isServer){ // In client, if language_tag not specified it will use fallback language eg "en"
  Tinytest.addAsync('illuminist-i18n-db - translations editing - insertLanguage - language: not specified', (test, onComplete) => {
    var result;
    return result = translationsEditingTestsCollection.insertLanguage({
      a: 1,
      b: 5
    }, {
      b: 2,
      d: 4
    }, (err, id) => {
      test.isUndefined(id);
      test.instanceOf(err, Meteor.Error);
      if(err) test.equal(err.reason, "Missing language_tag");
      test.isNull(result);
      return onComplete();
    });
  });
}

Tinytest.addAsync('illuminist-i18n-db - translations editing - updateTranslations - valid update', (test, onComplete) => {
  var _id = translationsEditingTestsCollection.insertTranslations({
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
  var result = translationsEditingTestsCollection.updateTranslations(_id, {
    en: {
      a: 1
    },
    aa: {
      x: 1
    }
  });
  result = translationsEditingTestsCollection.updateTranslations(_id, {
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
  test.equal(translationsEditingTestsCollection.findOne(_id, {
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

Tinytest.addAsync('illuminist-i18n-db - translations editing - updateTranslations - empty update', (test, onComplete) => {
  var _id = translationsEditingTestsCollection.insertTranslations({
    a: 1
  }, {
    aa: {
      x: 1
    }
  });
  // After 2014 version of mongodb, empty modifier wasn't allowed anymore
  translationsEditingTestsCollection.updateTranslations(_id,{},(err, affected_rows) => {
    test.instanceOf(err, Meteor.Error);
    test.isUndefined(affected_rows);
    if(err) test.equal(err.reason, "Modifier is empty");
    test.equal(translationsEditingTestsCollection.findOne(_id, {
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

Tinytest.addAsync('illuminist-i18n-db - translations editing - updateTranslations - unsupported lang', (test, onComplete) => {
  var _id = translationsEditingTestsCollection.insertTranslations({
    a: 1
  }, {
    aa: {
      x: 1
    }
  });
  var result;
  return result = translationsEditingTestsCollection.updateTranslations(_id, {
    ru: {
      c: 3
    }
  }, (err, id) => {
    test.isUndefined(id);
    test.instanceOf(err, Meteor.Error);
    if(err) test.equal(err.reason, "Not supported language: ru");
    test.isNull(result);
    return onComplete();
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - translate - valid update', (test, onComplete) => {
  var result;
  var _id = translationsEditingTestsCollection.insertTranslations({
    a: 5,
    b: 2
  }, {
    aa: {
      x: 4,
      y: 2
    }
  });
  result = translationsEditingTestsCollection.translate(_id, {
    a: 1,
    c: 3
  }, "en");
  test.equal(result, 1, "Correct number of affected documents");
  result = translationsEditingTestsCollection.translate(_id, {
    x: 1,
    z: 3
  }, "aa", {});
  test.equal(result, 1, "Correct number of affected documents");
  return result = translationsEditingTestsCollection.translate(_id, {
    l: 1,
    m: 2,
    n: 3
  }, "aa-AA", {}, (err, affected_rows) => {
    return Meteor.setTimeout((() => {
      test.equal(affected_rows, 1); 
      test.equal(translationsEditingTestsCollection.findOne(_id, {
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

Tinytest.add('illuminist-i18n-db - translations editing - remove translation - valid remove', (test) => {
  var result;
  var _id = translationsEditingTestsCollection.insertTranslations({
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
  result = translationsEditingTestsCollection.removeTranslations(_id, ["en.a", "aa.y", "aa-AA"]);
  test.equal(result, 1, "Correct number of affected documents");
  translationsEditingTestsCollection.removeTranslations(_id, [], {}, (err, affected_rows) => {
    test.isUndefined(affected_rows);
    test.instanceOf(err, Meteor.Error);
    if(err) test.equal(err.reason, "Modifier is empty");
  });
  return test.equal(translationsEditingTestsCollection.findOne(_id, {
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

Tinytest.addAsync('illuminist-i18n-db - translations editing - remove translation - attempt to remove base language', (test, onComplete) => {
  var result;
  var _id = translationsEditingTestsCollection.insertTranslations({
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
  return result = translationsEditingTestsCollection.removeTranslations(_id, ["en"], (err, affected_rows) => {
    test.isUndefined(affected_rows);
    test.instanceOf(err, Meteor.Error);
    if(err) test.equal(err.reason, "Complete removal of collection's base language from a document is not permitted");
    test.isNull(result);
    return onComplete();
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - remove translation - fields argument is not an array', (test, onComplete) => {
  var result;
  var _id = translationsEditingTestsCollection.insertTranslations({
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
  return result = translationsEditingTestsCollection.removeTranslations(_id, {}, (err, affected_rows) => {
    test.isUndefined(affected_rows);
    test.instanceOf(err, Meteor.Error);
    test.isNull(result);
    return onComplete();
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - remove language - valid remove', (test, onComplete) => {
  var result;
  var _id = translationsEditingTestsCollection.insertTranslations({
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
  result = translationsEditingTestsCollection.removeLanguage(_id, ["a", "c"], "en");
  test.equal(result, 1, "Correct number of affected documents");
  result = translationsEditingTestsCollection.removeLanguage(_id, ["x"], "aa", {}, (err, affected_rows) => {
    test.equal(affected_rows, 1, "Correct number of affected documents");
  });
  translationsEditingTestsCollection.removeLanguage(_id, [], "aa", (err, affected_rows) => {
    test.instanceOf(err, Meteor.Error);
    test.isUndefined(affected_rows);
    if(err) test.equal(err.reason, "Modifier is empty");
  });
  return result = translationsEditingTestsCollection.removeLanguage(_id, null, "aa-AA", (err, affected_rows) => {
    return Meteor.setTimeout((() => {
      test.equal(affected_rows, 1, "Correct number of affected documents");
      test.equal(translationsEditingTestsCollection.findOne(_id, {
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

Tinytest.addAsync('illuminist-i18n-db - translations editing - remove language - attempt to remove base language', (test, onComplete) => {
  var _id = translationsEditingTestsCollection.insertTranslations({
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
  return translationsEditingTestsCollection.removeLanguage(_id, null, "en", (err, affected_rows) => {
    return Meteor.setTimeout((() => {
      test.isUndefined(affected_rows);
      test.instanceOf(err, Meteor.Error);
      if(err) test.equal(err.reason, "Complete removal of collection's base language from a document is not permitted");
      return onComplete();
    }));
  });
});

Tinytest.addAsync('illuminist-i18n-db - translations editing - remove language - fields argument is not an array', (test, onComplete) => {
  var result;
  var _id = translationsEditingTestsCollection.insertTranslations({
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
  return result = translationsEditingTestsCollection.removeLanguage(_id, {}, "aa", (err, affected_rows) => {
    test.isUndefined(affected_rows);
    test.instanceOf(err, Meteor.Error);
    test.isNull(result);
    return onComplete();
  });
});

if (Meteor.isServer) {
  Tinytest.add('illuminist-i18n-db - i18nCollection.i18nFind works only from Meteor.i18nPublish', (test) => {
    return test.throws((() => {
      return testCollections.a.i18nFind();
    }), "i18nCollection.i18nFind should be called only from Meteor.i18nPublish functions");
  });
}

if (Meteor.isClient) {
  document.title = "UnitTest: illuminist-i18n-db used in a tap-i18n enabled project";
  var supportedLanguages = Meteor.settings.public.supportedLanguages;

  const get_general_classed_collections = (class_suffix) => {
    if (class_suffix == null) {
      class_suffix = "";
    }
    var remap_results = (results) => {
      return _.reduce(_.values(results), ((a, b) => {
        a[b.id] = b;
        return a;
      }), {});
    };
    var collections_docs = [
      remap_results(testCollections["a" + class_suffix].find({}, {
        sort: {
          "id": 1
        }
      }).fetch()), remap_results(testCollections["b" + class_suffix].find({}, {
        sort: {
          "id": 1
        }
      }).fetch()), remap_results(testCollections["c" + class_suffix].find({}, {
        sort: {
          "id": 1
        }
      }).fetch())
    ];
    var docs = [];
    _.times(maxDocumentId,(i)=>{
      if (i in collections_docs[i % 3]) {
        if (collections_docs[i % 3][i] != null) {
          docs.push(collections_docs[i % 3][i]);
        }
      }
    });
    return docs;
  };

  const get_basic_collections_docs = () => {
    return get_general_classed_collections();
  };

  const get_regular_base_language_collections_docs = () => {
    return get_general_classed_collections("_aa");
  };

  const get_dialect_base_language_collections_docs = () => {
    return get_general_classed_collections("_aa-AA");
  };

  const get_all_docs = () => {
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
  const stop_all_subscriptions = () => {
    _.chain([subscription_a, subscription_b, subscription_c])
      .filter((o)=> !_.isNull(o))
      .each((o)=> o.stop());
    return Tracker.flush();
  };

  const subscribe_simple_subscriptions = () => {
    stop_all_subscriptions();
    const a_dfd = new Promise((resolve, reject) => {
      subscription_a = Meteor.i18nSubscribe("class_a", {
        onReady: resolve,
        onError: reject,
      });
    });
    const b_dfd = new Promise((resolve, reject) => {
      subscription_b = Meteor.i18nSubscribe("class_b", {
        onReady: resolve,
        onError: reject,
      });
    });
    const c_dfd = new Promise((resolve, reject) => {
      subscription_c = Meteor.i18nSubscribe("class_c", {
        onReady: resolve,
        onError: reject,
      });
    });
    return [[subscription_a, subscription_b, subscription_c], [a_dfd, b_dfd, c_dfd]];
  };

  const subscribe_complex_subscriptions = () => {
    stop_all_subscriptions();
    var language_to_exclude_from_class_a_and_b = supportedLanguages[(supportedLanguages.indexOf(Meteor.i18n.getLanguage()) + 1) % supportedLanguages.length];

    const a_dfd = new Promise((resolve, reject) => {
      let projection = {
        _id: 1,
        id: 1,
      };
      _.chain(supportedLanguages)
        .filter((o)=>o!==language_to_exclude_from_class_a_and_b)
        .each(language => projection[`not_translated_to_${language}`] = 1)
      ;
      subscription_a = Meteor.i18nSubscribe("class_a", projection, {
        onReady: resolve,
        onError: reject,
      });
    });

    const b_dfd = new Promise((resolve, reject) => {
      let projection = {
        [`not_translated_to_${language_to_exclude_from_class_a_and_b}`]: 0,
      };
      subscription_b = Meteor.i18nSubscribe("class_b", projection, {
        onReady: resolve,
        onError: reject,
      });
    });

    const c_dfd = new Promise((resolve, reject) => {
      let projection = {
        [`not_translated_to_${Meteor.i18n.getLanguage()}`]: 0,
      };
      subscription_c = Meteor.i18nSubscribe("class_c", projection, {
        onReady: resolve,
        onError: reject,
      });
    });

    return [[subscription_a, subscription_b, subscription_c], [a_dfd, b_dfd, c_dfd]];
  };

  const validate_simple_subscriptions_documents = (test, subscriptions, documents) => {
    var current_language = Meteor.i18n.getLanguage();
    var i18n_supported = current_language != null;
    var base_language_by_collection_type = {
      basic: testCollections.a._base_language,
      regular_lang: testCollections.a_aa._base_language,
      dialect: testCollections["a_aa-AA"]._base_language,
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
          var should_translate_to_dialect_of = dialectOf(should_translate_to);
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

  const validate_complex_subscriptions_documents = (test, subscriptions, documents) => {
    var current_language = Meteor.i18n.getLanguage();
    var i18n_supported = current_language != null;
    var base_language_by_collection_type = {
      basic: testCollections.a._base_language,
      //regular_lang: testCollections.a_aa._base_language,
      //dialect: testCollections["a_aa-AA"]._base_language,
    };
    _.each(_.keys(base_language_by_collection_type), (collection_type) => {
      var collection_base_language = base_language_by_collection_type[collection_type];
      var collection_type_documents = documents[collection_type];
      _.each(collection_type_documents, (doc) => {
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
          var should_translate_to_dialect_of = dialectOf(should_translate_to);
          var property = "not_translated_to_" + language_property_not_translated_to;
          var expected_value;
          var value = doc[property];
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
          test.equal(value, expected_value, `base_lang=${collection_base_language}, current_lang=${current_language}, property=${property}, should_translate_to=${should_translate_to_dialect_of?should_translate_to_dialect_of:should_translate_to}`);
        });
      });
    });
  };

  const general_tests = (test, subscriptions, documents) => {
    test.equal(documents.all.length, maxDocumentId * 3, "Expected documents count in collections");
    test.isTrue(_.every(documents.all, doc => !_.has('i18n')));
  };

  const null_language_tests = (test, subscriptions, documents) => {};

  Tinytest.addAsync('illuminist-i18n-db - language: null; simple pub/sub - general tests', (test, onComplete) => {
    const subscriptions = subscribe_simple_subscriptions();
    const test_case = _.once(() => {
      var documents = get_all_docs();
      general_tests(test, subscriptions, documents);
      null_language_tests(test, subscriptions, documents);
      validate_simple_subscriptions_documents(test, subscriptions, documents);
      return onComplete();
    });
    return Tracker.autorun(() => {
      if (subscription_a.ready() && subscription_b.ready() && subscription_c.ready()) {
        return test_case();
      }
    });
  });
  if (Package.autopublish == null) {
    Tinytest.addAsync('illuminist-i18n-db - language: null; complex pub/sub - general tests', (test, onComplete) => {
      const subscriptions = subscribe_complex_subscriptions();
      const test_case = _.once(() => {
        var documents = get_all_docs();
        general_tests(test, subscriptions, documents);
        null_language_tests(test, subscriptions, documents);
        validate_complex_subscriptions_documents(test, subscriptions, documents);
        return onComplete();
      });
      return Tracker.autorun(() => {
        if (subscription_a.ready() && subscription_b.ready() && subscription_c.ready()) {
          return test_case();
        }
      });
    });
  }
  Tinytest.addAsync('illuminist-i18n-db - language: en; simple pub/sub - general tests', (test, onComplete) => {
    Meteor.i18n.setLanguage("en");
    _.defer(() => {
      const subscriptions = subscribe_simple_subscriptions();
      return $.when.apply(this, subscriptions[1]).done(() => {
        const documents= get_all_docs();
        general_tests(test, subscriptions, documents);
        validate_simple_subscriptions_documents(test, subscriptions, documents);
        return onComplete();
      });
    });
  });
  if (Package.autopublish == null) {
    Tinytest.addAsync('illuminist-i18n-db - language: en; complex pub/sub - general tests', (test, onComplete) => {
      Meteor.i18n.setLanguage("en");
      _.defer(() => {
        const subscriptions = subscribe_complex_subscriptions();
        return $.when.apply(this, subscriptions[1]).done(() => {
          const documents= get_all_docs();
          general_tests(test, subscriptions, documents);
          validate_complex_subscriptions_documents(test, subscriptions, documents);
          return onComplete();
        });
      });
    });
  }
  Tinytest.addAsync('illuminist-i18n-db - language: aa; simple pub/sub - general tests', (test, onComplete) => {
    Meteor.i18n.setLanguage("aa");
    _.defer(() => {
      const subscriptions = subscribe_simple_subscriptions();
      return $.when.apply(this, subscriptions[1]).done(() => {
        const documents= get_all_docs();
        general_tests(test, subscriptions, documents);
        validate_simple_subscriptions_documents(test, subscriptions, documents);
        return onComplete();
      });
    });
  });
  if (Package.autopublish == null) {
    Tinytest.addAsync('illuminist-i18n-db - language: aa; complex pub/sub - general tests', (test, onComplete) => {
      Meteor.i18n.setLanguage("aa");
      _.defer(() => {
        const subscriptions = subscribe_complex_subscriptions();
        return $.when.apply(this, subscriptions[1]).done(() => {
          const documents= get_all_docs();
          general_tests(test, subscriptions, documents);
          validate_complex_subscriptions_documents(test, subscriptions, documents);
          return onComplete();
        });
      });
    });
  }
  Tinytest.addAsync('illuminist-i18n-db - language: aa-AA; simple pub/sub - general tests', (test, onComplete) => {
    Meteor.i18n.setLanguage("aa-AA");
    _.defer(() => {
      const subscriptions = subscribe_simple_subscriptions();
      return $.when.apply(this, subscriptions[1]).done(() => {
        const documents= get_all_docs();
        general_tests(test, subscriptions, documents);
        validate_simple_subscriptions_documents(test, subscriptions, documents);
        return onComplete();
      }); 
    });
  });
  if (Package.autopublish == null) {
    Tinytest.addAsync('illuminist-i18n-db - language: aa-AA; complex pub/sub - general tests', (test, onComplete) => {
      Meteor.i18n.setLanguage("aa-AA");
      _.defer(() => {
        const subscriptions = subscribe_complex_subscriptions();
        return $.when.apply(this, subscriptions[1]).done(() => {
          const documents= get_all_docs();
          general_tests(test, subscriptions, documents);
          validate_complex_subscriptions_documents(test, subscriptions, documents);
          return onComplete();
        }); 
      });
    });
  }
  Tinytest.addAsync('illuminist-i18n-db - subscribing with a not-supported language fails', (test, onComplete) => {
    const dfd = new Promise((resolve, reject) => {
      Meteor.subscribe("class_a", "gg-GG", {
        onReady: resolve,
        onError: reject,
      });
    });
    dfd.then(
      () => test.fail("Subscriptions that should have failed succeeded"),
      (e) => {
        test.equal(e.error, 400);
        test.equal(e.reason, "Not supported language");
      },
    ).finally(onComplete);
  });
  Tinytest.addAsync('illuminist-i18n-db - reactivity test - simple subscription', (test, onComplete) => {
    Meteor.i18n.setLanguage(supportedLanguages[0]);
    const subscriptions = subscribe_simple_subscriptions();
    var last_invalidation = null;
    var documents = null;
    const comp = Tracker.autorun(() => {
      documents = get_all_docs();
      return last_invalidation = now();
    });
    var interval_handle;
    return interval_handle = Meteor.setInterval((() => {
      if (last_invalidation + idle_time < now()) {
        console.log("Testing simple subscriptions' reactivity: language=" + (Meteor.i18n.getLanguage()));
        general_tests(test, subscriptions, documents);
        validate_simple_subscriptions_documents(test, subscriptions, documents);
        var lang_id = supportedLanguages.indexOf(Meteor.i18n.getLanguage());
        if (lang_id + 1 < supportedLanguages.length) {
          Meteor.i18n.setLanguage(supportedLanguages[lang_id + 1]);
        } else {
          comp.stop();
          Meteor.clearInterval(interval_handle);
          return onComplete();
        }
      }
    }), idle_time);
  });
  if (Package.autopublish == null) {
    Tinytest.addAsync('illuminist-i18n-db - reactivity test - complex subscription', (test, onComplete) => {
      stop_all_subscriptions();
      
      var fields_to_exclude = ["not_translated_to_en", "not_translated_to_aa", "not_translated_to_aa-AA"];
      var testCases = [];
      _.each(supportedLanguages, language => 
        _.each(fields_to_exclude, field_to_exclude =>
          _.times(2, projection_type=>
            testCases.push({
              projection_type:projection_type,
              field_to_exclude:field_to_exclude,
              language:language,
            })
          )
        )
      );console.log(testCases)
      var local_session = new ReactiveDict();

      const shiftTest = () => {
        var oneTest = testCases.shift()
        if(oneTest){
          local_session.set("field_to_exclude", oneTest.field_to_exclude);
          local_session.set("projection_type", oneTest.projection_type);
          Meteor.i18n.setLanguage(oneTest.language);
        }
        return oneTest;
      }
      shiftTest();

      let subscriptions = null;
      let fields = null;

      Tracker.autorun(() => {
        const field_to_exclude = local_session.get("field_to_exclude");
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
        
        const a_dfd = new Promise((resolve, reject) => {
          subscription_a = Meteor.i18nSubscribe("class_a", fields, {
            onReady: resolve,
            onError: reject,
          });
        });

        const b_dfd = new Promise((resolve, reject) => {
          subscription_b = Meteor.i18nSubscribe("class_b", fields, {
            onReady: resolve,
            onError: reject,
          });
        });

        const c_dfd = new Promise((resolve, reject) => {
          subscription_c = Meteor.i18nSubscribe("class_c", fields, {
            onReady: resolve,
            onError: reject,
          });
        });
        
        subscriptions = [[subscription_a, subscription_b, subscription_c], [a_dfd, b_dfd, c_dfd]];
      });

      let last_invalidation = null;
      let documents = null;
      let comp = Tracker.autorun(() => {
        documents = get_all_docs();
        last_invalidation = now();
      });
      let interval_handle = Meteor.setInterval((() => {
        if (last_invalidation + idle_time <= now()) {
          console.log(`Testing complex subscriptions' reactivity: language=${Meteor.i18n.getLanguage()}; field_to_exclude=${local_session.get("field_to_exclude")}; projection_type=${local_session.get("projection_type") ? "inclusive" : "exclusive"}; projection=${JSON.stringify(fields)}`);

          general_tests(test, subscriptions, documents);
          documents.all.forEach((doc) => {
            test.isUndefined(doc[local_session.get("field_to_exclude")], `${doc[local_session.get("field_to_exclude")]};; language=${Meteor.i18n.getLanguage()}; field_to_exclude=${local_session.get("field_to_exclude")}; projection_type=${local_session.get("projection_type") ? "inclusive" : "exclusive"}; projection=${JSON.stringify(fields)}`);
          });
          if (!shiftTest()) {
            comp.stop();
            Meteor.clearInterval(interval_handle);
            onComplete();
          }
        }
      }), idle_time);
    });
  }
}

if (Meteor.isClient) {
  Tinytest.addAsync('illuminist-i18n-db - translations editing - insertLanguage - language_tag=Meteor.i18n.getLanguage()', (test, onComplete) => {
    Meteor.i18n.setLanguage("aa");
    var _id;
    return test.equal(translationsEditingTestsCollection.findOne(_id = translationsEditingTestsCollection.insertLanguage({
      a: 1,
      b: 5
    }, {
      b: 2,
      d: 4
    }, ((err, id) => {
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
  Tinytest.addAsync('illuminist-i18n-db - translations editing - translate - language_tag=Meteor.i18n.getLanguage()', (test, onComplete) => {
    Meteor.i18n.setLanguage("aa");
    var result;
    var _id = translationsEditingTestsCollection.insertTranslations({
      a: 5,
      b: 2
    }, {
      aa: {
        x: 4,
        y: 2
      }
    });
    result = translationsEditingTestsCollection.translate(_id, {
      a: 1,
      c: 3
    });
    test.equal(result, 1, "Correct number of affected documents");
    result = translationsEditingTestsCollection.translate(_id, {
      x: 1,
      z: 3
    }, {});
    test.equal(result, 1, "Correct number of affected documents");
    translationsEditingTestsCollection.translate(_id, {
      l: 1,
      m: 2
    }, (err, affected_rows) => {
      Meteor.setTimeout((() => {
        test.equal(1, affected_rows);
        test.equal(translationsEditingTestsCollection.findOne(_id, {
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
        onComplete();
      }), 1000);
    });
  });
  Tinytest.addAsync('illuminist-i18n-db - translations editing - removeLanguage - language_tag=Meteor.i18n.getLanguage()', (test, onComplete) => {
    Meteor.i18n.setLanguage("aa");
    var result;
    var _id = translationsEditingTestsCollection.insertTranslations({
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
    result = translationsEditingTestsCollection.removeLanguage(_id, ["x", "y"]);
    test.equal(result, 1, "Correct number of affected documents");
    result = translationsEditingTestsCollection.removeLanguage(_id, ["y", "z"], {});
    test.equal(result, 1, "Correct number of affected documents");
    return result = translationsEditingTestsCollection.removeLanguage(_id, ["u", "v"], (err, affected_rows) => {
      return Meteor.setTimeout((() => {
        test.equal(1, affected_rows);
        test.equal(translationsEditingTestsCollection.findOne(_id, {
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
  Tinytest.addAsync('illuminist-i18n-db - translations editing - removeLanguage - complete remove - language_tag=Meteor.i18n.getLanguage()', (test, onComplete) => {
    Meteor.i18n.setLanguage("aa");
    var result;
    var _id = translationsEditingTestsCollection.insertTranslations({
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
    return result = translationsEditingTestsCollection.removeLanguage(_id, null, (err, affected_rows) => {
      return Meteor.setTimeout((() => {
        test.equal(1, affected_rows);
        test.equal(translationsEditingTestsCollection.findOne(_id, {
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
  Tinytest.addAsync('illuminist-i18n-db - translations editing - removeLanguage - attempt complete remove base language - language_tag=Meteor.i18n.getLanguage()', (test, onComplete) => {
    Meteor.i18n.setLanguage("en"); // Collection base language is a fallback language : 'en'
    var result;
    var _id = translationsEditingTestsCollection.insertTranslations({
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
    return result = translationsEditingTestsCollection.removeLanguage(_id, null, (err, affected_rows) => {
      return Meteor.setTimeout((() => {
        test.isUndefined(affected_rows);
        test.instanceOf(err, Meteor.Error);
        if(err) test.equal(err.reason, "Complete removal of collection's base language from a document is not permitted");
        return onComplete();
      }), 1000);
    });
  });
}

