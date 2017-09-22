// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
var gulp = require('gulp');

var plugins = require("./gulpPlugins");

gulp.task('plugins-scripts', function(){
    //combine all js files of the app
    return gulp.src('./app/plugins/*/scripts/**/*.js')
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('default'))
        .pipe(gulp.dest('./.tmp/plugins'))
        .pipe(plugins.connect.reload());
});

gulp.task('plugins-css', function(){
    return gulp.src(['./app/plugins/*/styles/**/*.scss','./app/plugins/*/styles/**/*.css'])
        .pipe(plugins.sass({style: 'expanded'}))
        .pipe(gulp.dest('./.tmp/plugins'))
        .pipe(plugins.connect.reload());
});

gulp.task('plugins-fonts', function(){
    return gulp.src('./app/plugins/*/fonts/**/*.{eot,svg,ttf,woff,woff2}')
        .pipe(gulp.dest('./.tmp/plugins'))
        .pipe(plugins.connect.reload());
});

gulp.task('plugins-locales', function(){
    return gulp.src('./app/plugins/*/locales/**/*.json')
        .pipe(plugins.jsonLint())
        .pipe(plugins.jsonLint.report('verbose'))
        .pipe(plugins.copy('./.tmp', {prefix: 3}))
        .pipe(plugins.connect.reload());
});

gulp.task('plugins', ['plugins-scripts', 'plugins-css', 'plugins-locales', 'plugins-fonts']);
