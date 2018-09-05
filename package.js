Package.describe({
  name: 'illuminist:i18n-db',
  summary: 'Internationalization for Meteor Collections',
  version: '0.0.1',
  git: 'https://github.com/illuminist/illuminist-i18n-db/'
});

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.7.0.4');

  api.use(['ecmascript', 'underscore', 'deps', 'meteor', 'reactive-dict'], ['server', 'client']);
  api.use(['session'], ['client']);
  api.use('autopublish', ['server', 'client'], {weak: true})

  api.use('yogiben:admin@1.1.0', {weak: true});

  api.mainModule('illuminist_i18n_db-client.js', 'client');
  api.mainModule('illuminist_i18n_db-server.js', 'server');
});
Package.on_test(function (api) {
  //
  // DO NOT ADD THIS Package.on_test TO GIT!!!
  // DO NOT ADD THIS Package.on_test TO GIT!!!
  // DO NOT ADD THIS Package.on_test TO GIT!!!
  //

  api.use(['ecmascript', 'underscore', 'ejson', 'deps', 'tinytest', 'test-helpers', 'templating', 'jquery', 'reactive-dict'], ['client', 'server']);
  api.use(['session'], ['client']);
  

  api.use('illuminist:i18n-db', ['client', 'server']);

  api.mainModule('unittest/tests/helpers.js', ['client', 'server']);
  api.mainModule('unittest/tests/common.js', ['client', 'server']);
  api.mainModule('unittest/tests/enabled.js', ['client', 'server']);
});
