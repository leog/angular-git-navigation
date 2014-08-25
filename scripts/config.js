require(["ngGitNav"], function(ngGitNav) {
    angular.module("ngGitNavApp", [ngGitNav.epsilonName]);
    angular.bootstrap(document, ["ngGitNavApp"]);
});
