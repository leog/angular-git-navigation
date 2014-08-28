define([
    "../../bower_components/require-css/css!../styles/animations",
    "../../bower_components/require-css/css!../styles/main",
    "../../bower_components/require-css/css!../styles/octicons",
    "../../bower_components/requirejs-plugins/src/image!//assets-cdn.github.com/images/spinners/octocat-spinner-32-EAF2F5.gif"
], function() {
    var settings = {epsilonName:"ngGitNav"};
    angular
        .module(settings.epsilonName, ["ngAnimate", "ui.router"])
        .directive("githubNav", function() {
            return {
                restrict: "E",
                scope: {
                    user: "@",
                    repo: "@"
                },
                controller: ["$scope", "$state", "$rootScope", "github", function($scope, $state, $rootScope, github) {
                    github.setUser($scope.user);
                    github.setRepo($scope.repo);
                    $scope.getGitUrl = github.getGitUrl;
                    $scope.prev = function(item, index) {
                        $rootScope.dir = true;
                        item.clicked = true;
                        $rootScope.breadcrumbs.splice(index + 1);
                        $state.transitionTo("main", {path: item.path}, {reload:true});
                    };
                    $state.go("main");
                }],
                template: "<div class='view-container' ng-style='$root.containerStyle'><ul class='breadcrumbs'><li><a target='_blank' ng-href='{{getGitUrl()}}'>{{user}}</a></li><li ng-switch='$root.breadcrumbs.length > 0' ng-class='{ last: $root.breadcrumbs.length == 0 }'><a href='' ng-click='prev({path: \"/\"}, -1)' ng-switch-when='true'>{{repo}}</a><span ng-switch-when='false'>{{repo}}</span></li><li ng-repeat='breadcrumb in $root.breadcrumbs' ng-switch='$last' ng-class='{ last: $last }'><span ng-switch-when='true'>{{breadcrumb.name}}</span><a ng-switch-when='false' href='' ng-click='prev(breadcrumb, $index)'>{{breadcrumb.name}}</a></li></ul><div class='view-animation' ng-class='{ to_left: $root.dir === false, to_right: $root.dir === true }' ui-view></div></div>"
            };
        })
        .directive("githubrepoContent", function() {
            return {
                template: "<ul class= 'files'><li ng-repeat='item in items | orderBy:[\"type\", \"name\"]' ng-switch='item.type' ng-class='{ last: $last }'><span class='icon' ng-class='{ \"octicon octicon-file-text\": item.type == \"file\" && !item.clicked, \"octicon octicon-file-directory\": item.type == \"dir\" && !item.clicked, loading: item.clicked}'></span><a href='' ng-switch-when='dir' ng-click='next(item)'>{{item.name}}</a><span ng-switch-when='file'>{{item.name}}</span></li></ul>",
                restrict: "E",
                controller: ["$scope", "$state", "$rootScope", function($scope, $state, $rootScope) {
                    $scope.next = function(item) {
                        $rootScope.dir = false;
                        item.clicked = true;
                        $rootScope.breadcrumbs.push(item);
                        $state.transitionTo("main", {path: item.path}, {reload:true});
                    };
                }]
            };
        })
        .service("github", ["$http", "$rootScope", "$interpolate", function($http, $rootScope, $interpolate) {
            var user, repo, path,
                apiUrl = "https://api.github.com/repos/{{u}}/{{r}}/contents/{{p}}",
                gitUrl = "https://github.com/{{u}}/{{r}}";

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
                getGitUrl: function(includeRepo) {
                    var obj = {u: user};
                    obj = includeRepo ? angular.extend(obj, {r: repo}) : obj;
                    return $interpolate(gitUrl)(obj);
                },
                fetchData: function() {
                    return $http.get(this.getApiUrl()).then(function success(response) {
                        return response.data;
                    });
                }
            };
        }])
        .config(["$stateProvider", function($stateProvider) {
            $stateProvider.state("main", {
                template : "<githubrepo-content></githubrepo-content>",
                params: ["path"],
                controller: ["$scope", "$rootScope", "data", function($scope, $rootScope, data) {
                    $scope.items = data;
                    $rootScope.containerStyle = { height: data.length * 33 + 33 + 'px' };
                }],
                resolve: {
                    data: ["github", "$stateParams", function(github, $stateParams) {
                        github.setPath($stateParams.path);
                        return github.fetchData();
                    }]
                }
            });
        }])
        .run(["$rootScope", function($rootScope) {
            $rootScope.dir = undefined;
            $rootScope.breadcrumbs = [];
            $rootScope.containerStyle = {};
        }]);
    return settings;
});
