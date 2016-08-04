(function() {
  "use strict";

  angular
    .module('segue.submission.account.service',[
      'restangular',
      'ngStorage'
    ])
    .service("Account", function(Restangular, Auth, $localStorage, ngToast, isBrazil) {
      var service = Restangular.service('accounts');
      var extensions = {};

      extensions.get = function() {
        var credentials = Auth.credentials();
        if (!credentials) { return; }
        return service.one(credentials.id).get();
      };
      extensions.getDocumentField = function(country) {
        if (isBrazil(country)) {
          return 'cpf';
        } else {
          return 'passport';
        }
      };
      extensions.getDisabilityTypes = function() {
        return [ 'none', 'physical', 'hearing', 'visual', 'mental'];
      };
      extensions.getOccupationTypes = function() {
        return [
          'student', 'private_employee', 'public_employee', 'professor', 'businessman', 'freelancer'
        ]
      };
      extensions.getEducationTypes = function() {
        return [
          'post_graduation_stricto',
          'post_graduation_lato',
          'graduation',
          'graduation_incomplete',
          'secondary',
          'secondary_incomplete',
        ];
      };
      extensions.localLoad = function() {
        return $localStorage.savedAccount || {};
      };
      extensions.localSave = function(value) {
        $localStorage.savedAccount = value || {};
      };
      extensions.localForget = function() {
        $localStorage.savedAccount = {};
      };
      extensions.saveIt = function(object) {
        return object.save();
      };

      extensions.askReset = function(data) {
        return service.one('reset').post('', data);
      };

      extensions.getEmployees = function () {
         if (!Auth.isCorporate()) {return; }
         return service.one(credentials.id).one('employees').getList();
      };

      extensions.setCertificateName = function(data) {
        var credentials = Auth.credentials();
        if (!credentials) { return; }
        return service.one(credentials.id).post('certificate-name', data);
      };

      extensions.resetPassword = function(accountId) {
        return function(resetData) {
          return service.one(accountId)
                        .one('reset', resetData.hash_code)
                        .post('',resetData)
                        .then(function(data) { return Auth.login(data.email, resetData.password); });
        };
      };

      extensions.isUser = function(account) {
        return extensions.hasRole(account, 'user');
      };

      extensions.isAdmin = function(account) {
        return extensions.hasRole(account, 'admin');
      };

      extensions.isForeign = function(account) {
        return extensions.hasRole(account, 'foreign');
      };

      extensions.isCorporate = function(account) {
        return extensions.hasRole(account, 'corporate');
      }

      extensions.hasRole = function(account, role) {
        if (!account) { return false;}
        for(var i=0; i < account.roles.length; i++) {
          if(account.roles[i].name === role) { return true; }
        }
        return false;
      }

      return _.extend(service, extensions);
    });
})();
