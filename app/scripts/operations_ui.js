// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(){
    'use strict';

    angularDragula(angular);

    var app = angular.module('operations-ui', [
        'ngRoute',
        'ngCookies',
        'templates',
        'PluginSystem',
        'plugins',
        'pascalprecht.translate',
        'ngSanitize',
        'angular-flot',
        'ui.bootstrap',
        'ui.bootstrap.dropdown',
        'ui.bootstrap.tooltip',
        'helpers',
        'ngFileSaver',
        'angular.filter',
        'dragula']);
    app
    .constant('loginPath', '/login')
        .config([
          '$routeProvider',
          'loginPath',
        function (
          $routeProvider,
          loginPath
        ) {
            $routeProvider
                .when('/', {
                    templateUrl: 'main.html',
                    controller: 'MainController'
                })
                .when(loginPath, {
                    templateUrl: "login.html",
                    controller: "AuthenticationController"
                })
                .otherwise({
                    redirectTo: '/'
                });
        }])
        .factory('LoadFromDom', ['$q', '$http', function ($q, $http) {
            var locales = angular.element('script[type="application/json"]').toArray().reduce(function(prev, curr) {
              if(curr) {
                prev[curr.attributes.name.value] = JSON.parse(curr.innerHTML);
              }
              return prev;
            }, {});
            return function (options) {
                var deferred = $q.defer();
                var data;

                var match = new RegExp(".*\/" + options.key + "\/.*");

                angular.forEach(locales, function(value, key) {
                  if(match.exec(key)) {
                    data = $.extend(data, value);
                  }
                });

                deferred.resolve(data);

                return deferred.promise;
            };
        }])
        .config(['$translateProvider', '$translatePartialLoaderProvider', function ($translateProvider, $translatePartialLoaderProvider){
            $translatePartialLoaderProvider.addPart('common');
            $translatePartialLoaderProvider.addPart('branding');
            //$translatePartialLoaderProvider.addPart('buttons');//example, this would add buttons.json from locales/{lang} folder
            if(angular.element('script[type="application/json"]').get(0)) {
              $translateProvider.useLoader('LoadFromDom');
            } else {
              $translateProvider.useLoader('$translatePartialLoader', {
                  urlTemplate: '/locales/{lang}/{part}.json'
              });
            }

            $translateProvider.registerAvailableLanguageKeys(window.enabledLocales,{
                'en_US': 'en',
                'en_UK': 'en'
            });
            $translateProvider.determinePreferredLanguage();
            $translateProvider.fallbackLanguage('en');
            //to prevent XSS attacks escape interpolation paramaters.
            $translateProvider.useSanitizeValueStrategy('escapeParameters');
        }])
        .config(['$httpProvider', function($httpProvider) {
            //Enable cross domain calls
            $httpProvider.defaults.useXDomain = true;
        }]).run(['loadConfig', function(loadConfig) {
            loadConfig();
        }])
        .run([
          "$rootScope",
          "$location",
          "isUndefined",
          "updateAuthCookie",
          "$route",
          "log",
          "$http",
          "$cookieStore",
          'loginPath',
          'logout',
          '$translate',
          'pluginNavigation',
          'hideActiveMastheadPopover',
        function(
          $rootScope,
          $location,
          isUndefined,
          updateAuthCookie,
          $route,
          log,
          $http,
          $cookieStore,
          loginPath,
          logout,
          $translate,
          pluginNavigation,
          hideActiveMastheadPopover
        ) {

            //recursively go through menu navigation array
            $rootScope.getTitleKey = function(navs, toPath, key) {
                var retKey;
                for (var idx in navs) {
                    var nav = navs[idx];
                    //at the level we want
                    if (nav.path !== undefined) {
                        //path is like /compute_nodes, pluginName is like compute
                        var tempPath = nav.pluginName + nav.path;
                        if (tempPath === toPath) {
                            return nav[key];
                        }
                    }// have chidren
                    else {
                        var children = nav.children;
                        retKey = $rootScope.getTitleKey (children, toPath, key);
                        if (retKey !== undefined ){
                            return retKey;
                        }
                    }
                }
                return retKey; //not getting anything
            };

            $rootScope.$on("$routeChangeStart", function (event, current, previous) {

                // update the auth settings from the cookie (for page refresh)
                updateAuthCookie();
                if (isUndefined($rootScope.auth_token) &&
                    angular.isDefined(current) &&
                    angular.isDefined(current.$$route) &&
                    current.$$route.controller !== 'AuthenticationController')
                {
                    // not logged in so redirect to /login
                    var oldPath = $location.$$path;
                    var oldSearch = $location.$$search;
                    var redirect = $location.path(loginPath);

                    if(oldPath !== "/" && oldPath !== loginPath && !$location.$$search.redirect) {
                      //redirect after login if we are somewhere
                      redirect.search($.extend(oldSearch, {redirect: oldPath}));
                    }
                }

                //update title
                var navs = pluginNavigation.nav;
                var toPath = current.$$route.originalPath; //like /compute/compute_nodes
                if (toPath != '/') {
                    $rootScope.pageTitle = $rootScope.getTitleKey(navs, toPath.substr(1), 'title') || $rootScope.getTitleKey(navs, toPath.substr(1), 'label');
                }

                if ($rootScope.pageTitle === undefined) {
                    $rootScope.pageTitle = 'branding.pageTitle.title';
                }
                $translate($rootScope.pageTitle).then(function (translation) {
                    document.title = translation;
                });

                //hide active masthead popover when change the page
                if ($rootScope.activeMastheadPopover !== undefined) {
                    hideActiveMastheadPopover();
                }
            });


            $rootScope.notification = {
                message_queue: [],
                message_stats: {"new": 0},
                current_index: 0
            };
            $rootScope.notification_message = null;

            if(window.master_error) {
                $rootScope.master_error = window.master_error;
            }

            $rootScope.is_login_screen = function() {
              return $location.$$path === loginPath && !$rootScope.master_error;
            };

            var patchingInProgress = false;
            $rootScope.$on('PatchUpdateStarted', function() {
              patchingInProgress = true;
              window.patchingInProgress = true;
            });

            if(window.requestAnimationFrame) {
              var startTime = null,
                duration = 1000;
              (function animationLoop(){
                var now = new Date().getTime();

                if (startTime === null || (now - startTime) >= duration) {
                  startTime = now;
                  updateAuthCookie();
                  if(!$rootScope.auth_token && $location.$$path !== loginPath &&
                      !patchingInProgress) {
                    $rootScope.$apply(function() {
                      $location.path(loginPath);
                    });
                  }
                }
                (window.requestAnimationFrame || angular.noop)(animationLoop);
              })();
            }
    }]);

})();
