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
            products: function(Products) { return [] },
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
            products:        function(Products, $stateParams) { return Products.getProponentOffer($stateParams.proponent_hash); },
            buyer:           function(Buyer) {return Buyer.createBuyer(); },
          },

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
        'corporate-promocode': 'corporativo',
        'gov-promocode': 'empenho',
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
                                                  Config, Auth, FormErrors, ngToast,
                                                  focusOn, products, purchaseMode, buyer,
                                                  Upload, Products, Purchases, Account, ContractModal) {
      $scope.enforceAuth();

      $scope.buyer = buyer;
      $scope.payment = {};
      $scope.selectedProduct = {};
      $scope.purchaseMode = purchaseMode;

      $scope.discountValue = 0;
      $scope.promocode = {'hash': ''};
      $scope.total_amount = 0;
      $scope.purchase_qty = {};
      $scope.isProponent = $stateParams.proponent_hash !== undefined;

      $scope.updatePurchaseTotal = function () {
        if ($scope.selectedProduct.id) {
          $scope.total_amount = $scope.purchase_qty[$scope.selectedProduct.id] * $scope.selectedProduct.price;
        }
      };

      $scope.products = _.filter(products, function(product) {
        if($scope.buyer.caravan_invite_hash)
          return (product.category == 'caravan');
        else if($scope.buyer.kind == 'foreign')
          return (product.category == 'foreigner');
        else if($scope.buyer.kind == 'company')
          return (product.category == 'business' || product.category == 'government');
        else
          return (product.category == 'normal' || product.category == 'student');
      });

      $scope.updateSelectedProduct = function(newId) {
        $scope.selectedProduct = undefined;

        var product = _($scope.products).findWhere({ id: newId });
        var contract = 'initial';

        console.log(product.category);

        if (product.category == 'student' || product.category == 'proponent-student') {
          console.log(product.category);
          $scope.buyer.kind = 'person';
          contract = 'student';
        } else if(product.category == 'foreigner') {
          contract = 'foreign';
        } else if(product.category == 'caravan') {
          contract = 'rider';
        } else if(product.category == 'business') {
          contract = 'corporate';
        } else if(product.category == 'government') {
          contract = 'government';
        } else if(product.category == 'corporate-promocode') {
          contract = undefined;
        } else if(product.category == 'gov-promocode') {
          contract = undefined;
        }

        if(contract) {
          var dialog = ContractModal.show(contract, 'contract_large');

          dialog.closePromise.then(function (data) {
            if (data.value) {
              $scope.selectedProduct = product;
              $scope.total_amount = $scope.selectedProduct.price * buyer.purchase_qty;
              $scope.updatePurchaseTotal();
              resetPaymentMethod();
            } else {
              $state.reload();
            }
          });
        } else {
          $scope.selectedProduct = product;
          $scope.total_amount = $scope.selectedProduct.price * buyer.purchase_qty;
          $scope.updatePurchaseTotal();
          resetPaymentMethod();
        }


      };

      $scope.createCaravan = function () {
        var dialog = ContractModal.show('caravan', 'contract_large');
        dialog.closePromise.then(function (data) {
            if(data.value) {$state.go('caravan.new');}
        });
      };

      function resetPaymentMethod() {
        if ($scope.selectedProduct) {
          var requiresCash = $scope.selectedProduct.can_pay_cash;
          var isOnline = purchaseMode == 'online';
          if (requiresCash) {
            $scope.payment.method = 'cash';
          } else if (isOnline) {
            if ($scope.buyer.kind == 'foreign') {
                $scope.payment.method = 'paypal';
            } else {
              $scope.payment.method = 'boleto';
            }
          }
        }
      }
      resetPaymentMethod();

      $scope.verifyPromoCode = function() {
        Purchases.verifyPromoCode($scope.promocode.hash).then(
          function(ret) {
            $scope.buyer.hash_code = $scope.promocode.hash;

            var promo_products = [ ret.product ];
            $scope.products = promo_products;
            $scope.discountValue = ret.discount*100;
          }
        ).catch(function() {
          ngToast.create({
            content:'Este código promocional é inválido ou então ele já foi usado.',
            className: 'danger',
          });
        })
      };

      function finish(response) {
        Purchases.followPaymentInstructions(response);
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
        $scope.buyer.purchase_qty = $scope.purchase_qty[$scope.selectedProduct.id];

        if($scope.selectedProduct.category == 'government') {
            Products.doAPurchase($scope.buyer, $scope.selectedProduct.id)
                .then(finish)
                .catch(FormErrors.setError);
        }
        else {
          Products.doAPurchase($scope.buyer, $scope.selectedProduct.id)
              .then(Purchases.pay($scope.payment.method))
              .then(finish)
              .catch(FormErrors.setError);
        }
      };
    });
})();
