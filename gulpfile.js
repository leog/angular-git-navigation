var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    path = require('path');

gulp.task('watch', function () {
    gulp.watch('./src/*.less', ['less']);
});

gulp.task("rjs", function() {
    plugins.requirejs({
        baseUrl: 'src/scripts',
        name: '../../bower_components/almond/almond',
        include: ['angular-git-navigation'],
        deps: ["config"],
        out: './angular-git-navigation-standalone.js',
        wrap: true
    }).pipe(plugins.uglify())
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
    gulp.src(['src/*.js'])
        .pipe(plugins.eslint({
            globals: {
                'require':true,
                'define': true,
                'document': true
            }
        }))
        .pipe(plugins.eslint.format());
});


gulp.task('dev', ["lint", "less", "watch"]);
gulp.task('build', ["lint", "less", "rjs"]);

// TODO: rjs excluding config.js
// TODO: Create standalone & not standalone tasks
// TODO: Create gh-pages for standalone and not standalone versions
// TODO: Improve README
// TODO: Figure out using ui-router to avoid URL change on navigation
// TODO: Namespacing styles