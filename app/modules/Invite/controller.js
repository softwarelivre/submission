(function() {
  "use strict";

  angular
    .module("segue.submission.invite",[
      "segue.submission.directives",
      "segue.submission.invite.controller"
    ])
    .config(function($stateProvider) {
      $stateProvider
        .state('invite', {
          abstract: true,
          views: {
            header: { templateUrl: 'modules/common/nav.html' },
          },
        })
        .state('invite.answer', {
          parent: 'invite',
          url: '^/proposal/:proposal_id/invite/:hash/answer',
          views: {
            "main@": { templateUrl: 'modules/Invite/answer.html', controller: 'AnswerInviteController' }
          },
          resolve: {
            invite: function(Invites, $stateParams) {
              return Invites.of($stateParams.proposal_id).one($stateParams.hash).get();
            }
          }
        });
    });

  angular
    .module("segue.submission.invite.controller",[
      "segue.submission.invite.service",
      "segue.submission.authenticate.controller"
    ])
    .controller("AnswerInviteController", function($scope, $state, Auth, Invites, invite) {
      $scope.enforceAuth();

      $scope.account = Auth.glue($scope, 'account');
      $scope.invite = invite;

      function moveToNextState(invite) {
        $scope.home();
      }

      function error() {
        ngToast.create({ className: 'danger', content: 'Houve um erro ao realizar a operação.' });
      }

      $scope.accept  = function() {
        Invites.accept(invite)
               .then(moveToNextState)
               .catch(error);
      };

      $scope.decline = function () {
        Invites.decline(invite)
               .then(moveToNextState)
               .catch(error);
      }
    });
})();
