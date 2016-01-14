(function() {
  "use strict";

  angular
    .module("segue.submission.account",[
      "ngDialog",

      "segue.submission.directives",
      "segue.submission.account.controller"
    ])
    .config(function($stateProvider) {
      $stateProvider
        .state('reset', {
          url: '^/account/{accountId}/reset/{hashCode}',
          views: {
            "header": {                                        templateUrl: 'modules/common/nav.html' },
            "main":   { controller: 'ResetPasswordController', templateUrl: 'modules/Account/reset.html' },
          },
        });
    });

  angular
    .module("segue.submission.account.controller",[
      "segue.submission.account.service",
      "segue.submission.locale"
    ])
    .controller("ResetPasswordController", function($scope, $stateParams, $state,
                                                    Account, FormErrors, Validator,
                                                    focusOn, ngToast) {
      $scope.reset = { hash_code:  $stateParams.hashCode };
      focusOn('reset.password', 100);

      function finishedReset() {
        ngToast.create({ content: 'Sua senha foi resetada com sucesso.' });
        $scope.home();
      }

      $scope.submit = function() {
        FormErrors.clear();
        Validator.validate($scope.reset, 'accounts/reset')
                 .then(Account.resetPassword($stateParams.accountId))
                 .then(finishedReset)
                 .catch(FormErrors.set);
      };
    })
    .controller("SignUpController", function($scope,
                                             Account, Auth, Validator, FormErrors, UserLocation,
                                             focusOn, $http, AddressResolver) {
      $scope.signup = Account.localLoad();
      $scope.$watch('signup', Account.localSave);

      $scope.disabilityTypes =  Account.getDisabilityTypes();
      $scope.occupationTypes = Account.getOccupationTypes();
      $scope.educationTypes = Account.getEducationTypes();

      $scope.fetchAddress = function(zipcode) {
        AddressResolver.getAddress(zipcode)
        .then(function(success) {
          $scope.signup.country = success.country;
          $scope.signup.city = success.city;
          $scope.signup.address_state = success.state;
        });
      };

     // UserLocation.autobind($scope, 'signup'); FIX MAYBE REMOVE

      function finishedSignUp() {
        Auth.login($scope.signup.email, $scope.signup.password);
        $scope.signup = null;
        // HACK: ugly hack to ensure we are not inside the proposal creation form before home()ing
        if ($scope.$parent.accountOption === undefined) {
          $scope.home();
        }
      }

      $scope.submit = function() {
        Validator.validate($scope.signup, 'accounts/signup')
                 .then(Account.post)
                 .then(Account.localForget)
                 .then(finishedSignUp)
                 .catch(FormErrors.set);
      };
    })
    .controller("UpdateAccountController", function($scope,
                                             Account, Auth, AuthModal, Validator, FormErrors, UserLocation,
                                             focusOn, $http, AddressResolver, ngToast) {

      $scope.lockEmail = true;

      Account.get().then(function(data){
        $scope.signup = data;
      });

      $scope.disabilityTypes =  Account.getDisabilityTypes();
      $scope.occupationTypes = Account.getOccupationTypes();
      $scope.educationTypes = Account.getEducationTypes();

      $scope.fetchAddress = function(zipcode) {
        AddressResolver.getAddress(zipcode)
        .then(function(success) {
          $scope.signup.country = success.country;
          $scope.signup.city = success.city;
          $scope.signup.address_state = success.state;
        });
      };

      function finishedUpdate() {
        Auth.logout();
        AuthModal.login();
      }

      $scope.submit = function() {
        Validator.validate($scope.signup, 'accounts/edit_account')
                 .then(Account.saveIt)
                 .then(finishedUpdate)
                 .catch(FormErrors.set);
      };
    });
})();
