(function() {
  "use strict";

  angular
    .module('segue.submission.locale', [
      'gettext',
      'ngStorage',
    ])
    .service('Locale', function(gettextCatalog, $window, $localStorage, $rootScope) {
      var self = {};

      function useLanguage(lang) {
        gettextCatalog.setCurrentLanguage(lang);
        gettextCatalog.loadRemote('/public/translations/messages.'+lang+'.json');
        self.currentLanguage = lang;
        $rootScope.$broadcast('locale:changed', lang);
      }
      function saveLanguage(lang) {
        $localStorage.savedLanguage = lang;
      }

      function detectLanguage() {
        var browser   = ($window.navigator.userLanguage || $window.navigator.language || '').substring(0,2);
        var saved     = $localStorage.savedLanguage;
        var candidate = saved || browser;
        var fallback  = 'pt';
        var valid     = _(self.languages).where({ abbr: candidate }).size();
        return valid? candidate : fallback;
      }

      self.selectLanguage = function(lang) {
        useLanguage(lang);
        saveLanguage(lang);
      };

      self.languages = [
        { abbr: 'pt', full: 'português' },
        { abbr: 'en', full: 'english' },
      ];

      useLanguage(detectLanguage());

      return self;
    })
    .service('AddressResolver', function(Config, $http, $q) {

        return {
          getAddress: function (zipcode) {
            var api = Config.GOOGLE_GEO_API;
            var params = {address: zipcode, sensor: false};
            var deferred = $q.defer();
            if (zipcode == undefined)
            {
              deferred.reject({'message': 'invalid zipcode'});
            }
            else {
              $http.get(api, {params: params}).then(function (success) {
                var data = success.data;
                var result = {};
                if( data.status == 'OK')
                {
                  result.zipcode = zipcode;
                  angular.forEach(data.results[0].address_components, function (address_component) {
                    if (address_component.types[0] == "country"){
                        result.country = address_component.short_name;
                    }
                    if (address_component.types[0] == "administrative_area_level_1"){
                        result.state = address_component.short_name;
                    }
                    if (address_component.types[0] == "administrative_area_level_2"){
                        result.city = address_component.long_name;
                    }
                  });
                }
                if(Object.keys(result).length === 0) {
                  deferred.reject({'message': 'not found'});
                } else {
                  deferred.resolve(result);
                }
              }, function (error) {
                deferred.reject({'message': 'invalid number'});
              });
            }
            return deferred.promise;
          }
        };
    })
    .service('UserLocation', function(Config, $http, $q, $localStorage) { //FIX REMOVE REPLACE
      var service = {
        set: function(data) {
          // $localStorage.userLocation = data;
        },
        get: function(ip) {
          var deferred = $q.defer();
          var url = Config.GEOIP_API + "/" + (ip || '');
          if ($localStorage.userLocation) {
            deferred.resolve($localStorage.userLocation);
          }
          else {
            $http.get(url).then(function(response) {
              deferred.resolve(response.data);
              service.set(response.data);
            });
          }
          return deferred.promise;
        },
        autobind: function(scope, propname) {
          // TODO: this is a very dirty hack
          service.get().then(function(value) {
            var bound = scope[propname];
            if (bound.city || bound.country) { return; }
            bound.city    = value.city;
            bound.country = value.country;
            scope.guessedLocation = true;
          });
          scope.$on('country:changed', function(_, newCountry) {
            scope.guessedLocation = false;
          });
        }
      };
      return service;
    })
    .service('isBrazil', function() {
      return function(country) {
        if (country) {
          // TODO: this is a very dirty hack
          return _(['brazil', 'brasil', 'brésil', 'brasiu', 'br', 'gibemoney']).contains(country.toLowerCase());
        } else return true;
      };
    })
    .directive('changeSignal', function() {
      return function(scope, elem, attr) {
        elem.on('change', function(ev) {
          scope.$broadcast(attr.changeSignal, elem.val());
        });
      };
    })
    .directive('ifUsePassport', function(isBrazil) {
      return function(scope, elem, attr) {
        var action = attr.ifUsePassport;
        var initialCountry = 'Brasil';
        if (_.has(scope.signup, 'country')) {
          initialCountry = scope.signup.country;
        }

        function hideOrShow(country) {
          var show = (isBrazil(country) && (action == 'hide')) ||
                     (!isBrazil(country) && (action == 'show'));
          if (show) { elem.removeClass('ng-hide'); }
          else { elem.addClass('ng-hide'); }
        }
        scope.$on('country:changed', function(_, newCountry) {
          if (isBrazil(newCountry)) {
            delete scope.signup.passport;
          } else {
            delete scope.signup.cpf;
          }
          hideOrShow(newCountry);
        });
        hideOrShow(initialCountry);
      };
    })
    .directive('ifLocale', function(Locale) {
      return function(scope, elem, attr) {
        function hideOrShow(newLocale) {
          if (myLocale == newLocale) { elem.removeClass('ng-hide'); }
          else { elem.addClass('ng-hide'); }
        }

        var myLocale = attr.ifLocale;
        scope.$on('locale:changed', function(_,newLocale) { hideOrShow(newLocale); });
        hideOrShow(Locale.currentLanguage);
      };
    })
    .directive('localeSelector', function(Locale) {
      return {
        scope: {},
        controller: function($scope) {
          $scope.Locale = Locale;
        },
        templateUrl: 'modules/Locale/locale.html'
      };
    });

})();
