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
        .state('invite.register', {
          parent: 'invite',
          url: '^/proposal/:proposal_id/invite/:hash/register',
          views: {
            "main@": { templateUrl: 'modules/Invite/register.html', controller: 'RegisterInviteController' }
          },
          resolve: {
            invite: function(Invites, $stateParams) {
              return Invites.of($stateParams.proposal_id).one($stateParams.hash).get();
            }
          }

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
    .controller("RegisterInviteController", function($scope,
                                                     Validator, Auth, Account, FormErrors, UserLocation, Invites,
                                                     invite, focusOn, AddressResolver) {
      Auth.logout();

      $scope.signup = {
        name: invite.name,
        email: invite.recipient,
        email_confirm: invite.recipient
      };
      $scope.signup.sex = 'M';
      $scope.signup.membership = false;

      $scope.lockEmail = true;
      //UserLocation.autobind($scope, 'signup');

      focusOn('signup.name', 100);

      $scope.type = 'person';
      $scope.lockType = false;
      $scope.disabilityTypes =  Account.getDisabilityTypes();
      $scope.occupationTypes = Account.getOccupationTypes();
      $scope.educationTypes = Account.getEducationTypes();

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


      function finishedSignUp(signup) {
        Auth.login($scope.signup.email, $scope.signup.password);
        $scope.signup = null;
        $scope.home();
      }
      $scope.submit = function() {
          Invites.registerInviteAndCreateAccount(invite, $scope.signup)
                 .then(finishedSignUp)
                 .catch(FormErrors.setError);
      };
    })
    .controller("AnswerInviteController", function($scope, $state, Auth, AuthModal, Invites, invite) {
      /*
      #TODO: USER MUST BE LOGGED IF HE HAVE AN ACCOUNT TO ACCEPT OR DECLINE
       */
      Auth.logout();

      $scope.account = Auth.glue($scope, 'account');
      $scope.invite = invite;
      $scope.login = {};

      // TODO CREATE ACTION PASS FUNCTION PARAMETER
      function retryWithLogin(action) {
        AuthModal.inviteLogin().closePromise.then(function(data) {
          console.log('teste')
          console.log(_(data.value))
          if (data.value == 'register')
          {
             $state.go('invite.register', $state.params);
             return;
          }
          if (_(data.value).isString()) { return; }
          if (_(data.value).isEmpty()) { return; }
          action();
        });
      }
      function moveToNextState(invite) {
        if ($scope.account) { $scope.home(); }
        else { $state.go('invite.register', $state.params); }
      }

      $scope.accept  = function() {
        Invites.accept(invite)
               .then(moveToNextState)
               .catch(retryWithLogin($scope.accept));
      };

      $scope.decline = function () {
        Invites.decline(invite)
               .then(moveToNextState)
               .catch(retryWithLogin($scope.decline));
      }
    });
})();
