(function() {
  "use strict";

  angular
    .module('segue.submission.purchase',[
      'segue.submission.directives',
      'segue.submission.libs',
      'segue.submission.errors',
      'segue.submission.purchase.controller',
      'segue.submission.purchase.service',
      'segue.submission.authenticate',
    ])
    .config(function($stateProvider) {
      $stateProvider
        .state('purchase', {
          views: {
            header: { templateUrl: 'modules/common/nav.html' },
            main:   { template:    "<div ui-view='form'></div>", controller: 'PurchaseController' }
          },
          resolve: {
            products: function(Products) { return Products.getList(); },
            purchaseMode: function(Purchases) { return Purchases.purchaseMode(); }
          }
        })
        .state('purchase.new', {
          parent: 'purchase',
          url: '^/purchase/new',
          views: {
            form: { controller: 'NewPurchaseController', templateUrl: 'modules/Purchase/baseform.html' }
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
        .state('purchase.guide', {
          parent: 'purchase',
          url: '^/purchase/:purchase_id/payment/:payment_id/guide',
          views: {
            "main@": { controller: 'GuidePurchaseController', templateUrl: 'modules/Purchase/guide.html' }
          },
          resolve: {
            guide: function(Purchases, $stateParams) {
              return Purchases.guide($stateParams.purchase_id, $stateParams.payment_id);
            },
          }
        })

        .state('purchase.conclude', {
          parent: 'purchase',
          url: '^/purchase/:purchase_id/payment/:payment_id/conclude',
          views: {
            "main@": { controller: 'ConcludePurchaseController', templateUrl: 'modules/Purchase/conclude.html' }
          },
          resolve: {
            purchase: function(Purchases, $stateParams) { return Purchases.one($stateParams.purchase_id).get(); },
          }
        })
        .state('purchase.proponentOffer', {
          parent: 'purchase',
          url: '^/proponent-offer/:proponent_hash',
          views: {
            "main@": { controller: 'NewPurchaseController', templateUrl: 'modules/Purchase/baseform.html' }
          },
          resolve: {
            products:        function(Products, $stateParams) { return Products.getProponentOffer($stateParams.proponent_hash); }
          }
        });
    });

  angular
    .module('segue.submission.purchase.controller', ['segue.submission.purchase'])
    .controller('PurchaseController', function($scope, Config, Auth, focusOn, Validator, FormErrors, products, Account) {
      $scope.credentials = Auth.glue($scope, 'credentials');
      $scope.products = products;
    })
    .controller('ConcludePurchaseController', function($scope, $stateParams, purchase, Auth) {
      $scope.credentials = Auth.glue($scope, 'credentials');
      $scope.$on('auth:changed', $scope.home);

      $scope.purchase = purchase;
    })
    .controller('GuidePurchaseController', function($scope, $stateParams, guide, Auth, $window) {
      $scope.printWindow = function() {
        $window.print();
      }

      var HUMAN_STATUSES = {
        pending: 'aguardando pagamento',
        paid: 'pagamento confirmado',
        reimburse: 'reembolsada'
      };
      var HUMAN_CATEGORIES = {
        speaker: 'palestrante',
        proponent: 'proponente',
        normal: 'normal',
        promocode: 'código promocional',
        student: 'estudante',
        caravan: 'caravana',
        'proponent-student': 'proponente - estudante'
      }
      $scope.credentials = Auth.glue($scope, 'credentials');
      $scope.$on('auth:changed', $scope.home);

      $scope.buyer     = guide.buyer;
      $scope.payment   = guide.payment;
      $scope.purchase  = guide.purchase;
      $scope.customer  = guide.purchase.customer;
      $scope.product   = guide.purchase.product;
      $scope.promocode = guide.promocode;
      $scope.human_status = HUMAN_STATUSES[guide.purchase.status];
      $scope.human_category = HUMAN_CATEGORIES[$scope.product.category];
    })
    .controller('NewPurchaseController', function($rootScope, $scope, $state, $stateParams,
                                                  Config, Auth, FormErrors,
                                                  focusOn, products, purchaseMode, buyer,
                                                  Upload, Products, Purchases, Account, ContractModal) {
      $scope.enforceAuth();

      $scope.buyer = buyer;
      $scope.payment = {};
      $scope.selectedProduct = {};
      $scope.purchaseMode = purchaseMode;

      $scope.haveDiscount = false;
      $scope.isPromoCode = false;
      $scope.discountValue = 0;
      $scope.products = _.filter(products, function(element) {
        if(buyer.caravan_invite_hash)
          return (element.category == 'caravan');
        return (element.category != 'donation' && element.category != 'caravan')
      });

      $scope.promoCodeError = false;
      $scope.promocode = { "hash": "" };

      $scope.showDialog = ContractModal.show

      $scope.isProponent = $stateParams.proponent_hash !== undefined;

      $scope.refreshProducts = function(products) {
        $scope.selectedProduct = {};
        return _(products).groupBy('sold_until')
                          .pairs()
                          .map(function(p) { return [p[0],_.groupBy(p[1], 'category')]; })
                          .value();
      }

      $scope.updateSelectedProduct = function(newId) {
        $scope.selectedProduct = _($scope.products).findWhere({ id: newId });
        if ($scope.selectedProduct.category == 'student') {
          $scope.buyer.kind = 'person';
          $scope.showDialog('student', 'contract_large');
        }
        resetPaymentMethod();
      };

      $scope.productsByPeriod = $scope.refreshProducts($scope.products);



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
      resetPaymentMethod();

      $scope.verifyPromoCode = function() {
        Purchases.verifyPromoCode($scope.promocode.hash).then(
          function(ret) {
            $scope.promoCodeError = false;
            $scope.isPromoCode = true;

            $scope.buyer.hash_code = $scope.promocode.hash;
            var promo_products = [ ret.product ];
            $scope.products = promo_products;
            $scope.productsByPeriod = $scope.refreshProducts(promo_products);
            $scope.updateSelectedProduct(ret.product.id);

            if (ret.discount < 1) {
              console.log('valid promocode, partial discount');
              $scope.haveDiscount = true;
              $scope.discountValue = ret.discount*100;
            } else {
              console.log('valid promocode, full discount');
              $scope.haveDiscount = false;
            }
          }
        ).catch(function() {
          console.log('invalid promocode');
          $scope.isPromoCode = false;
          $scope.promoCodeError = true;
        })
      }


      $scope.isDirty = function() {
        return $scope.credentials && $scope.selectedProduct.id && $scope.purchase_form.$dirty;
      };

      function finish(response) {
        Purchases.followPaymentInstructions(response);
        Purchases.localForget();
        $state.go('home');
      }

      $scope.uploadDocument = function(file) {
        $scope.fileUploadError = false;
        Upload.base64DataUrl(file).then(
          function (result) {
            $scope.buyer.document_file = result
          }, function(error) {
             console.log(error);
          });
      };

      $scope.submit = function() {
        // This is UGLY, fix it later
        $scope.buyer.payment_method = $scope.payment.method;
        Products.doAPurchase($scope.buyer, $scope.selectedProduct.id, $scope.payment.amount)
                 .then(Purchases.pay($scope.payment.method))
                 .then(finish)
                 .catch(FormErrors.setError);
      };
    });
})();
