var gulp = require('gulp'),
    less = require('gulp-less'),
    eslint = require('gulp-eslint'),
    path = require('path'),
    rjs = require('gulp-requirejs'),
    uglify = require('gulp-uglify');

gulp.task('watch', function () {
    gulp.watch('./src/*.less', ['less']);
});

gulp.task("rjs", function() {
    rjs({
        baseUrl: 'src/scripts',
        name: '../../bower_components/almond/almond',
        include: ['angular-git-navigation'],
        deps: ["config"],
        out: './angular-git-navigation.js',
        wrap: true
    }).pipe(uglify())
    .pipe(gulp.dest("standalone"));
});

gulp.task('less', function () {
    gulp.src('./src/styles/*.less')
        .pipe(less({
            paths: [ path.join(__dirname, 'less', 'includes') ]
        }))
        .pipe(gulp.dest('./src/styles'));
});

gulp.task('lint', function () {
    gulp.src(['src/*.js'])
        .pipe(eslint({
            globals: {
                'require':true,
                'define': true,
                'document': true
            }
        }))
        .pipe(eslint.format());
});


gulp.task('dev', ["lint", "less", "watch"]);

// TODO: gulp-load-plugins
// TODO: rjs excluding config.js
// TODO: Create standalone & not standalone tasks
// TODO: Create gh-pages for standalone and not standalone versions
// TODO: Improve README
// TODO: Figure out using ui-router to avoid URL change on navigation