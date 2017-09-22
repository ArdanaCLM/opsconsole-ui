// (c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP
// (c) Copyright 2017 SUSE LLC
(function(ng) {
	'use strict';
	var ps = ng.module('PluginSystem', ['helpers']),
		pluginBaseName = 'pluginBase';

	ng.module('plugins', ['PluginSystem', 'pascalprecht.translate', 'helpers'])
		.config(['$routeProvider', 'isUndefined', function($routeProvider, isUndefined) {

			//we only want to map routes for plugins that are not a group,
			//groups do not require a route
			var plugins = ng.injector(['PluginSystem']).get('pluginRoutes');
			var pluginFn = function(plugin) {
				return {
					pluginType : function() {
						return plugin.controllerParams;
					}
				};

			};
			for(var ii = 0; ii < plugins.length; ii++) {
				$routeProvider.when(plugins[ii].path, {
					controller: plugins[ii].controllerName,
					templateUrl: plugins[ii].pluginName + "/templates/" + plugins[ii].template,
					resolve: pluginFn(plugins[ii])
				});
			}
		}])
		.config(['$translatePartialLoaderProvider', function($translatePartialLoaderProvider) {
			var pluginNames = ng.injector(['PluginSystem']).get('pluginNames');
			pluginNames.forEach(function(pluginName) {
				$translatePartialLoaderProvider.addPart(pluginName);
			});
		}])
		.constant(pluginBaseName, {});

	ps.factory('isPlugin', ['isUndefined', function(isUndefined) {
		return function(provider) {
			var functionParamaters = [];
			if (typeof provider === "function") {
				//is not annotated function
				//function -> toString -> grabParamaters -> removeWhitespace -> splitOnComma : else undefined
				var functionParamatersString,
					functionParamatersStringNoSpace,
					functionAsString = provider.toString(),
					getParamatersRegex = /function(?:\s+[^\s]+\s*|\s*)?\(((?:[^,\s]+(?:,\s*)?)*)?\)\s*{/;
			functionParamaters = !isUndefined(functionAsString) ?
				!isUndefined(functionParamatersString = functionAsString.match(getParamatersRegex)[1]) ?
					!isUndefined(functionParamatersStringNoSpace = functionParamatersString.replace(/\s/, '')) ?
						functionParamatersStringNoSpace.split(',') : void 0 : void 0 : void 0;
			} else if (typeof provider === "object" && !isUndefined(provider.forEach)) {
				//is annotated function get the requirements
			functionParamaters = provider.slice(0,-1);
			} else {
				return false;
			}
			for (var ii = 0; ii < functionParamaters.length; ii++) {
				if (functionParamaters[ii] === pluginBaseName) {
					return true;
				}
			}
			return false;
		};
	}]);

	ps.factory('allModules', ['isUndefined', function(isUndefined) {
		var pluginModules;
		//attempt to get the submodules from the plugins module else return undefined
		return !isUndefined(pluginModules = ng.module('plugins')) ? pluginModules._invokeQueue : void 0;
	}]);

	ps.factory('plugins', [
		'isPlugin', 'allModules', function(isPlugin, allModules) {
			return allModules.filter(function(module) {
				//is registering a factory
				if (module[0] === "$provide" && module[1] === "factory") {
					return isPlugin(module[2][1]);
				} else {
					return false;
				}
			}).map(function(plugin) {
				//may be brittle if plugin factories have more than one dependancies.
				return {
					pluginName: plugin[2][0],
					navigation: plugin[2][1][1]()
				};
			});
		}
	]);

	ps.factory('pluginRoutes', [
		'plugins',
		'pluginRecursiveWalk',
		function(plugins, pluginRecursiveWalk) {
			var routes = [];
			plugins.forEach(function(plugin) {
				pluginRecursiveWalk(plugin.navigation, function(pluginItem) {
					if(pluginItem.type === 'controller') {
						var newRoute = $.extend({pluginName: plugin.pluginName}, pluginItem);
						newRoute.path = "/" + plugin.pluginName + newRoute.path;
						routes.push(newRoute);
					}
				});
			});
			return routes;
		}
	]);

	ps.factory('pluginRecursiveWalk', ['isUndefined', function(isUndefined) {
		var walk = function(callback) {
			var recursiveWalk = function(pluginItem) {
				var newPLuginItem;
				if(!isUndefined(pluginItem.children)) {
					newPLuginItem = $.extend({}, pluginItem);
					newPLuginItem.children = newPLuginItem.children.map(recursiveWalk);
					newPLuginItem = callback(newPLuginItem);
				} else {
					newPLuginItem = callback(pluginItem);
				}
				return newPLuginItem;
			};
			return recursiveWalk;
		};
		return function(pluginItems, callback) {
			return pluginItems.map(walk(callback));
		};
	}]);

	ps.service('pluginNavigation', [
		'$translate',
		'$location',
		'$rootScope',
		'plugins',
		'isUndefined',
		'pluginRecursiveWalk',
        'bllApiRequest',
        'addNotification',
        '$q',
        'log',
        'updateAuthCookie',
        function($translate, $location, $rootScope, plugins, isUndefined,
                 pluginRecursiveWalk, bllApiRequest, addNotification, $q, log,
                 updateAuthCookie) {

            var _this = this;

            //check if at least one bllPlugin is available
            //at menu level
            //or at controller level where bllPluginsOrOp is true
            var atLeastOnePluginIsAvailable = function (pluginItem) {
                //if run testing, always return true;
                if (window.testing) {
                    return true;
                }
                var isOneAvailable = false;
                if (angular.isDefined(pluginItem.needBllPlugins)) {
                    pluginItem.needBllPlugins.forEach(function (item) {
                        isOneAvailable =
                            isOneAvailable || (_this.available_bllplugins.indexOf(item) != -1);
                    });
                }
                else {
                    isOneAvailable = true; //don't need to check
                }
                return isOneAvailable;
            };

            //check if all the bllPlugins are available
            //mostly at controller level
            var isAllBllPluginsAvailable = function (pluginItem) {
                 //if run testing, always return true;
                if (window.testing) {
                    return true;
                }
                var isAllAvailable = true;
                if (angular.isDefined(pluginItem.needBllPlugins)) {
                    pluginItem.needBllPlugins.forEach(function (item) {
                        isAllAvailable =
                            isAllAvailable && (_this.available_bllplugins.indexOf(item) != -1);
                    });
                }
                else {
                    isAllAvailable = true; //don't need to check
                }
                return isAllAvailable;
            };

            _this.dev_mode = window.appConfig && window.appConfig.dev_mode || false;

            this.buildNav = function() {
                var menus = {}, groups = {}, controllers = {},
                    PluginConfigurationException = function(message) {
                        this.message = "Illegal configuration: " + message;
                        this.name = "PluginConfigurationException";
                    };
                plugins.map(function(plugin) {
                    var pluginName = plugin.pluginName, existingPluginNames = [];
                    if (existingPluginNames.indexOf(pluginName) == -1) {
                        existingPluginNames.push(pluginName);
                    } else {
                        throw new PluginConfigurationException("duplicate plugin named " + pluginName);
                    }
                    return pluginRecursiveWalk(plugin.navigation, function(pluginItem) {
                        var pluginItemCopy = $.extend({}, pluginItem);
                        var fullPluginPath = "/" + pluginName + pluginItem.path;
                        pluginItem.active = fullPluginPath === $location.$$path;

                        pluginItem.pluginName = pluginName;
                        return pluginItem;
                    });
                })
                    //flatten array of arrays
                    .reduce(function(previousValue, currentValue) {
                        return isUndefined(previousValue) ? [].concat(currentValue) : previousValue.concat(currentValue);
                    })
                    .filter(function(pluginItem) { //filter the menu level
                        var env = window.appConfig && window.appConfig.env;
                        return _this.dev_mode ||
                            ( (pluginItem.envs && pluginItem.envs.indexOf && pluginItem.envs.indexOf(env) !== -1) &&
                            atLeastOnePluginIsAvailable(pluginItem)
                            );
                    })
                    //loop over configurations in all plugins merging groups, menus
                    .forEach(function(pluginItem) {
                        var existingPluginItem;
                        var env = window.appConfig && window.appConfig.env;
                        if(!_this.dev_mode &&
                            (pluginItem.envs && pluginItem.envs.indexOf && pluginItem.envs.indexOf(env) === -1) &&
                            !atLeastOnePluginIsAvailable(pluginItem)) {
                            return;
                        }
                        if(pluginItem.type === 'controller') {
                            if (isUndefined(controllers[pluginItem.controllerName])) {
                                controllers[pluginItem.controllerName] = pluginItem;
                            } else {
                                throw new PluginConfigurationException("controller previously defined: " + pluginItem.controllerName);
                            }
                        } else if(pluginItem.type === 'group') { //third level in example
                            if (isUndefined(groups[pluginItem.slug])) {
                                groups[pluginItem.slug] = pluginItem;
                            } else {
                                existingPluginItem = groups[pluginItem.slug];
                                existingPluginItem.children = existingPluginItem.children.concat(pluginItem.children);
                            }
                        } else if(pluginItem.type === 'menu') {
                            if (isUndefined(menus[pluginItem.slug])) {
                                menus[pluginItem.slug] = pluginItem;
                            } else {
                                existingPluginItem = menus[pluginItem.slug];
                                pluginItem.children.forEach(function (childPluginItem) {
                                    if(!_this.dev_mode && (childPluginItem.envs && childPluginItem.envs.indexOf && childPluginItem.envs.indexOf(env) === -1)) {
                                        return;
                                    }
                                    if(childPluginItem.type === 'group') { //third level in example
                                        var previousMenuGroup;
                                        existingPluginItem.children.forEach(function (existingPluginItemChild) {
                                            if(existingPluginItemChild.slug === childPluginItem.slug) {
                                                previousMenuGroup = existingPluginItemChild;
                                            }
                                        });
                                        if(previousMenuGroup) {
                                            //need to merge a group
                                            existingPluginItem.children = existingPluginItem.children.concat(childPluginItem.children);

                                        } else {
                                            //no conflict insert
                                            existingPluginItem.children.push(childPluginItem);
                                        }
                                    } else if(childPluginItem.type === 'controller') {
                                        existingPluginItem.children.push(childPluginItem);
                                    } else {
                                        throw new PluginConfigurationException("menu items cannot have children of type " + childPluginItem.type);
                                    }
                                });
                                menus[pluginItem.slug] = existingPluginItem;
                            }
                        } else {
                            throw new PluginConfigurationException("invalid type: " + pluginItem.type);
                        }
                    });
                var items = [menus, groups, controllers], navigation = [];
                items.forEach(function(item) {
                    for(var key in item) {
                        if(item.hasOwnProperty(key)) {
                            navigation.push(item[key]);
                        }
                    }
                });
                var sorter = function (a, b) {
                    if(a === b || isUndefined(a.order) || isUndefined(b.order)) {
                        if (isUndefined(a.order) && !isUndefined(b.order)) {
                            return 9999 - b.order;
                        } else if(!isUndefined(a.order) && isUndefined(b.order)) {
                            return a.order - 9999;
                        } else {
                            return $translate.instant(a.label) < $translate.instant(b.label) ? -1 : 1;
                        }
                    } else {
                        return a.order - b.order;
                    }
                };

                //build menu navigation
                navigation = pluginRecursiveWalk(navigation, function (pluginItem) {
                    var env = window.appConfig && window.appConfig.env;

                    if (pluginItem.type === 'menu') {
                        var controllers = [], groups = [];
                        pluginItem.children.forEach(function (thisPluginItem) {
                            if(_this.dev_mode ||
                                (thisPluginItem.envs && thisPluginItem.envs.indexOf && thisPluginItem.envs.indexOf(env) !== -1)) {
                                if (thisPluginItem.type === 'controller') {
                                    //only add the controller when all the bll plugins
                                    //are available for the controller
                                    if (_this.dev_mode) {
                                        controllers.push(thisPluginItem);
                                    }
                                    else if ((!angular.isDefined(thisPluginItem.bllPluginsOrOp) ||
                                        thisPluginItem.bllPluginsOrOp === false) &&
                                        isAllBllPluginsAvailable(thisPluginItem)) {
                                        controllers.push(thisPluginItem);
                                    } // of if indicated by bllPluginsOrOp, check if at least one plugin avialble
                                    else if (angular.isDefined(thisPluginItem.bllPluginsOrOp) &&
                                          thisPluginItem.bllPluginsOrOp === true &&
                                          atLeastOnePluginIsAvailable (thisPluginItem)) {
                                        controllers.push(thisPluginItem);
                                    }
                                } else { //this is for third level in example
                                    groups.push(thisPluginItem);
                                }
                            }
                        });
                        controllers.sort(sorter);
                        groups.sort(sorter);
                        pluginItem.children = controllers.concat(groups);
                    } else if (pluginItem.type === 'group') {
                        pluginItem.children.sort(sorter);
                    }
                    return pluginItem;
                });

                //remove menu item when there is no controller
                navigation.forEach(function (menu, idx) {
                    if (!angular.isDefined(menu.children) || menu.children.length === 0) {
                        navigation.splice(idx, 1);
                    }
                });

                navigation.sort(sorter);
                return navigation;
            };

            var callBLLForPluginsData = function () {
                var defer = $q.defer();
                var req_alarms = {
                    'operation': 'get_plugins'
                };
                bllApiRequest.get('catalog', req_alarms).then(
                    function (response) {
                        _this.available_bllplugins = response.data || [];
                        defer.resolve();
                    },
                    function (error_data) {
                        addNotification(
                            "error",
                            $translate.instant("common.error.bllplugins"));
                        log('error', 'Failed to get bll plugins ');
                        log('error', 'error data = ' + JSON.stringify(error_data));
                        defer.reject();
                    }
                );
                return defer.promise;
            };

            var processNavigation = function(init) {
                //have the plugins and the login still valid
                if (_this.dev_mode ||
                    (angular.isDefined(_this.available_bllplugins) &&
                    _this.available_bllplugins.length > 0 &&
                    angular.isDefined ($rootScope.auth_token)) ||
                    window.testing === true) {
                    _this.nav = _this.buildNav();
                    $rootScope.hasNavigation = true;
                }
                else {
                    if (angular.isDefined ($rootScope.auth_token) && init !== true) {
                        //if we logged in and not init call
                        //since it will fall into $routeChangeStart so don't want to
                        //have multiple calls initially
                        callBLLForPluginsData().then(
                            function (success) {
                                if (angular.isDefined(_this.available_bllplugins) &&
                                    _this.available_bllplugins.length > 0) {
                                    _this.nav = _this.buildNav();
                                    $rootScope.hasNavigation = true;

                                    $rootScope.pageTitle = $rootScope.getTitleKey(_this.nav, window.location.hash.substr(2), 'title') || $rootScope.getTitleKey(_this.nav, window.location.hash.substr(2), 'label');

                                    log('debug', "Available Services = " + JSON.stringify(_this.available_bllplugins));
                                    $rootScope.available_bllplugins = _this.available_bllplugins;
                                }
                                else {
                                    addNotification(
                                        "error",
                                        $translate.instant("common.error.bllplugins"));
                                }
                            },
                            function (error) { //error already logged
                            }
                        );
                    }
                }
            };

            //check the cookie
            //avoid this call when run unit test and in dev_mode
            if (window.testing !== true && !_this.dev_mode) {
                $rootScope.hasNavigation = false;
                updateAuthCookie();
            }
            else {
                $rootScope.hasNavigation = true;
            }

            //init call
            processNavigation(true);


            //want to reload the available_bllplugins when token changes
            //so it reflect the changing related to login user
            //only wathch it when we are not in testing or dev_mode
            if (window.testing !== true && !_this.dev_mode) {
                $rootScope.$watch('auth_token', function () {
                    //logout or init login or cookie expired
                    if (!angular.isDefined($rootScope.auth_token)) {
                        //reset so we can reload per login
                        _this.available_bllplugins = [];
                        $rootScope.available_bllplugins = [];
                        $rootScope.hasNavigation = false;
                    }
                    else {
                        //$routeChangeStart triggers to reload once user logged
                        //in
                    }
                });
            }

            $rootScope.$on("$routeChangeStart", function (event, next, current) {
                //if not testing and dev_mode reset flag
                if (window.testing !== true && !_this.dev_mode) {
                    $rootScope.hasNavigation = false;
                }

                processNavigation();
            });
        }//end function
    ]);

	ps.factory('pluginNames', [
		'plugins',
		function(plugins) {
			return plugins.map(function(plugin) {
				return plugin.pluginName;
			});
		}
	]);
})(angular);
