(function() {
  "use strict";

  angular
    .module('segue.submission.libs', [
      'segue.submission',
      'ngStorage'
    ])
    .service('tv4', function() { return tv4; })
    .service('Validator', function($http, $q, tv4, Config) {
      return {
        validate: function(data, path) {
          var deferred = $q.defer();
          var url = Config.API_HOST + Config.API_PATH + "/" + path + ".schema";
          $http.get(url).then(function(response) {
            var validation = tv4.validateMultiple(data, response.data);
            if (validation.errors.length) {
              deferred.reject(validation.errors);
            }
            else {
              deferred.resolve(data);
            }
          });
          return deferred.promise;
        }
      };
    })
    .filter('dateFromTimestamp', function() {
      return function(input) {
        var year  = input.substring(0,4);
        var month = input.substring(5,7);
        var day   = input.substring(8,10);
        return day + "/" + month + "/" + year;
      };
    })
    .filter('realbrasileiro', function() {
      return function(input) {
        function formatCurrency( n ) {
          return n.toFixed(2).replace(".", ",").replace(/(\d)(?=(\d{3})+\,)/g, "$1.");
        }
        return 'R$ ' + formatCurrency(parseFloat(input));
      };
    })
    .directive('watch', function() {
      return function(scope, elem, attr) {
        elem.on('change', function(ev) {
          scope.$emit(attr.watch, elem);
        });
      };
    });

})();
