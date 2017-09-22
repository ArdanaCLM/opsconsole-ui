// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
'use strict';

var gulp = require('gulp');

var plugins = require('./gulpPlugins');

var common = require('./common');

gulp.task('wire-deps', function() {
    return gulp.src(['app/bower_components/**/*.js',
             'app/bower_components/**/*.swf',
		     'app/bower_components/**/*.css',
		     'app/bower_components/**/*.png',
		     'app/bower_components/**/*.gif' ])
		.pipe(gulp.dest('.tmp/bower_components'));
});

gulp.task('server', ['build', 'watch', 'wire-deps'], function() {
    plugins.connect.server({
        root: ['.tmp'],
        port: 9000,
        livereload: true,
        middleware: common.middleware
    });
});

gulp.task('server-noreload', ['build', 'watch', 'wire-deps'], function() {
    plugins.connect.server({
        root: ['.tmp'],
        port: 9000,
        livereload: false,
        middleware: common.middleware
    });
});


gulp.task('production', function(){
    plugins.connect.server({
        root: ['dist'],
        port: 9001,
        livereload: false,
        middleware: common.middleware
    });
});
