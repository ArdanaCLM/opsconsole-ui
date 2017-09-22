// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
// Karma configuration
// Generated on Thu Mar 27 2014 15:49:13 GMT+0800 (PHT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
      //this is actually done in the gulp file now!!!
    files: [
      'app/bower_components/jquery/dist/jquery.js',
      'app/bower_components/angular/angular.js',
      'app/bower_components/angular-mocks/angular-mocks.js',
      'app/bower_components/angular-sanitize/angular-sanitize.js',
      'app/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'app/bower_components/angular-cookies/angular-cookies.js',
      'app/bower_components/angular-resource/angular-resource.js',
      'app/bower_components/angular-route/angular-route.js',
      'app/bower_components/angular-translate/angular-translate.js',
      'app/bower_components/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
      'app/bower_components/angular-translate-loader-partial/angular-translate-loader-partial.js',
      'app/bower_components/messageformat/messageformat.js',
      'app/bower_components/angular-flot/angular-flot.js',
      'app/bower_components/ng-file-upload/angular-file-upload.js',
      'app/bower_components/flot/jquery.flot.js',
      'app/bower_components/flot/jquery.flot.time.js',
      'app/bower_components/flot-orderBars/index.js',
      'app/bower_components/jquery-ui/jquery-ui.js',
      'app/bower_components/moment/moment.js',
      'app/bower_components/object-hash/dist/object_hash.js',
      'app/bower_components/bootstrap-sass-official/assets/javascripts/bootstrap.js',
      'app/bower_components/angular-translate-interpolation-messageformat/angular-translate-interpolation-messageformat.js',
      'app/bower_components/angular-file-saver/dist/angular-file-saver.bundle.js',
      'app/bower_components/angular-filter/dist/angular-filter.min.js',
      'app/bower_components/d3/d3.js',
      'app/bower_components/lodash/dist/lodash.js',
      'app/bower_components/angular-dragula/dist/angular-dragula.js',
      'test/*.js',
      'app/scripts/helpers.js',
      'app/scripts/plugin_system.js',
      'app/scripts/operations_ui.js',
      '.tmp/scripts/templates.js',
      'app/scripts/services/**/*.js',
      'app/scripts/components/**/*.js',
      'app/scripts/controllers/**/*.js',
      'app/plugins/*/scripts/**/*.js',
      'test/unit/**/*.js'
    ],


    // list of files to exclude
    exclude: [

    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'app/scripts/helpers.js': ['coverage'],
      'app/scripts/plugin_system.js': ['coverage'],
      'app/scripts/operations_ui.js': ['coverage'],
      'app/scripts/components/**/*.js': ['coverage'],
      'app/scripts/controllers/**/*.js': ['coverage'],
      'app/scripts/services/**/*.js': ['coverage'],
      'app/plugins/*/scripts/**/*.js': ['coverage']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],

    coverageReporter: {
      reporters: [
        {
          type: 'html',         // for us humans
          dir:'coverage/'
        }, {
          type : 'cobertura',   // for jenkins
          dir : 'coverage/'
        }, {
          type : 'lcov',        // for sonar
          dir : 'coverage/'
        }
      ]
    },


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    // Chrome can be used for development so that a debugger can be attached
    browsers: ['PhantomJS'],
    // browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
