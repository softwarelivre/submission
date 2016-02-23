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
        .state('account', {
          url: '^/account/',
          views: {
            "header": {templateUrl: 'modules/common/nav.html' }
          }
        });
    })
    .config(function($stateProvider) {
      $stateProvider
        .state('reset', {
          url: '^/account/{accountId}/reset/{hashCode}',
          views: {
            "header": {                                        templateUrl: 'modules/common/nav.html' },
            "main":   { controller: 'ResetPasswordController', templateUrl: 'modules/Account/reset.html' },
          },
        });
    })
    .config(function($stateProvider) {
      $stateProvider
        .state('account.signup', {
          parent: 'account',
          url: '^/account/signup',
          views: {
            "main@":   { controller: 'SignUpController', templateUrl: 'modules/Account/baseform.html' },
          },
        });
    })
    .config(function($stateProvider) {
      $stateProvider
        .state('account.update', {
          parent: 'account',
          url: '^/account/update',
          views: {
           "main@":   { controller: 'UpdateAccountController', templateUrl: 'modules/Account/baseform.html' },
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

      $scope.type = 'person';

      $scope.signup = {
          sex: 'M',
          membership: false
      };

      $scope.selectedAddress = '';

      $scope.getLocation = function(address) {
        return AddressResolver.fetchLocation(address).then(function(results){
            return results.map(function(item){
                return item;
            });
        });
      };

      $scope.onSelectLocation = function($item){
        var address = AddressResolver.convertToAddress($item);
        $scope.signup.country = address.country;
        $scope.signup.address_state = address.state;
        $scope.signup.city = address.city;
        $scope.signup.address_zipcode = address.zipcode;
        $scope.signup.address_neighborhood = address.neighborhood;
        $scope.signup.address_street = address.street;
      };

      $scope.disabilityTypes =  Account.getDisabilityTypes();
      $scope.occupationTypes = Account.getOccupationTypes();
      $scope.educationTypes = Account.getEducationTypes();

      function finishedSignUp() {
        Auth.login($scope.signup.email, $scope.signup.password);
        $scope.signup = null;
        // HACK: ugly hack to ensure we are not inside the proposal creation form before home()ing
        if ($scope.$parent.accountOption === undefined) {
          $scope.home();
        }
      }

      $scope.submit = function() {
        if($scope.signup.membership === 'true') { $scope.signup.membership = true; }
        if($scope.signup.membership === 'false') { $scope.signup.membership = false; }

         var schema =  'accounts/signup';
         if($scope.type == 'corporate')  {
             schema = 'accounts/corporate';
         }

        Validator.validate($scope.signup, schema)
                 .then(Account.post)
                 .then(Account.localForget)
                 .then(finishedSignUp)
                 .catch(FormErrors.set);
      };
    })
    .controller("UpdateAccountController", function($scope, $state,
                                             Account, Auth, AuthModal, Validator, FormErrors, UserLocation,
                                             focusOn, AddressResolver, ngToast) {

      $scope.enforceAuth();

      $scope.selectedAddress = '';

      $scope.getLocation = function(address) {
        return AddressResolver.fetchLocation(address).then(function(results){
            return results.map(function(item){
                return item;
            });
        });
      };

      $scope.onSelectLocation = function($item){
        var address = AddressResolver.convertToAddress($item);
        $scope.signup.country = address.country;
        $scope.signup.address_state = address.state;
        $scope.signup.city = address.city;
        $scope.signup.address_zipcode = address.zipcode;
        $scope.signup.address_neighborhood = address.neighborhood;
        $scope.signup.address_street = address.street;
      };

      $scope.credentials = Auth.glue($scope, 'credentials');

      $scope.signup = {};

      $scope.lockEmail = true;
      $scope.lockType = true;

      Account.get().then(function(data){
        $scope.signup = data;
        $scope.type = 'person';
        if( $scope.signup.role == 'corporate')
        {
            $scope.type = 'corporate';
            $scope.signup.cnpj = $scope.signup.document
        } else if ( $scope.signup.role == 'person') {
            $scope.signup.cpf = $scope.signup.document
        } else if( $scope.signup.role == 'foreign') {
            $scope.signup.passport = $scope.signup.document
        }
        delete $scope.signup.document;
      });

      $scope.disabilityTypes =  Account.getDisabilityTypes();
      $scope.occupationTypes = Account.getOccupationTypes();
      $scope.educationTypes = Account.getEducationTypes();

      function finishedUpdate() {
        ngToast.create({ content: 'Sua conta foi atualizada com sucesso.' }); //FIX ME
        $scope.credentials.dirty = false;
        $scope.home();
      }

      $scope.submit = function() {

            if($scope.signup.membership === 'true') { $scope.signup.membership = true; }
            if($scope.signup.membership === 'false') { $scope.signup.membership = false; }

            var schema =  'accounts/edit_account';
            if($scope.type == 'corporate')  {
                schema = 'accounts/edit_corporate';
            }

            Validator.validate($scope.signup, schema)
                     .then(Account.saveIt)
                     .then(finishedUpdate)
                     .catch(FormErrors.set);
      };
    });
})();
