// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
var istanbul = require('istanbul');
var collector = new istanbul.Collector();
var sync = true;
var screenshot = require('protractor-jasmine2-screenshot-reporter');

var suitePromises = [];

var htmlReporter = new screenshot({
  dest: './coverage/protractor/screenshots/',
  cleanDestination: true,
  showSummary: false,
  showConfiguration: false,
  reportTitle: null,
  filename: 'protractor-report.html',
  ignoreSkippedSpecs: true,
  captureOnlyFailedSpecs: true,
  reportOnlyFailedSpecs: false,
  pathBuilder: function(currentSpec, suites, browserCapabilities) {
    return browserCapabilities.get('browserName') + '/' + currentSpec.fullName;
  },
  preserveDirectory: true
});

exports.config = {
  // ---- 1. To start a standalone Selenium Server locally ---------------------
  // The location of the standalone Selenium Server jar file, relative
  // to the location of this config. If no other method of starting Selenium
  // Server is found, this will default to
  // node_modules/protractor/selenium/selenium-server...
  seleniumServerJar: '../../node_modules/protractor/node_modules/webdriver-manager/selenium/selenium-server-standalone-2.53.1.jar',
  localSeleniumStandaloneOpts: {
    // The port to start the Selenium Server on, or null if the server should
    // find its own unused port.
    port: null,

    // Additional command line options to pass to selenium. For example,
    // if you need to change the browser timeout, use
    // seleniumArgs: ['-browserTimeout=60']
    args: []
  },

  // ChromeDriver location is used to help find the chromedriver binary.
  // This will be passed to the Selenium jar as the system property
  // webdriver.chrome.driver. If null, Selenium will
  // attempt to find ChromeDriver using PATH.
  chromeDriver: null,

  // ---- 5. To connect directly to Drivers ------------------------------------
  // Boolean. If true, Protractor will connect directly to the browser Drivers
  // at the locations specified by chromeDriver and firefoxPath. Only Chrome
  // and Firefox are supported for direct connect.
  directConnect: true,

  // Path to the firefox application binary. If null, will attempt to find
  // firefox in the default locations.
  firefoxPath: null,

  // Test framework to use
  // 'jasmine' uses the most recent version my default
  framework: 'jasmine',

  // Suites
  suites : {
    login: './suites/login/**/*.spec.js',
    // home: './suites/home/**/*.spec.js',
    compute: './suites/compute/**/*.spec.js',
    system: './suites/system/**/*.spec.js',

    // Enable these when testing to increase speed

    // All pages underneath home
    centralDashboard: './suites/home/central_dashboard/central_dashboard.spec.js',
    // myDashboard: './suites/home/my_dashboard/my_dashboard.spec.js',
    alarmExplorer: './suites/home/alarm_explorer/alarm_explorer.spec.js',
    logging: './suites/home/logging/logging.spec.js'

    // All pages underneath compute
    // computeBaremetal: './suites/compute/compute_baremetal_instances/compute_baremetal_instances.spec.js',
    // computeHosts: './suites/compute/compute_hosts/compute_hosts.spec.js',
    // computeInstances: './suites/compute/compute_instances/compute_instances.spec.js',
    // computeSummary: './suites/compute/compute_summary/compute_summary.spec.js',

    // All pages underneath system
    // appliances: './suites/system/appliances/appliances.spec.js',
    // backupRestore: './suites/system/backup_restore/backup_restore.spec.js',
    // integratedTools: './suites/system/integrated_tools/integrated_tools.spec.js',
    // networking: './suites/system/networking/networking.spec.js',
  },

  // Capabilities to be passed to the webdriver instance
  multiCapabilities: [
    {
      'browserName': 'chrome',
      'chromeOptions': {
        'args': [
          'proxy-bypass-list="localhost;127.0.0.1"',
          'wm-window-animations-disabled'
        ]
      }
    }
    // {
    //   'browserName': 'firefox',
    // }
  ],

  // Options to be passed to Jasmine-node
  jasmineNodeOpts: {
    showColors: true, // Use colors in the command line report.
    defaultTimeoutInterval: 30000, // set timeout for async calls
  },

  // A base URL for your application under test. Calls to protractor.get()
  // with relative paths will be resolved against this URL (via url.resolve)
  baseUrl: 'http://localhost:9006',

  // The params object will be passed directly to the Protractor instance,
  // and can be accessed from your test as browser.params. It is an arbitrary
  // object and can contain anything you may need in your test.
  // This can be changed via the command line as:
  //   --params.login.user "Joe"
  params: {
    login: {
      user: 'dev',
      password: 'test'
    }
  },

  // If true, protractor will restart the browser between each test.
  // CAUTION: This will cause your tests to slow down drastically.
  restartBrowserBetweenTests: false,

  // The timeout in milliseconds for each script run on the browser. This should
  // be longer than the maximum time your application needs to stabilize between
  // tasks.
  // Default is 11000
  allScriptsTimeout: 15000,

  // Set timeout for page fetches
  getPageTimeout: 15000,

  beforeLaunch: function() {
    return new Promise(function(resolve) {
      htmlReporter.beforeLaunch(resolve);
    });
  },

  // A callback function called once protractor is ready and available, and
  // before the specs are executed.
  // If multiple capabilities are being run, this will run once per
  // capability.
  // You can specify a file containing code to run by setting onPrepare to
  // the filename string.
  // onPrepare can optionally return a promise, which Protractor will wait for
  // before continuing execution. This can be used if the preparation involves
  // any asynchronous calls, e.g. interacting with the browser. Otherwise
  // Protractor cannot guarantee order of execution and may start the tests
  // before preparation finishes.
  onPrepare: function() {
    // Disable angular animations
    var disableNgAnimate = function() {
      angular.module('disableNgAnimate', []).run(['$animate', function($animate) {
        $animate.enabled(false);
      }]);
    };

    var disableCssAnimate = function() {
      angular.module('disableCssAnimate', []).run(function () {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = '* {' +
          '-webkit-transition: none !important;' +
          '-moz-transition: none !important' +
          '-o-transition: none !important' +
          '-ms-transition: none !important' +
          'transition: none !important' +
          '}';
        document.getElementsByTagName('head')[0].appendChild(style);
      });
    };

    browser.addMockModule('disableNgAnimate', disableNgAnimate);
    browser.addMockModule('disableCssAnimate', disableCssAnimate);

    // Set up coverage collection
    if (browser.params.coverage === 'true') {
      var coverageReporter = {
        suiteDone: function(result) {
          suitePromises.push(browser.driver.executeScript('return __coverage__;').then(function(coverageResults) {
            collector.add(coverageResults);
          }));
        }
      };

      jasmine.getEnv().addReporter(coverageReporter);
    }
    jasmine.getEnv().addReporter(htmlReporter);

    // Sign in to UI
    var Login = require('./suites/login/login.pageObject.js');

    loginPage = new Login();
    loginPage.get();

    browser.driver.manage().window().maximize();

    loginPage.login(
      browser.params.login.user,
      browser.params.login.password
    );

    return browser.wait(function () {
      return browser.getCurrentUrl().then(function(url) {
        return url === browser.baseUrl + '/#/general/dashboard_alarms_summary';
      });
    }, 5000, 'login did not make it to /#/general/dashboard_alarms_summary');
  },

  // A callback function called once tests are finished.
  // onComplete can optionally return a promise, which Protractor will wait for
  // before shutting down webdriver.
  onComplete: function() {
    if (browser.params.coverage === 'true') {
      return Promise.all(suitePromises).then(function(values) {
        istanbul.Report.create('json', {dir: 'coverage/protractor/' + browser.params.env + '-json'})
          .writeReport(collector, sync);
        console.log(browser.params.env + ' json report successfully generated.');
      });
    }
  },

  afterLaunch: function(exitCode) {
    return new Promise(function(resolve) {
      htmlReporter.afterLaunch(resolve.bind(this, exitCode));
    });
  }
};
