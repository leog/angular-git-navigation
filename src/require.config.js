require.config({
    "paths": {
        "angular": "../bower_components/angular/angular",
        "angular-route": "../bower_components/angular-route/angular-route",
        "angular-animate": "../bower_components/angular-animate/angular-animate"
    },
    "shim": {
        "angular": {
            "exports": "angular"
        },
        "angular-route": {
            "deps": ["angular"]
        },
        "angular-animate": {
            "deps": ["angular"]
        }
    },
    'map': {
        '*': {
            'css': '../bower_components/require-css/css'
        }
    }
});
