// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
var gulp = require('gulp');

var plugins = require('./gulpPlugins');
var karma = require('karma');

gulp.task('test', ['templates'], function(cb) {
  var server = new karma.Server({
    configFile: __dirname + '/../karma.conf.js',
    singleRun: true
  }, cb);
  server.start();
});

gulp.task('test-watch', ['templates'], function(cb) {
  var server = new karma.Server({
    configFile: __dirname + '/../karma.conf.js',
    singleRun: false
  }, cb);
  server.start();
});

var testReporter = function (lint, file) {
    console.log(file.path + ': ' + lint.error);
		throw lint.error;
};

gulp.task('json-lint', function() {
  return gulp.src([
    'app/locales/**/*.json',
    'app/plugins/*/locales/**/*.json'
  ])
  .pipe(plugins.jsonLint())
  .pipe(plugins.jsonLint.report(testReporter));
});

gulp.task('gatecheck', ['test', 'json-lint'], function(){
    //combine all js files of the app
    return gulp.src([
    		'./app/scripts/**/*.js',
    		'./app/plugins/*/scripts/**/*.js'
    	])
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('default'))
        .pipe(plugins.jshint.reporter('fail'))
        .pipe(gulp.dest('./.tmp/scripts'));
});
