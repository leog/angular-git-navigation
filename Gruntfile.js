module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.loadNpmTasks('grunt-eslint');

    grunt.initConfig({
        eslint: {
            target: ["angular-git-navigation.js"]
        },
        requirejs: {
            options: {
                baseUrl: "",
                paths: {
                    'lgGitNav': ""
                },
                mainConfigFile: "src/requireConfig.js",
                optimizeCss: "none",
                dir: "build", // Will not be used
                buildCSS: false,
                skipDirOptimize: true,
                preserveLicenseComments: false,
                modules: [
                    {
                        name: "lgGitNav"
                    }
                ],
                removeCombined: false,
                wrap: true,
                findNestedDependencies: true,
                uglify: {
                    no_mangle: false
                }
            }
        },
        less: {
            options: {
                compress: true,
                ieCompat: true,
                yuicompress: true
            },
            styles: {
                files: {
                    "lgGitNav.css": ["aniimations.less" , "main.less"]
                }
            }
        },
        watch: {
            styles: {
                options: {livereload: true},
                files: [
                    "animations.less",
                    "main.less"
                ],
                tasks: ["less"]
            },
            javascript: {
                options: {livereload: true},
                files: [
                    "angular-git-navigation.js"
                ],
                tasks: ["eslint"]
            }
        },
        connect: {
            options: {
                port: 80,
                protocol: "http",
                hostname: "lgGitNav.leog.me",
                base: "/",
                livereload: true
            }
        },
        open: {
            local: {
                path: "http://lgGitNav.leog.me"
            }
        },
        clean: {
        }
    });

    grunt.registerTask('server', function (target) {
        return grunt.task.run([
            'eslint',
            'less:styles',
            'connect',
            'open:local',
            'watch'
        ]);
    });

    grunt.registerTask('build', function (target, local) {
        return grunt.task.run([
            'eslint',
            'clean',
            'less:styles',
            'requirejs',
            'copy'
        ]);
    });
};