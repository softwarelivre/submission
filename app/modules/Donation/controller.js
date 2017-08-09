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
            },
            buyer: function(Buyer) {
              return Buyer.createBuyer();
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
                                                  focusOn, products, purchaseMode, buyer,
                                                  $state, Products, Purchases, Account, Survey) {

      $scope.enforceAuth();

      $scope.buyer = buyer;
      $scope.payment = { method: 'pagseguro', amount: 10 };
      $scope.selectedProduct = {};
      <!-- TODO: REVIEW -->
      $scope.productSurvery = {
        survey: {
          name : 'fisl18_donation_shirt_purchase_',
        },
        answers: {
          delivery: 'at_fisl',
          size: 'G',
        },
      };

      $scope.reciveTShirt = function() {
        return $scope.selectedProduct.id == 58 || $scope.selectedProduct.id == 71;
      }

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

      $scope.submit = function() {
        // This is UGLY, fix it later
        $scope.buyer.payment_method = $scope.payment.method;
        Products.doADonation($scope.buyer, $scope.selectedProduct.id, $scope.payment.amount, $scope.productSurvery)
                 .then(Purchases.pay($scope.payment.method))
                 .then(Purchases.followPaymentInstructions)
                 .catch(FormErrors.setError)
      };
    });
})();
