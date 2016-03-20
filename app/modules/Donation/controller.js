(function() {
  "use strict";

  angular
    .module('segue.submission.donation',[
      'segue.submission.directives',
      'segue.submission.libs',
      'segue.submission.errors',
      'segue.submission.donation.controller',
      'segue.submission.authenticate',
      'ngDialog'
    ])
    .config(function($stateProvider) {
      $stateProvider
        .state('donation', {
          views: {
            header: { templateUrl: 'modules/common/nav.html' },
            main:   { template:    "<div ui-view='form'></div>", controller: 'DonationController' }
          },
          resolve: {
            products: function(Products) { return Products.getList(); },
            purchaseMode: function(Purchases) { return Purchases.purchaseMode(); }
          }
        })
        .state('donation.new', {
          parent: 'donation',
          url: '^/donation/new',
          views: {
            form: { controller: 'NewDonationController', templateUrl: 'modules/Donation/baseform.html' }
          },
          resolve: {
            products: function(Products) {
              return Products.getList();
            }
          }
        })
        .state('donation.conclude', {
          parent: 'donation',
          url: '^/donation/:purchase_id/payment/:payment_id/conclude',
          views: {
            "main@": { controller: 'ConcludeDonationController', templateUrl: 'modules/Donation/conclude.html' }
          },
          resolve: {
            purchase: function(Purchases, $stateParams) { return Purchases.one($stateParams.purchase_id).get(); },
          }
        })
    });

  angular
    .module('segue.submission.donation.controller', ['segue.submission.donation'])
    .controller('DonationController', function($scope, Config, Auth, focusOn, Validator, FormErrors, products, Account) {
      $scope.credentials = Auth.glue($scope, 'credentials');
      $scope.products = products;
    })
    .controller('ConcludeDonationController', function($scope, $stateParams, purchase, Auth) {
      $scope.credentials = Auth.glue($scope, 'credentials');
      $scope.$on('auth:changed', $scope.home);

      $scope.purchase = purchase;
    })
    .controller('NewDonationController', function($rootScope, $scope, $stateParams,
                                                  Config, Auth, Validator, FormErrors, ContractModal,
                                                  focusOn, products, purchaseMode,
                                                  $state, Products, Purchases, Account, Survey) {

      $scope.enforceAuth();

      $scope.buyer = {};
      $scope.payment = { method: 'boleto', amount: 10 };
      $scope.selectedProduct = {};
      $scope.productSurvery = {
        survey: {
          name : 'fisl17_donation_shirt_purchase_',
          productId: 1,
        },
        answers: {
          delivery: 'at_fisl',
          size: 'G',
        },
      };
      $scope.purchaseMode = purchaseMode;

      $scope.donationProducts = function() {
        return _.filter(products, function(element) {
          return (element.category == 'donation')
        });
      }

      $scope.updateSelectedProduct = function(newId) {
        $scope.selectedProduct = _($scope.products).findWhere({ id: newId });
        resetPaymentMethod();
      };

      function resetPaymentMethod() {
        if (!$scope.selectedProduct) { return; }
        var requiresCash = $scope.selectedProduct.can_pay_cash;
        var isOnline     = purchaseMode == 'online';
        if (requiresCash) {
          $scope.payment.method = 'cash';
        } else if (isOnline) {
          $scope.payment.method = 'boleto';
        }
      }

      Account.get().then(function(account) {
        $scope.buyer.name            = account.name;
        $scope.buyer.kind = 'person';
        $scope.buyer.cpf  = account.document;
        if (account.role == 'corporate')
        {
          $scope.buyer.kind = 'company';
          $scope.buyer.cnpj  = account.document;
        }
        else if (account.role == 'foreign')
        {
          $scope.buyer.kind = 'foreign';
          $scope.buyer.passport  = account.document;
          $scope.payment.method = 'paypal';
        }

        $scope.buyer.contact         = account.phone;
        $scope.buyer.address_country = account.country;
        $scope.buyer.address_state   = account.address_state;
        $scope.buyer.address_city    = account.city;
        $scope.buyer.address_neighborhood = account.address_neighborhood;
        $scope.buyer.address_number = account.address_number;
        $scope.buyer.address_street = account.address_street;
        $scope.buyer.address_zipcode = account.address_zipcode;

      });

      function submitSurvey(response) {
        if($scope.selectedProduct.id == $scope.productSurvery.survey.productId )
        {
          $scope.productSurvery.survey.name += response.parentResource.id;
          Survey.submitAnswers($scope.productSurvery);
        }
      }

      function finish(response) {
        Purchases.followPaymentInstructions(response);
        submitSurvey(response);
      }

      $scope.submit = function() {
        // This is UGLY, fix it later
        $scope.buyer.payment_method = $scope.payment.method;
        Products.doAPurchase($scope.buyer, $scope.selectedProduct.id, $scope.payment.amount)
                 .then(Purchases.pay($scope.payment.method))
                 .then(finish)
                 .catch(FormErrors.setError)
      };
    });
})();
