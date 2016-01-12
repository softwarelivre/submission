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
      extensions.getDisabilityTypes = function() {  //FIX HARDCODING
        return [
          { key: 'none', value: 'Não' },
          { key: 'physical', value: 'Física' },
          { key: 'hearing', value: 'Auditiva' },
          { key: 'visual', value: 'Visual' },
          { key: 'mental', value: 'Mental' }
        ];
      };
      extensions.getOccupationTypes = function() { //FIX HARDCODING
        return [
          { key: 'student', value: 'Estudante' },
          { key: 'private_employee', value: 'Funcionário' },
          { key: 'public_employee', value: 'Funcionário Público' },
          { key: 'businessman', value: 'Empresário' },
          { key: 'freelancer', value: 'Autônomo' }
        ];
      };
      extensions.getEducationTypes = function() {  //FIX HARDCODING
        return [
          { key: 'post_graduation_stricto', value: 'Mestrado/Doutorado' },
          { key: 'post_graduation_lato', value: 'Pós Graduação/Especialização'},
          { key: 'graduation', value: 'Ensino Superior Completo' },
          { key: 'graduation_incomplete', value: 'Ensino Superior Incompleto' },
          { key: 'secondary', value: 'Ensino Médio Completo' },
          { key: 'secondary_incomplete', value: 'Ensino Médio Incompleto' },
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

      return _.extend(service, extensions);
    });
})();
