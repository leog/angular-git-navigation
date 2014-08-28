var gulp = require('gulp'),
    argv = require('yargs').argv,
    plugins = require('gulp-load-plugins')(),
    path = require('path');

gulp.task('watch', function () {
    gulp.watch('./src/**/*.less', ['less']);
});

gulp.task("rjs", function() {
    var boot = argv.bootstrapped,
        uglify = !argv.nouglify,
        suffix = uglify ? '.min' : '';
    plugins.requirejs({
        baseUrl: 'src/scripts',
        name: '../../bower_components/almond/almond',
        include: ['ngGitNav'],
        deps: boot ? ["config"] : [],
        out: boot ? './ngGitNav.bootstrapped'+suffix+'.js' : './ngGitNav'+suffix+'.js',
        stubModules : ['../../bower_components/require-css/css', '../../bower_components/require-css/./normalize'],
        wrap: {
            startFile: 'config/start.frag',
            endFile: 'config/end.frag'
        }
    })
    .pipe(plugins.if(uglify, plugins.uglify()))
    .pipe(gulp.dest("dist"));
});

gulp.task('less', function () {
    gulp.src('./src/styles/*.less')
        .pipe(plugins.less({
            paths: [ path.join(__dirname, 'less', 'includes') ]
        }))
        .pipe(gulp.dest('./src/styles'));
});

gulp.task('lint', function () {
    gulp.src(['src/**/*.js'])
        .pipe(plugins.eslint({
            globals: {
                'require':true,
                'define': true,
                'document': true,
                'angular': true
            }
        }))
        .pipe(plugins.eslint.format());
});


gulp.task('dev', ["lint", "less", "watch"]);
gulp.task('build', ["lint", "less", "rjs"]);

// TODO: Follow up require-css issue to load octicons.css: https://github.com/guybedford/require-css/issues/163
// TODO: Create gh-pages for standalone and not standalone versions
// TODO: Improve README