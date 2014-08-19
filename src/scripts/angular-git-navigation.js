define([
    "../../bower_components/require-css/css!../styles/animations",
    "../../bower_components/require-css/css!../styles/main"
], function() {
    var settings = {moduleName:"githubRepoNavigation"};
    angular
        .module(settings.moduleName, ["ngAnimate", "ngRoute"])
        .directive("githubrepo", ['github', function(github) {
            return {
                restrict: "E",
                scope: {
                    user: "@",
                    repo: "@"
                },
                controller: ['$scope', function($scope) {
                    github.setUser($scope.user);
                    github.setRepo($scope.repo);
                }],
                template: "<div class='view-container'><ul class='breadcrumbs'><li><a target='_blank' ng-href='{{$root.getGitUrl()}}'>{{user}}</a></li><li ng-switch='$root.breadcrumbs.length > 0'><a href='' ng-click='$root.prev({path: \"/\"}, -1)' ng-switch-when='true'>{{repo}}</a><span ng-switch-when='false'>{{repo}}</span></li><li ng-repeat='breadcrumb in $root.breadcrumbs' ng-switch='$last'><span ng-switch-when='true'>{{breadcrumb.name}}</span><a ng-switch-when='false' href='' ng-click='$root.prev(breadcrumb, $index)'>{{breadcrumb.name}}</a></li></ul><div class='view-animation' ng-class='{ to_left: $root.dir === false, to_right: $root.dir === true }' ng-view></div></div>"
            };
        }])
        .directive("content", ['$location', '$rootScope', function($location, $rootScope) {
            return {
                require: "^githubRepo",
                template: "<ul><li ng-repeat='item in items' ng-switch='item.type'><a href='' ng-switch-when='dir' ng-click='next(item)'>{{item.name}}</a><span ng-switch-when='file'>{{item.name}}</span></li></ul>",
                restrict: "E",
                controller: ['$scope', function($scope) {
                    $scope.next = function(item) {
                        $rootScope.dir = false;
                        $rootScope.breadcrumbs.push(item);
                        $location.path(item.path);
                    };
                }]
            };
        }])
        .service("github", ['$http', '$rootScope', '$interpolate', function($http, $rootScope, $interpolate) {
            var user, repo, path,
                apiUrl = "https://api.github.com/repos/{{u}}/{{r}}/contents/{{p}}",
                gitUrl = "https://github.com/{{u}}/{{r}}";

            $rootScope.getGitUrl = function(includeRepo) {
                var obj = {u: user};
                obj = includeRepo ? angular.extend(obj, {r: repo}) : obj;
                return $interpolate(gitUrl)(obj);
            };

            return {
                setRepo: function(theRepo) {
                    repo = theRepo;
                },
                setUser: function(theUser) {
                    user = theUser;
                },
                setPath: function(thePath) {
                    path = thePath;
                },
                getUser: function() {
                    return user;
                },
                getRepo: function() {
                    return repo;
                },
                getApiUrl: function() {
                    return $interpolate(apiUrl)({u:user, r: repo, p: path});
                },
                fetchData: function() {
                    return $http.get(this.getApiUrl()).then(function success(response) {
                        return response.data;
                    });
                }
            };
        }])
        .config(['$routeProvider', function($routeProvider) {
            $routeProvider.when("/", {
                template : "<content></content>",
                controller: "githubRepoNavigationCtrl",
                resolve: {
                    data: ['github', '$route', function(github, $route) {
                        github.setPath($route.current.params.path);
                        return github.fetchData();
                    }]
                }
            });
            $routeProvider.when("/:path*", {
                template : "<content></content>",
                controller: "githubRepoNavigationCtrl",
                resolve: {
                    data: ['github', '$route', function(github, $route) {
                        github.setPath($route.current.params.path);
                        return github.fetchData();
                    }]
                }
            });
        }])
        .controller("githubRepoNavigationCtrl", ['$scope', 'data', function($scope, data) {
            $scope.items = data;
        }])
        .run(['$rootScope', '$location', function($rootScope, $location) {
            $rootScope.dir = undefined;
            $rootScope.breadcrumbs = [];
            $rootScope.prev = function(item, index) {
                $rootScope.dir = true;
                $rootScope.breadcrumbs.splice(index + 1);
                $location.path(item.path);
            };
            $rootScope.$on("$locationChangeStart", function(event, next, current) {
                if(next.length < current.length && $rootScope.dir !== undefined) {
                    $rootScope.dir = true;
                } else if(next.length > current.length  && $rootScope.dir !== undefined) {
                    $rootScope.dir = false;
                }
            });
        }]);
    return settings;
});
