(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
//Allow using this built library as an AMD module
//in another project. That other project will only
//see this AMD call, not the internal modules in
//the closure below.
        define([], factory);
    } else {
//Browser globals case. Just assign the
//result to a property on the global.
        root.ngGitNav = factory();
    }
}(this, function () {
//almond, and your modules will be inlined here
/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../../bower_components/almond/almond", function(){});

/*
 * css.normalize.js
 *
 * CSS Normalization
 *
 * CSS paths are normalized based on an optional basePath and the RequireJS config
 *
 * Usage:
 *   normalize(css, fromBasePath, toBasePath);
 *
 * css: the stylesheet content to normalize
 * fromBasePath: the absolute base path of the css relative to any root (but without ../ backtracking)
 * toBasePath: the absolute new base path of the css relative to the same root
 * 
 * Absolute dependencies are left untouched.
 *
 * Urls in the CSS are picked up by regular expressions.
 * These will catch all statements of the form:
 *
 * url(*)
 * url('*')
 * url("*")
 * 
 * @import '*'
 * @import "*"
 *
 * (and so also @import url(*) variations)
 *
 * For urls needing normalization
 *
 */

define('../../bower_components/require-css/./normalize',[],function() {
  
  // regular expression for removing double slashes
  // eg http://www.example.com//my///url/here -> http://www.example.com/my/url/here
  var slashes = /([^:])\/+/g
  var removeDoubleSlashes = function(uri) {
    return uri.replace(slashes, '$1/');
  }

  // given a relative URI, and two absolute base URIs, convert it from one base to another
  var protocolRegEx = /[^\:\/]*:\/\/([^\/])*/;
  var absUrlRegEx = /^(\/|data:)/;
  function convertURIBase(uri, fromBase, toBase) {
    if (uri.match(absUrlRegEx) || uri.match(protocolRegEx))
      return uri;
    uri = removeDoubleSlashes(uri);
    // if toBase specifies a protocol path, ensure this is the same protocol as fromBase, if not
    // use absolute path at fromBase
    var toBaseProtocol = toBase.match(protocolRegEx);
    var fromBaseProtocol = fromBase.match(protocolRegEx);
    if (fromBaseProtocol && (!toBaseProtocol || toBaseProtocol[1] != fromBaseProtocol[1] || toBaseProtocol[2] != fromBaseProtocol[2]))
      return absoluteURI(uri, fromBase);
    
    else {
      return relativeURI(absoluteURI(uri, fromBase), toBase);
    }
  };
  
  // given a relative URI, calculate the absolute URI
  function absoluteURI(uri, base) {
    if (uri.substr(0, 2) == './')
      uri = uri.substr(2);

    // absolute urls are left in tact
    if (uri.match(absUrlRegEx) || uri.match(protocolRegEx))
      return uri;
    
    var baseParts = base.split('/');
    var uriParts = uri.split('/');
    
    baseParts.pop();
    
    while (curPart = uriParts.shift())
      if (curPart == '..')
        baseParts.pop();
      else
        baseParts.push(curPart);
    
    return baseParts.join('/');
  };


  // given an absolute URI, calculate the relative URI
  function relativeURI(uri, base) {
    
    // reduce base and uri strings to just their difference string
    var baseParts = base.split('/');
    baseParts.pop();
    base = baseParts.join('/') + '/';
    i = 0;
    while (base.substr(i, 1) == uri.substr(i, 1))
      i++;
    while (base.substr(i, 1) != '/')
      i--;
    base = base.substr(i + 1);
    uri = uri.substr(i + 1);

    // each base folder difference is thus a backtrack
    baseParts = base.split('/');
    var uriParts = uri.split('/');
    out = '';
    while (baseParts.shift())
      out += '../';
    
    // finally add uri parts
    while (curPart = uriParts.shift())
      out += curPart + '/';
    
    return out.substr(0, out.length - 1);
  };
  
  var normalizeCSS = function(source, fromBase, toBase) {

    fromBase = removeDoubleSlashes(fromBase);
    toBase = removeDoubleSlashes(toBase);

    var urlRegEx = /@import\s*("([^"]*)"|'([^']*)')|url\s*\((?!#)\s*(\s*"([^"]*)"|'([^']*)'|[^\)]*\s*)\s*\)/ig;
    var result, url, source;

    while (result = urlRegEx.exec(source)) {
      url = result[3] || result[2] || result[5] || result[6] || result[4];
      var newUrl;
      newUrl = convertURIBase(url, fromBase, toBase);
      var quoteLen = result[5] || result[6] ? 1 : 0;
      source = source.substr(0, urlRegEx.lastIndex - url.length - quoteLen - 1) + newUrl + source.substr(urlRegEx.lastIndex - quoteLen - 1);
      urlRegEx.lastIndex = urlRegEx.lastIndex + (newUrl.length - url.length);
    }
    
    return source;
  };
  
  normalizeCSS.convertURIBase = convertURIBase;
  normalizeCSS.absoluteURI = absoluteURI;
  normalizeCSS.relativeURI = relativeURI;
  
  return normalizeCSS;
});
;
/*
 * Require-CSS RequireJS css! loader plugin
 * 0.1.2
 * Guy Bedford 2013
 * MIT
 */

/*
 *
 * Usage:
 *  require(['css!./mycssFile']);
 *
 * Tested and working in (up to latest versions as of March 2013):
 * Android
 * iOS 6
 * IE 6 - 10
 * Chome 3 - 26
 * Firefox 3.5 - 19
 * Opera 10 - 12
 * 
 * browserling.com used for virtual testing environment
 *
 * Credit to B Cavalier & J Hann for the IE 6 - 9 method,
 * refined with help from Martin Cermak
 * 
 * Sources that helped along the way:
 * - https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent
 * - http://www.phpied.com/when-is-a-stylesheet-really-loaded/
 * - https://github.com/cujojs/curl/blob/master/src/curl/plugin/css.js
 *
 */

define('../../bower_components/require-css/css',[],function() {
  if (typeof window == 'undefined')
    return { load: function(n, r, load){ load() } };

  var head = document.getElementsByTagName('head')[0];

  var engine = window.navigator.userAgent.match(/Trident\/([^ ;]*)|AppleWebKit\/([^ ;]*)|Opera\/([^ ;]*)|rv\:([^ ;]*)(.*?)Gecko\/([^ ;]*)|MSIE\s([^ ;]*)/) || 0;

  // use <style> @import load method (IE < 9, Firefox < 18)
  var useImportLoad = false;
  
  // set to false for explicit <link> load checking when onload doesn't work perfectly (webkit)
  var useOnload = true;

  // trident / msie
  if (engine[1] || engine[7])
    useImportLoad = parseInt(engine[1]) < 6 || parseInt(engine[7]) <= 9;
  // webkit
  else if (engine[2])
    useOnload = false;
  // gecko
  else if (engine[4])
    useImportLoad = parseInt(engine[4]) < 18;
  
  //main api object
  var cssAPI = {};

  cssAPI.pluginBuilder = './css-builder';

  // <style> @import load method
  var curStyle, curSheet;
  var createStyle = function () {
    curStyle = document.createElement('style');
    head.appendChild(curStyle);
    curSheet = curStyle.styleSheet || curStyle.sheet;
  }
  var ieCnt = 0;
  var ieLoads = [];
  var ieCurCallback;
  
  var createIeLoad = function(url) {
    ieCnt++;
    if (ieCnt == 32) {
      createStyle();
      ieCnt = 0;
    }
    curSheet.addImport(url);
    curStyle.onload = function(){ processIeLoad() };
  }
  var processIeLoad = function() {
    ieCurCallback();
 
    var nextLoad = ieLoads.shift();
 
    if (!nextLoad) {
      ieCurCallback = null;
      return;
    }
 
    ieCurCallback = nextLoad[1];
    createIeLoad(nextLoad[0]);
  }
  var importLoad = function(url, callback) {
    if (!curSheet || !curSheet.addImport)
      createStyle();

    if (curSheet && curSheet.addImport) {
      // old IE
      if (ieCurCallback) {
        ieLoads.push([url, callback]);
      }
      else {
        createIeLoad(url);
        ieCurCallback = callback;
      }
    }
    else {
      // old Firefox
      curStyle.textContent = '@import "' + url + '";';

      var loadInterval = setInterval(function() {
        try {
          curStyle.sheet.cssRules;
          clearInterval(loadInterval);
          callback();
        } catch(e) {}
      }, 10);
    }
  }

  // <link> load method
  var linkLoad = function(url, callback) {
    var link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    if (useOnload)
      link.onload = function() {
        link.onload = function() {};
        // for style dimensions queries, a short delay can still be necessary
        setTimeout(callback, 7);
      }
    else
      var loadInterval = setInterval(function() {
        for (var i = 0; i < document.styleSheets.length; i++) {
          var sheet = document.styleSheets[i];
          if (sheet.href == link.href) {
            clearInterval(loadInterval);
            return callback();
          }
        }
      }, 10);
    link.href = url;
    head.appendChild(link);
  }

  cssAPI.normalize = function(name, normalize) {
    if (name.substr(name.length - 4, 4) == '.css')
      name = name.substr(0, name.length - 4);

    return normalize(name);
  }

  cssAPI.load = function(cssId, req, load, config) {

    (useImportLoad ? importLoad : linkLoad)((useImportLoad ? req.toUrl(cssId) : cssId) + '.css', load);

  }

  return cssAPI;
});

define('../../bower_components/require-css/css!../styles/animations',[],function(){});
define('../../bower_components/require-css/css!../styles/main',[],function(){});
/** @license
 * RequireJS Image Plugin
 * Author: Miller Medeiros
 * Version: 0.2.2 (2013/02/08)
 * Released under the MIT license
 */
define('../../bower_components/requirejs-plugins/src/image',[],function(){

    var CACHE_BUST_QUERY_PARAM = 'bust',
        CACHE_BUST_FLAG = '!bust',
        RELATIVE_FLAG = '!rel';

    function noop(){}

    function cacheBust(url){
        url = url.replace(CACHE_BUST_FLAG, '');
        url += (url.indexOf('?') < 0)? '?' : '&';
        return url + CACHE_BUST_QUERY_PARAM +'='+ Math.round(2147483647 * Math.random());
    }

    return {
        load : function(name, req, onLoad, config){
            var img;
            if(config.isBuild){
                onLoad(null); //avoid errors on the optimizer since it can't inline image files
            }else{
                img = new Image();
                img.onerror = function (err) {
                    onLoad.error(err);
                };
                img.onload = function(evt){
                    onLoad(img);
                    try {
                        delete img.onload; //release memory - suggested by John Hann
                    } catch(err) {
                        img.onload = noop; // IE7 :(
                    }
                };
                if (name.indexOf(RELATIVE_FLAG) !== -1) {
                    //load image relative to module path / baseUrl
                    img.src = req.toUrl( name.replace(RELATIVE_FLAG, '') );
                } else {
                    img.src = name;
                }
            }
        },
        normalize : function (name, normalize) {
            //used normalize to avoid caching references to a "cache busted" request
            return (name.indexOf(CACHE_BUST_FLAG) === -1)? name : cacheBust(name);
        }
    };

});

define('ngGitNav',[
    "../../bower_components/require-css/css!../styles/animations",
    "../../bower_components/require-css/css!../styles/main",
    "../../bower_components/require-css/css!http://cdnjs.cloudflare.com/ajax/libs/octicons/2.0.2/octicons",
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
                template: "<div class='view-container'><ul class='breadcrumbs'><li><a target='_blank' ng-href='{{getGitUrl()}}'>{{user}}</a></li><li ng-switch='$root.breadcrumbs.length > 0' ng-class='{ last: $root.breadcrumbs.length == 0 }'><a href='' ng-click='prev({path: \"/\"}, -1)' ng-switch-when='true'>{{repo}}</a><span ng-switch-when='false'>{{repo}}</span></li><li ng-repeat='breadcrumb in $root.breadcrumbs' ng-switch='$last' ng-class='{ last: $last }'><span ng-switch-when='true'>{{breadcrumb.name}}</span><a ng-switch-when='false' href='' ng-click='prev(breadcrumb, $index)'>{{breadcrumb.name}}</a></li></ul><div class='view-animation' ng-class='{ to_left: $root.dir === false, to_right: $root.dir === true }' ui-view></div></div>"
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
                controller: ["$scope", "data", function($scope, data) {
                    $scope.items = data;
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
        }]);
    return settings;
});

(function(c){var d=document,a='appendChild',i='styleSheet',s=d.createElement('style');s.type='text/css';d.getElementsByTagName('head')[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));})
('github-nav .view-container {\n  height: 500px;\n  position: relative;\n  overflow: hidden;\n}\ngithub-nav .view-animation {\n  top: 30px;\n  position: absolute;\n  width: 100%;\n}\ngithub-nav .view-animation.ng-enter.to_right {\n  -moz-animation: enter_animation_right 1s;\n  -webkit-animation: enter_animation_right 1s;\n  animation: enter_animation_right 1s;\n  top: 30px;\n  left: -100%;\n}\ngithub-nav .view-animation.ng-enter.to_left {\n  -moz-animation: enter_animation_left 1s;\n  -webkit-animation: enter_animation_left 1s;\n  animation: enter_animation_left 1s;\n  top: 30px;\n  left: 100%;\n}\ngithub-nav .view-animation.ng-leave.to_right {\n  -moz-animation: enter_animation_right 1s;\n  -webkit-animation: leave_animation_right 1s;\n  animation: leave_animation_right 1s;\n  top: 30px;\n  left: 0;\n}\ngithub-nav .view-animation.ng-leave.to_left {\n  -moz-animation: leave_animation_left 1s;\n  -webkit-animation: leave_animation_left 1s;\n  animation: leave_animation_left 1s;\n  top: 30px;\n  left: 0;\n}\n@keyframes enter_animation_right {\n  from {\n    left: -100%;\n  }\n  to {\n    left: 0;\n  }\n}\n@-webkit-keyframes enter_animation_right {\n  from {\n    left: -100%;\n  }\n  to {\n    left: 0;\n  }\n}\n@keyframes leave_animation_right {\n  from {\n    left: 0;\n  }\n  to {\n    left: 100%;\n  }\n}\n@-webkit-keyframes leave_animation_right {\n  from {\n    left: 0;\n  }\n  to {\n    left: 100%;\n  }\n}\n@keyframes enter_animation_left {\n  from {\n    left: 100%;\n  }\n  to {\n    left: 0;\n  }\n}\n@-webkit-keyframes enter_animation_left {\n  from {\n    left: 100%;\n  }\n  to {\n    left: 0;\n  }\n}\n@keyframes leave_animation_left {\n  from {\n    left: 0;\n  }\n  to {\n    left: -100%;\n  }\n}\n@-webkit-keyframes leave_animation_left {\n  from {\n    left: 0;\n  }\n  to {\n    left: -100%;\n  }\n}\ngithub-nav {\n  font: 13px Helvetica, arial, freesans, clean, sans-serif, \"Segoe UI Emoji\", \"Segoe UI Symbol\";\n  line-height: 1.4;\n}\ngithub-nav .view-animation {\n  background-color: #f8f8f8;\n}\ngithub-nav * {\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\ngithub-nav a {\n  color: #4183c4;\n  text-decoration: none;\n}\ngithub-nav a:hover,\ngithub-nav a:focus,\ngithub-nav a:active {\n  text-decoration: underline;\n}\ngithub-nav ul {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\ngithub-nav ul.files {\n  border: 1px solid #ddd;\n  border-radius: 3px;\n}\ngithub-nav ul.files li {\n  padding-left: 10px;\n  border-bottom: 1px solid #eee;\n  height: 33px;\n  line-height: 33px;\n}\ngithub-nav ul.files li span.icon.octicon {\n  margin-right: 5px;\n}\ngithub-nav ul.files li span.icon.octicon.octicon-file-text {\n  color: #777;\n}\ngithub-nav ul.files li span.icon.octicon.octicon-file-directory {\n  color: #80a6cd;\n}\ngithub-nav ul.files li span.icon.loading {\n  background-image: url(\"//assets-cdn.github.com/images/spinners/octocat-spinner-32-EAF2F5.gif\");\n  background-repeat: no-repeat;\n  background-size: 16px;\n  width: 16px;\n  height: 16px;\n  display: inline-block;\n  margin-right: 3px;\n  position: relative;\n  top: 3px;\n  left: -2px;\n}\ngithub-nav ul.files li.last {\n  border-bottom: none;\n}\ngithub-nav ul.breadcrumbs li {\n  float: left;\n  color: #4183c4;\n  font-weight: bold;\n  font-size: 18px;\n}\ngithub-nav ul.breadcrumbs li:after {\n  color: #999;\n  font-weight: normal;\n  content: \'\\00a0\\002F\\00a0\';\n}\ngithub-nav ul.breadcrumbs li.last {\n  color: #000;\n}\ngithub-nav ul.breadcrumbs li.last:after {\n  content: \'\';\n}\n');
//The modules for your project will be inlined above
//this snippet. Ask almond to synchronously require the
//module value for 'main' here and return it as the
//value to use for the public API for the built file.
return require('ngGitNav');
}));