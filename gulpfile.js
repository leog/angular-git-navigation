var gulp = require('gulp'),
    less = require('gulp-less'),
    eslint = require('gulp-eslint'),
    path = require('path'),
    rjs = require('gulp-requirejs');

gulp.task("rjs", function() {
    rjs({
        baseUrl: 'src',
        out: 'angular-git-navigation.js',
        name: 'main',
        mainConfigFile: "src/require.config.js",
        paths: {
            'main': 'angular-git-navigation'
        },
        optimizeCss: "none",
        buildCSS: false,
        skipDirOptimize: true,
        preserveLicenseComments: false,
        removeCombined: false,
        wrap: true,
        findNestedDependencies: true,
        uglify: {
            no_mangle: false
        }
    }).pipe(gulp.dest("dist"));
});

gulp.task('less', function () {
    gulp.src('./src/gitNav.less')
        .pipe(less({
            paths: [ path.join(__dirname, 'less', 'includes') ]
        }))
        .pipe(gulp.dest('./dist'))
        .pipe(gulp.dest('./src'));
});

gulp.task('lint', function () {
    gulp.src(['src/*.js'])
        .pipe(eslint({
            globals: {
                'require':true
            }
        }))
        .pipe(eslint.format());
});

gulp.task('default', function() {
    // place code for your default task here
});