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
            "header": {templateUrl: 'modules/common/nav.html' },
            "main":   { template:  "<div ui-view='form'></div>", controller: 'AccountController' }
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
            "form":   { controller: 'SignUpController', templateUrl: 'modules/Account/baseform.html' },
          },
        });
    })
    .config(function($stateProvider) {
      $stateProvider
        .state('account.update', {
          parent: 'account',
          url: '^/account/update',
          views: {
           "form":   { controller: 'UpdateAccountController', templateUrl: 'modules/Account/baseform.html' },
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
    .controller("AccountController", function($scope, Account, AddressResolver) {
      $scope.disabilityTypes =  Account.getDisabilityTypes();
      $scope.occupationTypes = Account.getOccupationTypes();
      $scope.educationTypes = Account.getEducationTypes();

      $scope.getLocation = function(address) {
        return AddressResolver.fetchLocation(address).then(function(results){
            return results.map(function(item){
                return item;
            });
        });
      };


    })
    .controller("SignUpController", function($scope,
                                             Account, Auth, FormErrors, UserLocation,
                                             focusOn, $http, AddressResolver) {

      $scope.type = 'person';

      $scope.signup = {
          sex: 'M',
          membership: false
      };

      $scope.selectedAddress = '';

      $scope.onSelectLocation = function($item){
        var address = AddressResolver.convertToAddress($item);
        $scope.signup.country = address.country;
        $scope.signup.address_state = address.state;
        $scope.signup.city = address.city;
        $scope.signup.address_zipcode = address.zipcode;
        $scope.signup.address_neighborhood = address.neighborhood;
        $scope.signup.address_street = address.street;
      };

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

        Account.post($scope.signup)
               .then(finishedSignUp)
               .catch(FormErrors.setError);
      };
    })
    .controller("UpdateAccountController", function($scope, $state,
                                             Account, Auth, AuthModal, FormErrors, UserLocation,
                                             focusOn, AddressResolver, ngToast) {

      $scope.enforceAuth();
      $scope.credentials = Auth.glue($scope, 'credentials');

      $scope.selectedAddress = '';

      $scope.signup = {};

      $scope.lockEmail = true;
      $scope.lockType = true;

      $scope.onSelectLocation = function($item){
        var address = AddressResolver.convertToAddress($item);
        console.log('ododo');
        $scope.signup.country = address.country;
        $scope.signup.address_state = address.state;
        $scope.signup.city = address.city;
        $scope.signup.address_zipcode = address.zipcode;
        $scope.signup.address_neighborhood = address.neighborhood;
        $scope.signup.address_street = address.street;
      };

      Account.get().then(function(data){
        $scope.signup = data;
        $scope.type = 'person';
        /*TODO: REMOVE THIS HACK OLD ACCOUNTS WITHOUT A DOCUMENT SO DOC WAS SET TO ID*/
        if ($scope.signup.document == $scope.signup.id )
        {
           delete $scope.signup.document
        }
        /* FIX PERMISSIONS */
        $scope.type = 'person'
        $scope.signup.cpf = $scope.signup.document;
        if( $scope.signup.role == 'corporate')
        {
            $scope.type = 'corporate';
            $scope.signup.cnpj = $scope.signup.document;
        } else if( $scope.signup.role == 'foreign') {
            $scope.type = 'foreign'
            $scope.signup.passport = $scope.signup.document;
        }
        delete $scope.signup.document;
      });

      function finishedUpdate() {
        ngToast.create({ content: 'Sua conta foi atualizada com sucesso.' }); //FIX ME
        $scope.credentials.dirty = false;
        $scope.home();
      }

      $scope.submit = function() {
          if($scope.signup.membership === 'true') { $scope.signup.membership = true; }
          if($scope.signup.membership === 'false') { $scope.signup.membership = false; }

          Account.saveIt($scope.signup)
                 .then(finishedUpdate)
                 .catch(FormErrors.setError);
      };
    });
})();
