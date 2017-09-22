// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
var gulp = require('gulp');

var plugins = require('./gulpPlugins');

gulp.task('watch',function(){
    gulp.watch(['./app/scripts/**/*.js','!./app/**/*test.js'],['scripts', 'inject', 'timestamp']);
    gulp.watch(['!./app/index.html','./app/**/*.html'],['templates','timestamp']);
    gulp.watch('./app/styles/**/*.scss',['css','timestamp']);
    gulp.watch('./app/images/**',['images','timestamp']);
    gulp.watch('./app/index.html',['inject','timestamp']);
    gulp.watch('./app/locales/*.json',['extras','timestamp']);
    gulp.watch('./sample_data/*.json', ['sampledata']);
    gulp.watch('app/fonts/**/*.{eot,svg,ttf,woff}', ['fonts', 'timestamp']);
    gulp.watch(['./app/*.json', './app/local/config.json'], ['configs']);
    gulp.watch('./app/locales/**/*.json', ['locales']);

    // Plugins
    gulp.watch('./app/plugins/*/scripts/**/*.js', ['plugins-scripts', 'inject', 'timestamp']);
    gulp.watch(['./app/plugins/*/styles/**/*.scss','./app/plugins/*/styles/**/*.css'], ['plugins-css', 'inject', 'timestamp']);
    gulp.watch('./app/plugins/*/locales/**/*.json', ['plugins-locales', 'timestamp']);

});
