// (c) Copyright 2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC

var gulp = require('gulp');

var plugins = require('./gulpPlugins');

var common = require('./common');

var unzip = require('decompress-unzip');

gulp.task('beautify:ui', function () {
    return gulp.src([
        '**app/components/**/*.js',
        '**app/components/**/*.html',
        '**app/main/**/*.js',
        '**app/main/**/*.html',
        '**app/plugins/**/*.js',
        '**app/plugins/**/*.html',
        '**app/locales/**/*.json',
        '**test/ui/**/*.js'
    ])
    .pipe(plugins.prettify({
        config: '.jsbeautifyrc'
    }))
    .pipe(gulp.dest('.'));
});

gulp.task('beautify:ui:verify', function () {
    return gulp.src([
        '**app/components/**/*.js',
        '**app/components/**/*.html',
        '**app/main/**/*.js',
        '**app/main/**/*.html',
        '**app/plugins/**/*.js',
        '**app/plugins/**/*.html',
        '**app/locales/**/*.json'
    ])
    .pipe(plugins.prettify({
        config: '.jsbeautifyrc',
        mode: 'VERIFY_ONLY'
    }));
});

gulp.task('scripts', function(){
    //combine all js files of the app
    return gulp.src('./app/scripts/**/*.js')
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('default'))
        .pipe(gulp.dest('./.tmp/scripts'))
        .pipe(plugins.connect.reload());
});

gulp.task('templates',function(){
    //combine all template files of the app into a js file
    return gulp.src(['./app/templates/**/*.html', './app/plugins/*/templates/**/*.html'])
        .pipe(plugins.angularTemplatecache('templates.js',{standalone:true}))
        .pipe(gulp.dest('./.tmp/scripts'))
        .pipe(plugins.connect.reload());
});

gulp.task('css', function(){
    return gulp.src('./app/styles/**/*.scss')
        .pipe(plugins.sass({style: 'expanded'}).on('error', plugins.sass.logError))
        .pipe(plugins.autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('./.tmp/styles'))
        .pipe(plugins.connect.reload());
});

gulp.task('locales', function(){
    return gulp.src(['app/locales/**/*.json'])
        .pipe(plugins.jsonLint())
        .pipe(plugins.jsonLint.report('verbose'))
        .pipe(gulp.dest('./.tmp/locales'))
        .pipe(plugins.connect.reload());
});

gulp.task('images', function(){
    return gulp.src(['app/images/**', 'app/plugins/**/images/**'])
        .pipe(gulp.dest('./.tmp/images'))
        .pipe(plugins.connect.reload());
});

gulp.task('configs', function(){
    // Merge the official config file with a local file of overrides, if present
    var result = gulp.src(['app/opscon_config.json', 'app/local/config.json'])
        .pipe(plugins.jsonminify())           // remove comments in json files
        .pipe(plugins.extend('opscon_config.json', true, 4));

    if(common.config && common.config.proxy) {
        return result
            .pipe(plugins.jsonEditor({
                bll_url: common.proxyPath
            }))
            .pipe(gulp.dest('./.tmp'));
    } else {
        return result.pipe(gulp.dest('./.tmp'));
    }
});

gulp.task('helpconfig', function(){
    return gulp.src(['app/help_config.json'])
        .pipe(plugins.jsonminify())
        .pipe(gulp.dest('./.tmp'))
        .pipe(plugins.connect.reload());
});

// Run the command "git -1 --format=%H,%cd" to get the SHA1 & Date.
// The comma is the delimiter
function runGetSha(callback) {
    var spawn = require('child_process').spawn;
    var command = spawn("git", ["log", "-1", "--format=%H,%cd"]);
    var result = '';
    command.stdout.on('data', function(data) {
        result += data.toString();
    });
    command.on('close', function(code) {
        return callback(result);
    });
}

gulp.task('version', function(callback){
    // create version file
    var fs = require('fs');
    // get version from package.json
    var config = require('../package.json');
    var version = config.version;
    var now = new Date().toString();
    var last_commit_sha = '';
    var last_commit_date = '';

    runGetSha(function(result) {
        // comma is delimiter, SHA1 first, commit date second
        var result_list = result.split(",");
        // expect 2 items
        if (result_list.length >= 2) {
            last_commit_sha = result_list[0].trim();
            last_commit_date = result_list[1].trim();
        }
        var version_file_json = {
          version: version,
          build_time: now,
          sha: last_commit_sha,
          commit_date: last_commit_date
        };

        try {
            fs.mkdirSync('./.tmp');
        } catch (e){
        }

        fs.writeFileSync('./.tmp/version.json', JSON.stringify(version_file_json));
        callback();
    });
});

gulp.task('fonts', function () {
  var bowerFiles = gulp.src(plugins.mainBowerFiles());
  var localFonts = gulp.src(['app/fonts/**/*.{eot,svg,ttf,woff,woff2}']);
  return plugins.eventStream.merge(bowerFiles, localFonts)
    .pipe(plugins.filter('**/*.{eot,svg,ttf,woff,woff2}'))
    .pipe(plugins.flatten())
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(plugins.connect.reload());
});

gulp.task('inject', function() {
    var bower = gulp.src(plugins.mainBowerFiles(), {read: false});
    var plugin_js = gulp.src('app/plugins/*/scripts/**/*.js', {read: false});
    var plugin_scss = gulp.src('app/plugins/*/styles/**/*.scss', {read: false})
        .pipe(plugins.rename(function(path) {
            path.extname = ".css";
        }));
    var plugin_css = gulp.src('app/plugins/*/styles/**/*.css', {read: false});
    var plugins_stream = plugins.eventStream.merge(plugin_js, plugin_css, plugin_scss);
    return gulp.src('app/index.html')
        .pipe(plugins.inject(bower, {relative: true, name: 'bower'}))
        .pipe(plugins.inject(plugins_stream, {relative: true, name: 'plugins'}))
        .pipe(gulp.dest(".tmp"))
        .pipe(plugins.connect.reload());
});

gulp.task('sampledata', function(){
    return gulp.src(['sample_data/**/*.*'])
        .pipe(gulp.dest('./.tmp/sample_data'))
        .pipe(plugins.connect.reload());
});

gulp.task('timestamp', function(){
    console.log("Completed at:" + new Date());
});

gulp.task('clean', function (callback) {
    plugins.del(['.tmp*', 'dist*'], callback);
});

//dev build
gulp.task('build', function(callback) {
    plugins.runSequence(
        'clean',
        ['fonts', 'images', 'locales', 'configs', 'sampledata', 'plugins', 'scripts', 'templates', 'css', 'version'],
        'inject', 'helpconfig',
        callback);
});
