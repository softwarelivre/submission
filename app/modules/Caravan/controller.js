(function() {
  "use strict";

  angular
    .module('segue.submission.caravan',[
      'segue.submission.directives',
      'segue.submission.libs',
      'segue.submission.errors',
      'segue.submission.caravan.controller',
      'segue.submission.caravan.service',
      'segue.submission.purchase.service',
      'segue.submission.authenticate',
      'ngDialog'
    ])
    .config(function($stateProvider) {
      $stateProvider
        .state('caravan', {
          views: {
            header: { templateUrl: 'modules/common/nav.html' },
            main:   { template:    "<div ui-view='form'></div>", controller: 'CaravanController' }
          },
        })
        .state('caravan.new', {
          parent: 'caravan',
          url: '^/caravan/new',
          views: {
            form: { controller: 'NewCaravanController', templateUrl: 'modules/Caravan/form.html' }
          }
        })
        .state('caravan.edit', {
          parent: 'caravan',
          url: '^/caravan/:id',
          views: {
            form: { controller: 'EditCaravanController', templateUrl: 'modules/Caravan/form.html' }
          },
          resolve: {
            currentCaravan: function(Caravans, $stateParams) {
              return Caravans.one($stateParams.id).get();
            },
            invites: function(Caravans, $stateParams) {
              return Caravans.one($stateParams.id).getList('invites');
            }
          }
        })
    });

  angular
    .module('segue.submission.caravan.controller', ['segue.submission.caravan'])
    .controller('CaravanController', function($scope, Config, Auth, focusOn) {
      $scope.credentials = Auth.glue($scope, 'credentials');
    })
    .controller('EditCaravanController', function($scope, $uibModal,
                                                  FormErrors, Caravans,
                                                  currentCaravan, invites) {
      $scope.caravan = currentCaravan;
      $scope.lockCity = true;
      $scope.invites = invites;

      $scope.update = function() {
        console.log('ooo');
            Caravans.saveIt($scope.caravan)
                    .then($scope.home)
                    .catch(FormErrors.setScopeError($scope));
      };

      $scope.openInviteModal = function () {

        var modal = $uibModal.open({
          animation: false,
          templateUrl: 'modules/Caravan/invite.html',
          controller: 'NewCaravanInviteController',
          resolve: {
            caravan: function () {
              return $scope.caravan;
            }
          }
        });

        modal.result.then(function (result) {
          $scope.invites.push(result);
        });
      };

    })
    .controller('NewCaravanController', function($scope, $state,
                                                  Products, Caravans, FormErrors, Account) {

      $scope.enforceAuth();

      $scope.caravan = {};
      $scope.lockCity = true;

      Account.get().then(function(account) {
        $scope.caravan.city = account.city;
      });

      $scope.finish = function(response) {
        $state.go('caravan.edit', {id: response.id});
      };

      $scope.submit = function() {
        Caravans.post($scope.caravan)
                .then($scope.finish)
                .catch(FormErrors.setScopeError($scope));
      };

    })
    .controller('NewCaravanInviteController', function($scope, $uibModalInstance,
                                                       FormErrors, Caravans, caravan) {
      $scope.invite = {};

      $scope.finish = function(response) {
        $uibModalInstance.close(response);
      };

      $scope.submitInvite = function() {
        Caravans.createInvite(caravan, $scope.invite)
                  .then($scope.finish)
                  .catch(FormErrors.setScopeError($scope));
      };
    });
})();
