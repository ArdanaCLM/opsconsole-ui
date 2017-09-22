// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
var gulp = require('gulp');

var plugins = require('./gulpPlugins');

var envs = require('./env');

var fs = require('fs');

var common = require('./common');

gulp.task('dist-fonts', ['fonts'], function () {
  var streams = envs.map(function(env) {
    return gulp.src(".tmp/fonts/**/*.{eot,svg,ttf,woff}")
      .pipe(gulp.dest('dist.' + env.name + '/fonts'));
  });
  return plugins.mergeStream.apply(null, streams);
});

gulp.task('dist-images', ['images'], function () {
  var streams = [];
  envs.forEach(function(env) {
    streams.push(
      gulp.src(["app/bower_components/jquery-ui/themes/base/images/**/*.*"])
        .pipe(gulp.dest('dist.' + env.name +  '/styles/images')));
    streams.push(
      gulp.src([".tmp/images/**/*.*"])
        .pipe(gulp.dest('dist.' + env.name +  '/images'))
    );
  });
  return plugins.mergeStream.apply(null, streams);
});

gulp.task('dist-icons', ['dist-images'], function () {
  var streams = [];
  envs.forEach(function(env) {
    streams.push(
      gulp.src([".tmp/styles/icons.css"])
        .pipe(gulp.dest('.tmp.' + env.name + '/styles'))
    );
  });
  return plugins.mergeStream.apply(null, streams);
});

gulp.task('dist-configfile', function (cb) {
  envs.forEach(function(env) {
    var config = JSON.parse(fs.readFileSync("app/opscon_config.json", {encoding: "utf-8"}));
    config.env = env.name;

    //the actual build creates opscon_config.json from a template, this
    //change just makes local minified dev environments point to the specific dashboard
    if(env.name === 'stdcfg'){
      config.default_route = "/general/dashboard_alarms_summary";
    }

    var filePath = 'dist.' + env.name,
        fileName = filePath + '/opscon_config.json';
    fs.mkdirSync(filePath);
    fs.writeFileSync(fileName, JSON.stringify(config), {encoding: "utf-8"});
  });
  cb();
});

gulp.task('dist-helpconfig', function() {
  var streams = envs.map(function(env) {
    return gulp.src([".tmp/help_config.json"])
      .pipe(gulp.dest('./.tmp.' + env.name))
      .pipe(gulp.dest('./dist.' + env.name));
  });
  return plugins.mergeStream.apply(null, streams);
});

gulp.task('dist-versionfile', ['version'], function (cb) {
  envs.forEach(function(env) {
    var version = JSON.parse(fs.readFileSync("./.tmp/version.json", {encoding: "utf-8"}));
    version.env = env.name;
    var filePath = 'dist.' + env.name,
        fileName = filePath + '/version.json';
    fs.writeFileSync(fileName, JSON.stringify(version), {encoding: "utf-8"});
  });
  cb();
});

gulp.task('dist-templates', function(){
    //combine all template files of the app into a js file
    var streams = envs.map(function(env) {
      var files = [
        './app/templates/**/*.html',
        './app/plugins/{' + env.config.plugins.join(',') + '}/templates/**/*.html'
      ];

      return gulp.src(files)
        .pipe(plugins.angularTemplatecache('templates.js',{standalone:true}))
        .pipe(gulp.dest('./.tmp.' + env.name + '/scripts'));
    });
    return plugins.mergeStream.apply(null, streams);
});

gulp.task('dist-inject', function() {
    var bower = gulp.src(plugins.mainBowerFiles(), {read: false});
    var streams = envs.map(function(env) {
      var plugin_files = env.config.plugins.join(','),
          plugin_js_files = ['app/plugins/{' + plugin_files + '}/scripts/**/*.js'],
          plugin_scss_files = ['app/plugins/{' + plugin_files + '}/styles/**/*.scss'],
          plugin_css_files = ['app/plugins/{' + plugin_files + '}/styles/**/*.css'],
          plugin_locale_files = ['app/locales/*/*.json', 'app/plugins/{' + plugin_files + '}/locales/*/*.json'];

      var plugin_js = gulp.src(plugin_js_files, {read: false});
      var plugin_scss = gulp.src(plugin_scss_files, {read: false})
        .pipe(plugins.rename(function(path) {
            path.extname = ".css";
        }));
      var plugin_css = gulp.src(plugin_css_files, {read: false});
      var plugins_stream = plugins.eventStream.merge(plugin_js, plugin_css, plugin_scss);
      var locales = gulp.src(plugin_locale_files);

      return gulp.src('app/index.html')
        .pipe(plugins.inject(bower, {relative: true, name: 'bower'}))
        .pipe(plugins.inject(locales, {name: 'locales', relative: true, starttag: '<!-- locales:{{ext}} -->', transform: function(filepath, file) {
          return "<script type=\"application/json\" name=\"" + filepath + "\">" + file.contents.toString('utf8') + "</script>";
        }}))
        .pipe(plugins.inject(plugins_stream, {relative: true, name: 'plugins'}))
        .pipe(gulp.dest(".tmp." + env.name));
    });
    return plugins.mergeStream.apply(null, streams);
});

gulp.task('dist-scripts', function() {
  var streams = envs.map(function(env) {
    return gulp.src('./app/scripts/**/*.js')
      .pipe(plugins.jshint())
      .pipe(plugins.jshint.reporter('default'))
      .pipe(gulp.dest('./.tmp.' + env.name + '/scripts'));
  });
  return plugins.mergeStream.apply(null, streams);
});

gulp.task('dist-css', function() {
  var streams = envs.map(function(env) {
    return gulp.src('./app/styles/**/*.scss')
        .pipe(plugins.sass({style: 'expanded'}))
        .pipe(plugins.autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('./.tmp.' + env.name + '/styles'));
  });
  return plugins.mergeStream.apply(null, streams);
});

gulp.task('dist-plugins-scripts', function(){
  var streams = envs.map(function(env) {
    var plugin_files = './app/plugins/{' + env.config.plugins.join(',') + '}/scripts/**/*.js';
    return gulp.src(plugin_files)
      .pipe(plugins.jshint())
      .pipe(plugins.jshint.reporter('default'))
      .pipe(gulp.dest('./.tmp.' + env.name + '/plugins'));
  });
  return plugins.mergeStream.apply(null, streams);
});

gulp.task('dist-plugins-css', function() {
  var streams = envs.map(function(env) {
    var plugin_files = './app/plugins/{' + env.config.plugins.join(',') + '}/styles/**/*.{scss,css}';
    return gulp.src(plugin_files)
      .pipe(plugins.sass({style: 'expanded'}))
      .pipe(gulp.dest('./.tmp.' + env.name + '/plugins'));
  });
  return plugins.mergeStream.apply(null, streams);
});

gulp.task('dist-wire-deps', function() {
  var streams = envs.map(function(env) {
    return gulp.src(['app/bower_components/**/*.{js,swf,css,png,gif}'])
    .pipe(gulp.dest('.tmp.' + env.name + '/bower_components'));
  });
  return plugins.mergeStream.apply(null, streams);
});

gulp.task('dist-usemin', function() {
  var streams = envs.map(function(env) {
    return gulp.src(".tmp." + env.name + "/index.html")
      .pipe(plugins.usemin({
          css: [
            plugins.minifyCss(),
            'concat',
            plugins.rev(),
            plugins.header(common.copyrightMessage.css)],
          csslib: [
            plugins.minifyCss(),
            'concat',
            plugins.rev(),],
          html: [
            plugins.minifyHtml({empty: true}),
            plugins.header(common.copyrightMessage.html)],
          jslib: [
            plugins.uglify({preserveComments:"some"}),
            plugins.rev()],
          js: [
            plugins.uglify({preserveComments:"some"}),
            plugins.rev(),
            plugins.header(common.copyrightMessage.js)]
      }))
      .pipe(gulp.dest("dist." + env.name));
  });
  return plugins.mergeStream.apply(null, streams);
});

gulp.task('dist', function(callback) {
    plugins.runSequence(
        'clean',
        ['fonts', 'images', 'locales', 'configs', 'sampledata', 'plugins', 'scripts', 'dist-templates', 'css', 'helpconfig'],
        ['dist-inject', 'dist-scripts', 'dist-css', 'dist-plugins-scripts', 'dist-plugins-css', 'dist-wire-deps', 'dist-fonts', 'dist-images', 'dist-icons', 'dist-configfile', 'dist-versionfile'],
        ['dist-usemin', 'dist-helpconfig'],
        callback);
});
