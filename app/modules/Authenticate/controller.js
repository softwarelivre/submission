(function() {
  "use string";

  angular
    .module("segue.submission.authenticate",[
      "ngDialog",

      "segue.submission",
      "segue.submission.authenticate.controller",
      "segue.submission.account.controller"
    ])
    .config(function($stateProvider) {
      $stateProvider
        .state('authenticate', {
          url: '/authenticate/:next',
          views: {
            "header": { templateUrl: 'modules/common/nav.html' },
            "main":   { templateUrl: 'modules/Authenticate/master.html', controller: 'AuthController' },
            "left@authenticate":  { controller: 'LoginController',  templateUrl: 'modules/Authenticate/login.html' },
            "right@authenticate": {}
          },
          params: {
            prev: null,
          }
        })
        .state('forgot', {
          url: '^/forgot/{email}',
          views: {
            "header": {                                         templateUrl: 'modules/common/nav.html' },
            "main":   { controller: 'ForgotPasswordController', templateUrl: 'modules/Authenticate/forgot.html' },
          }
        });
    });

  angular
    .module("segue.submission.authenticate.controller", [
      "segue.submission.directives",

      "segue.submission.errors",
      "segue.submission.authenticate.directive",
      "segue.submission.authenticate.service",
    ])
    .controller('AuthController', function($scope, $state, focusOn) {
      $scope.nextState = $state.params.next;
      $scope.nextStateParams = $state.params.prev;
      $scope.authMode = "loginOnly";
      focusOn("login.email");
    })
    .controller("ForgotPasswordController", function($scope, $state, Account, FormErrors, focusOn) {
      $scope.forgot = { email: $state.params.email };
      $scope.sent = false;
      focusOn("forgot.email", 100);

      function markAsSent() {
        $scope.sent = true;
      }

      $scope.askReset = function() {
        Account.askReset($scope.forgot)
               .then(markAsSent)
               .catch(FormErrors.set);
      };
    })
    .controller("LoginController", function($scope, $state, Auth, focusOn) {

      if(Auth.token())
      {
        $scope.home(); //FIX
      }

      function succeed(credentials) {

        if(credentials.dirty)
        {
          $state.go('account.update');
        }
        else if ($scope.nextState) {
          $state.go($scope.nextState, $scope.nextStateParams);
        }
        else {
          $scope.home();
        }
      }
      
      $scope.tryLogin = function() {
        Auth.login($scope.login.email, $scope.login.password)
            .then(succeed);
      };

      $scope.forgotPassword = function() {
        $state.go('forgot', { email: $scope.login.email });
      };

      $scope.signup = function() {
        var params = {
          nextState: {
            name: $scope.nextState,
            params: $scope.nextStateParams,
          },
        };
        $state.go('account.signup', params);
      }
    })
})();
