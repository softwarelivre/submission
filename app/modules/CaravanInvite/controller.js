(function() {
  "use strict";

  angular
    .module("segue.submission.caravaninvite",[
      "segue.submission.directives",
      "segue.submission.caravaninvite.controller"
    ])
    .config(function($stateProvider) {
      $stateProvider
        .state('caravaninvite', {
          abstract: true,
          views: {
            header: { templateUrl: 'modules/common/nav.html' },
          },
        })
        .state('caravaninvite.register', {
          parent: 'caravaninvite',
          url: '^/caravan/:caravan_id/invite/:hash/register',
          views: {
            "main@": { templateUrl: 'modules/CaravanInvite/register.html', controller: 'RegisterCaravanInviteController' }
          },
          resolve: {
            invite: function(CaravanInvites, $stateParams) {
              return CaravanInvites.of($stateParams.caravan_id).one($stateParams.hash).get();
            }
          }

        })
        .state('caravaninvite.answer', {
          parent: 'caravaninvite',
          url: '^/caravan/:caravan_id/invite/:hash/answer',
          views: {
            "main@": { templateUrl: 'modules/CaravanInvite/answer.html', controller: 'AnswerCaravanInviteController' }
          },
          resolve: {
            invite: function(CaravanInvites, $stateParams) {
              return CaravanInvites.of($stateParams.caravan_id).one($stateParams.hash).get();
            }
          }
        });
    });

  angular
    .module("segue.submission.caravaninvite.controller",[
      "segue.submission.caravaninvite.service",
      "segue.submission.authenticate.controller"
    ])
    .controller("RegisterCaravanInviteController", function($scope, $stateParams, $state,
                                                     Validator, Auth, Account, FormErrors, UserLocation, CaravanInvites,
                                                     invite, focusOn) {
      $scope.signup = { name: invite.name, email: invite.recipient };
      $scope.lockEmail = true;
      //UserLocation.autobind($scope, 'signup');

      focusOn('signup.name', 100);

      function finishedSignUp(signup) {
        Auth.login($scope.signup.email, $scope.signup.password).then(function() {
          $scope.signup = null;
          $state.go('home', { caravan_hash: $stateParams.hash });
        });
      }

      $scope.submit = function() {
        Validator.validate($scope.signup, 'accounts/signup')
                 .then(CaravanInvites.registerInvitee(invite))
                 .then(finishedSignUp)
                 .catch(FormErrors.set);
      };
    })
    .controller("AnswerCaravanInviteController", function($scope, $state, Auth, CaravanInvites, invite) {
      $scope.enforceAuth();

      $scope.account = Auth.glue($scope, 'account');
      $scope.invite = invite;
      $scope.login = {};
      $scope.showError = false;

      function moveToPurchaseArea() {
        $state.go('purchase.new');
      }

      function moveToHome() {
        $state.go('home');
      }

      function showError() {
        $scope.showError = true;
      }

      $scope.accept  = function() {
          CaravanInvites.accept(invite)
                        .then(moveToPurchaseArea)
                        .catch(showError);
      };

      $scope.decline = function() {
          CaravanInvites.decline(invite)
                        .then(moveToHome)
                        .catch(showError);
      };
    });
})();
