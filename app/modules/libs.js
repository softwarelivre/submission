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

    .directive('watch', function() {
      return function(scope, elem, attr) {
        elem.on('change', function(ev) {
          scope.$emit(attr.watch, elem);
        });
      };
    })
    .controller("ContractController", function($scope, $rootScope, $state, $window) {
      var contract_type = $scope.ngDialogData.contract_type;
      $scope.contract_type = "modules/common/contract_" + contract_type + ".html";

      $scope.acceptContract = function() {
        $scope.closeThisDialog(true);
      };

      $scope.rejectContract = function() {
        $scope.closeThisDialog(false);
      }

    })
    .factory('ContractModal', function (ngDialog, $rootScope) {
      var contractConfig  = {
        controller: "ContractController",
        template: 'modules/common/contract.html',
        showClose: false,
        closeByDocument: false,
        closeByEscape: false
      };
      return {
        show:  function(contract_type, dialog_size) {
          var size = 'contract_default';
          if (!_.isUndefined(dialog_size)) { size = dialog_size; }
          _.extend(contractConfig, { className: 'ngdialog-theme-default ' + size, data: { contract_type: contract_type} });
          return ngDialog.open(contractConfig);
        }
      };
    });
})();
