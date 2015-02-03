(function() {
  "use strict";

  angular
    .module('segue.submission.proposal.service',[
      'segue.submission',
      'restangular',
      'ngStorage'
    ])
    .factory('Proposals', function(Restangular, $localStorage) {
      var extensions = {};
      extensions.current = function() {
        return $localStorage.savedProposal;
      };
      extensions.localSave = function(value) {
        $localStorage.savedProposal = value;
      };
      extensions.localForget = function() {
        $localStorage.savedProposal = {};
      };

      var service = Restangular.service('proposals');

      return _.extend(service, extensions);
    });
})();
