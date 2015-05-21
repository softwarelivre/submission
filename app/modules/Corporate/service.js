(function() {
  "use strict";

  angular
    .module('segue.submission.corporate.service',[
      'segue.submission',
      'restangular',
      'ngStorage',
    ])
    .factory('Corporates', function(Restangular, Auth, Validator, FormErrors, $localStorage, $q) {
      var service = Restangular.service('corporates');
      var extensions = {};

      extensions.current = function() {
        return $localStorage.savedCorporate || {};
      };
      extensions.localSave = function(value) {
        $localStorage.savedCorporate = value || {};
      };
      extensions.localForget = function() {
        $localStorage.savedCorporate = {};
      };
      extensions.saveIt = function(buyer_data, product_id, newEmployees) {
        return function(purchaseObject) {
          var corp_data = {
            name:     buyer_data.name,
            city:     buyer_data.address_city,
            document: buyer_data.document
          };

          return Validator.validate(corp_data, 'corporates/new_corporate')
                          .then(function(corpObject) {
                            return service.post(corpObject);
                          }).then(function(response) {
                            buyer_data.corporate_id = response.id;
                            buyer_data.employees = newEmployees;
                            return Restangular.service('products')
                                       .one(product_id)
                                       .post('corporate_purchase', buyer_data);
                          })
                          .catch(function() { console.log(arguments); });
        }
      };
      extensions.getOwnedByCredentials = function() {
        var credentials = Auth.credentials();
        if (!credentials) { return; }
        return service.one().get({owner_id: credentials.id});
      };

      return _.extend(service, extensions);
    });
})();
