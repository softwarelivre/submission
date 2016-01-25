(function() {
  "use strict";

  angular
    .module('segue.submission.survey',
    [
          'segue.submission.certificate.service',
          'segue.submission.account.service',
          'segue.submission.directives',
    ])
    .config(function($stateProvider) {
      $stateProvider
        .state('survey', {
          url: '^/survey/',
          views: {
              header: { templateUrl: 'modules/common/nav.html', controller: 'SurveyMainController' },
          },
          resolve: {
            account: function(Account) { return Account.get(); }
          }
        })
        .state('survey.respond', {
          url: '^/survey/respond',
          parent: 'survey',
          views: {
            "main@": { templateUrl: 'modules/Survey/survey.html', controller: 'SurveyRespondController' }
          },
          resolve: {
            survey: function(Survey) { return Survey.get(); }
          }
        })
    })
    .controller('SurveyMainController', function($scope, $state, account) {
        $scope.enforceAuth();
    })
    .controller('SurveyRespondController', function($scope, $state, Survey, survey, ngToast) {
      $scope.survey = survey;
      $scope.responses = {};
      $scope.doSubmit = function() {
        Survey.saveAnswers($scope.responses).then(function(data) {
            ngToast.create({ content: 'Os dados da pesquisa foram salvos' });
            $state.go('home');
        });
      };
    });

})();
