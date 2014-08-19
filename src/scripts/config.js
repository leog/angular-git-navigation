require(["angular-git-navigation"], function(dep) {
    angular.module("myApp", [dep.moduleName]);
    angular.bootstrap(document, ["myApp"]);
});
