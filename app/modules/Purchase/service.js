(function() {
  "use strict";

  angular
    .module('segue.submission.purchase.service',[
      'segue.submission',
      'restangular',
      'ngStorage',
    ])
    .factory('Products', function(Restangular, $q) {
      var service = Restangular.service('products');
      var extensions = {};

      var anEmptyList = function() { return []; };

      extensions.getCaravanList = function(hash) {
        if (!hash) { return []; }
        return service.one('caravan').getList(hash);
      };

      extensions.getCaravanProducts = function() {
        var deferred = $q.defer();
        service.getList().then(
            function(result) {
                var products = _.filter(result, function(element) {
                 return (element.category == 'caravan');
                });
                deferred.resolve(products);
            },
            function(error) {
              deferred.reject(error);
            }
        );
        return deferred.promise;
      };

      extensions.getProponentOffer = function(hash) {
        return service.one('proponent').getList(hash).catch(anEmptyList);
      };

      extensions.purchase = function(product_id, amount) {
        return function(buyer_data) {
          var product = service.one(product_id);
          buyer_data['amount'] = amount
          return product.post('purchase', buyer_data);
        };
      };

      extensions.doAPurchase = function(buyer_data, product_id) {
          var product = service.one(product_id);
          return product.post('purchase', buyer_data);
      };

       extensions.doADonation = function(buyer_data, product_id, amount, survey) {
          var product = service.one(product_id);
          buyer_data['amount'] = amount;
          buyer_data['shirt_size'] = survey.answers.size;
          buyer_data['delivery'] = survey.answers.delivery;

          return product.post('purchase', buyer_data);
      };



      return _.extend(service, extensions);
    })
    .factory('Purchases', function(Restangular, Auth, Validator, FormErrors, $localStorage, $q, $window) {
      var service = Restangular.service('purchases');
      var extensions = {};

      extensions.purchaseMode = function() {
        return service.one('mode').get().then(function(data) {
          return data.mode;
        });
      };

      extensions.guide = function(purchaseId, paymentId) {
        return service.one(purchaseId).one('payments').one(paymentId).one('guide').get();
      };

      extensions.current = function() {
        return $localStorage.savedPurchase || {};
      };
      extensions.localSave = function(value) {
        $localStorage.savedPurchase = value || {};
      };
      extensions.localForget = function() {
        $localStorage.savedPurchase = {};
      };
      extensions.saveIt = function(object) {
        return object.save();
      };
      extensions.pay = function(method) {
        return function(purchaseObject) {
          var p = service.one(purchaseObject.id).get().then(function(purchase) {
            if (purchase.status == "paid") {
              return purchase;
            } else {
              return purchase.post('pay/' + method);
            }
          });
          return p;
        };
      };
      extensions.sendGovDocument = function(document, purchase_id) {
          var buyer = {document_file: document};
          return service.one(purchase_id).post('upload-buyer-document', buyer);
      };
      extensions.followPaymentInstructions = function(response) {
       var instructions_url = "";
        if (_.has(response, '$type')) {
          if (response['$type'] == 'Purchase.normal') {
            instructions_url = "/#/purchase/" + response['id'] + "/payment/" + response['payments'][0].id + "/guide";
          }
        }
        else {
          instructions_url = response.redirectUserTo;
        }
        $window.location.href = instructions_url;
      };
      extensions.getOwnedByCredentials = function() {
        var credentials = Auth.credentials();
        if (!credentials) { return; }
        return service.getList({ customer_id: credentials.id });
      };
      extensions.verifyPromoCode = function(hash) {
        return service.one('promocode').one(hash).get();
      };

      return _.extend(service, extensions);
    })
    .factory('Promocodes', function(Restangular, Auth) {
      var service = Restangular.service('promocodes');
      var extensions = {};

      extensions.getOwnedByCredentials = function() {
        var credentials = Auth.credentials();
        if (!credentials) { return; }
        return service.getList({ creator_id: credentials.id });
      };

      return _.extend(service, extensions);
    })
    .factory('Buyer', function(Account, Auth, $q) {
      var service = {};

      service.createBuyer = function() {
        var deferred = $q.defer();

        if(Auth.credentials()) {

            Account.get().then(
                function (account) {
                    var buyer = {};
                    buyer.name = account.name;

                    if(Account.isCorporate(account)) {
                      buyer.kind = 'company';
                      buyer.cnpj = account.document;
                    } else if (Account.isForeign(account)) {
                      buyer.kind = 'foreign';
                      buyer.passport = account.document;
                    } else {
                      buyer.kind = 'person';
                      buyer.cpf = account.document;
                    }

                    buyer.purchase_qty = 1;
                    buyer.contact = account.phone;
                    buyer.address_country = account.country;
                    buyer.address_state = account.address_state;
                    buyer.address_city = account.city;
                    buyer.address_neighborhood = account.address_neighborhood;
                    buyer.address_number = account.address_number;
                    buyer.address_street = account.address_street;
                    buyer.address_zipcode = account.address_zipcode;
                    buyer.address_extra = account.address_extra;
                    buyer.caravan_invite_hash = account.caravan_invite_hash;
                    deferred.resolve(buyer);
                },
                function (error) {
                    deferred.reject(error);
                });
        } else {
            deferred.resolve({});
        }

        return deferred.promise;
      };

      return service;
    });
})();
