(function() {
  "use strict";

  angular
    .module('segue.submission.members',[
      'segue.submission.directives',
      'segue.submission.libs',
      'segue.submission.errors',
      'segue.submission.members.controller',
      'segue.submission.authenticate',
      'ngDialog'
    ])
    .config(function($stateProvider) {
      $stateProvider
        .state('members', {
          views: {
            header: { templateUrl: 'modules/common/nav.html' },
            main:   { template:    "<div ui-view='form'></div>", controller: 'MemberController' }
          },
          resolve: {
            products: function(Products) { return Products.getList(); },
            purchaseMode: function(Purchases) { return Purchases.purchaseMode(); }
          }
        })
        .state('members.purchase', {
          parent: 'members',
          url: '^/members/purchase/new',
          views: {
            form: { controller: 'NewMemberPurchaseController', templateUrl: 'modules/Members/baseform.html' }
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
        .state('members.purchase_conclude', {
          parent: 'members',
          url: '^/members/:purchase_id/payment/:payment_id/conclude',
          views: {
            "main@": { controller: 'ConcludeMemberPurchaseController', templateUrl: 'modules/Members/conclude.html' }
          },
          resolve: {
            purchase: function(Purchases, $stateParams) { return Purchases.one($stateParams.purchase_id).get(); },
          }
        })
    });

  angular
    .module('segue.submission.members.controller', ['segue.submission.members'])
    .controller('MemberController', function($scope, Auth, products) {
      $scope.credentials = Auth.glue($scope, 'credentials');
      $scope.products = products;
    })
    .controller('ConcludeMemberPurchaseController', function($scope, purchase, Auth) {
      $scope.credentials = Auth.glue($scope, 'credentials');
      $scope.$on('auth:changed', $scope.home);

      $scope.purchase = purchase;
    })
    .controller('NewMemberPurchaseController', function($scope, FormErrors,
                                    products, purchaseMode, buyer, Products, Purchases) {

      $scope.enforceAuth();

      $scope.buyer = buyer;
      $scope.payment = { method: 'pagseguro', amount: 10 };
      $scope.selectedProduct = {};
 

      $scope.purchaseMode = purchaseMode;

      $scope.donationProducts = function() {
        return _.filter(products, function(element) {
          return (element.category == 'member')
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
          $scope.payment.method = 'pagseguro';
        }
      }

      $scope.submit = function() {
        // This is UGLY, fix it later
        $scope.buyer.payment_method = $scope.payment.method;
        Products.doAPurchase($scope.buyer, $scope.selectedProduct.id)
                 .then(Purchases.pay($scope.payment.method))
                 .then(Purchases.followPaymentInstructions)
                 .catch(FormErrors.setError)
      };
    });
})();
