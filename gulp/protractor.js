// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
var gulp = require('gulp');

var plugins = require('./gulpPlugins');

var common = require('./common');

var gp = plugins.protractor;

// Collect command line options
var args = require('./gulpArguments');

var protractorConfig = {
    env: {
        // Will set before each test
    },
    dev_mode: common.config ? common.config.dev_mode ? common.config.dev_mode : false : false,
    error: false
};

// For combining reports at the end of protractor tests
var fs = require('fs');
var through = require('through2');
var istanbul = require('istanbul');
var collector = new istanbul.Collector();
var sync = true;

gulp.task('protractor-jenkins-env', function() {
    jenkinsConfig = {
        bll_url: "https://127.0.0.1:9095/api/v1/",//TODO-replace with local test system
        proxy: true,
        is_foundation_installed: true
    };
    fs.writeFileSync('app/local/config.json', JSON.stringify(jenkinsConfig, null, 4));
});

gulp.task('clean-protractor', ['clean'], function() {
    plugins.del(['coverage/protractor/']);
});

gulp.task('protractor-lint', function() {
    return gulp.src('./test/e2e/suites/**/*.js')
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('default'))
        .pipe(plugins.jshint.reporter('fail'));
});

gulp.task('webdriver-manager-update', gp.webdriver_update);

gulp.task('instrument', ['build', 'wire-deps'], function() {
    return gulp.src([
            '.tmp/plugins/*/scripts/**/*.js',
            '.tmp/scripts/components/**/*.js',
            '.tmp/scripts/controllers/**/*.js',
            '.tmp/scripts/**/*.js'
        ])
        // Covering files
        .pipe(plugins.istanbul({
            coverageVariable: '__coverage__',
            embedSource: true
        }))
        // Overwrite files with covered versions
        .pipe(gulp.dest(function(file) {
            return file.base;
        }));
});

gulp.task('setup-env', function() {
    return gulp.src('.tmp/opscon_config.json')
        .pipe(plugins.jsonEditor({
            env: protractorConfig.env,
            protractor_testing: true
        }))
        .pipe(gulp.dest('./.tmp'));
});

gulp.task('protractor-tests', function() {
    // Start the server
    plugins.connect.server({
        root: ['.tmp'],
        port: 9006,
        middleware: common.middleware
    });

    // Run the protractor tests
    return gulp.src([])
        .pipe(gp.protractor({
            configFile: './test/e2e/protractor_conf.js',
            args: [
                '--params.env', protractorConfig.env,
                '--params.coverage', args.coverage,
                '--params.dev_mode', protractorConfig.dev_mode
            ]
        }))
        .on('error', function(err) {
            // Close the server
            plugins.connect.serverClose();
            console.log(err);
            protractorConfig.error = true;
            // Allow protractor-tests to continue to run
            this.emit('end');
        })
        .on('end', function() {
            // Close the server
            plugins.connect.serverClose();
        });
});

gulp.task('protractor-stdcfg', function(callback) {
    if (args.env === 'stdcfg' || args.env === null) {
        protractorConfig.env = 'stdcfg';
        plugins.runSequence(
            'setup-env',
            'protractor-tests',
            callback);
    } else {
        console.log('Protractor tests against stdcfg skipped.');
        callback();
    }
});

gulp.task('protractor-legacy', function(callback) {
    if (args.env === 'legacy' || args.env === null) {
        protractorConfig.env = 'legacy';
        plugins.runSequence(
            'setup-env',
            'protractor-tests',
            callback);
    } else {
        console.log('Protractor tests against legacy skipped.');
        callback();
    }
});

gulp.task('combine-reports', function() {
    if (args.coverage) {
        return gulp.src('coverage/protractor/*-json/*.json')
            .pipe(through.obj(function(file, enc, callback) {
                console.log('Added "' + file.path + '" to final code coverage reports.');
                collector.add(JSON.parse(fs.readFileSync(file.path, 'utf8')));
                callback(null, file);
            }))
            .on('end', function() {
                istanbul.Report.create('lcov', {dir: 'coverage/protractor/reports/lcov'})
                    .writeReport(collector, sync);
                console.log('lcov report successfully generated.');
                istanbul.Report.create('cobertura', {dir: 'coverage/protractor/reports/cobertura'})
                    .writeReport(collector, sync);
                console.log('Cobertura report successfully generated.');
            });
    } else {
        console.log('Code coverage reports ignored.');
    }
});

gulp.task('exit-code', function() {
    if (protractorConfig.error) {
        console.log('One or more Protractor tests failed. Exiting...');
        process.exit(1);
    }
});

gulp.task('pre-protractor', function(callback) {
    plugins.runSequence(
        'clean-protractor',
        ['protractor-lint', 'webdriver-manager-update', 'instrument'],
        callback);
});

gulp.task('post-protractor', function(callback) {
    plugins.runSequence(
        'combine-reports',
        'exit-code',
        callback);
});

gulp.task('protractor', function(callback) {
    plugins.runSequence(
        'pre-protractor',
        'protractor-stdcfg',
        'protractor-legacy',
        'post-protractor',
        callback);
});
