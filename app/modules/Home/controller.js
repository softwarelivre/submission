(function() {
  "use strict";

  angular
    .module('segue.submission.home', [
      'segue.submission.authenticate.service',
      'segue.submission.proposal.service',
      'segue.submission.purchase.service',
      'segue.submission.caravan.service',
      'segue.submission.certificate.service',
      'segue.submission.home.controller',
    ])
    .config(function($stateProvider) {
      $stateProvider
        .state('home', {
          url: '^/home?caravan_hash',
          views: {
            header: {                               templateUrl: 'modules/common/nav.html' },
            main:   { controller: 'HomeController', templateUrl: 'modules/Home/home.html'  }
          },
          resolve: {
            myCaravan:        function(Caravans)     { return Caravans.getOwnedByCredentials(); },
            myProposals:      function(Proposals)    { return Proposals.getOwnedByCredentials(); },
            myInvites:        function(Proposals)    { return Proposals.getByCoAuthors(); },
            myPurchases:      function(Purchases)    { return Purchases.getOwnedByCredentials(); },
            myCertificates:   function(Certificates) { return Certificates.getOwnedByCredentials(); },
            myPromocodes:     function(Promocodes)   { return Promocodes.getOwnedByCredentials(); },
            currentProposal:  function(Proposals)    { return Proposals.current(); },
            signup:           function(Account)      { return Account.get(); },
            cfpState:         function(Proposals)    { return Proposals.cfpState(); },
            purchaseMode:     function(Purchases)    { return Purchases.purchaseMode(); },
            employees:        function(Account)      { return Account.getEmployees(); }
          }
        });

    });
  angular
    .module('segue.submission.home.controller', [])
    .controller('HomeController', function($scope, $state, $stateParams, $window,
                                           Auth, Proposals, Purchases, Account,
                                           myPurchases, myProposals, myInvites, myCaravan, myCertificates,
                                           myPromocodes, employees, Upload,
                                           currentProposal, signup, cfpState, Config,
                                           Validator, FormErrors, purchaseMode, ngToast, Restangular) {
      $scope.enforceAuth(); //FIX ME

      $scope.myCaravan       = myCaravan;
      $scope.myProposals     = myProposals;
      $scope.myInvites       = myInvites;
      $scope.myCertificates  = myCertificates;
      $scope.myPromocodes    = myPromocodes;
      $scope.myEmployees     = employees;

      $scope.myDonatations = _.filter(myPurchases, function(element) {
          return (element.product.category == 'donation');
      });
      $scope.myPurchases = _.filter(myPurchases, function(element) {
          return (element.product.category != 'donation');
      });

      $scope.purchaseMode    = purchaseMode;
      $scope.currentProposal = (_.isEmpty(currentProposal))? null : currentProposal;
      $scope.caravan_hash    = $stateParams.caravan_hash;
      $scope.cfpState        = cfpState;
      $scope.lockEmail = true;
      $scope.signup = signup;

      $scope.isCorporate = Account.isCorporate(signup);
      $scope.isForeign   = Account.isForeign(signup);


      $scope.today = new Date();

      $scope.disabilityTypes =  Account.getDisabilityTypes();
      $scope.occupationTypes = Account.getOccupationTypes();
      $scope.educationTypes = Account.getEducationTypes();

      $scope.hasCaravan = _.has(myCaravan, '$type');
      $scope.isCaravan = _.has($stateParams, 'caravan_hash') && !_.isUndefined($stateParams.caravan_hash);

      if (_.has($scope.signup, 'country')) {
        $scope.signup[Account.getDocumentField($scope.signup.country)] = $scope.signup.document;
      }

      $scope.sendGovDocument = function(file, purchase_id) {

        $scope.fileUploadError = false;
        Upload.base64DataUrl(file).then(
          function (result) {
              Purchases.sendGovDocument(result, purchase_id)
                  .then(function (result) {
                      ngToast.create({
                          content:'Documento enviado com sucesso'
                      });
                      $window.location.reload();
                  }, function (error) {
                      ngToast.create({
                          content:'Ocorreu um erro ao enviar o documento',
                          className: 'danger',
                      });
                  });
          }, function(error) {
             console.log(error);
          });
      };


      $scope.removeCurrent = function(ev) {
        $scope.currentProposal = null;
        Proposals.localForget();
        ev.stopPropagation();
      };

      $scope.payment = { method: null };

      $scope.clonePayment = function(purchaseObject) {
        purchaseObject.post('clone')
                      .then($state.reload);
      };

      var to_date = function(strDate) {
        return new Date(strDate);
      };

      $scope.canIssueNewCerts = function() {
        return _(myCertificates).where({ status: 'issuable' }).value().length > 0;
      };

      $scope.doPayment = function(purchaseObject, method) {
        purchaseObject.post('pay/' + method)
                      .then(Purchases.followPaymentInstructions);
      };

      $scope.calculateLeftAmount = function(purchase) {
          var amount = purchase.amount * purchase.qty;
          for(var i=0; i < purchase.payments.length; i++ ) {
              if(purchase.payments[i]['$type'] == 'PromoCodePayment.normal' ) {
                amount = amount - purchase.payments[i].amount;
              }
          }
          return amount;
      };

      //REMOVE
      $scope.tryToPay = function(purchase) {
          if(purchase.payments)
          {
              var payment = purchase.payments[0];
              var documents = Restangular.service('documents');
              var url = '';
              if(payment.type == 'boleto')
              {
                  url = documents
                            .one('boleto-'+payment.document_hash+'.pdf')
                            .getRequestedUrl();
              }
              else if(payment.type == 'pagseguro') {
                  $scope.doPayment(purchase, 'pagseguro');
                  url = Config.PAGSEGURO_CHECKOUT + '?code=' + payment.code;
              }
              else if(payment.type == 'paypal' ) {
                  /* The max age of the paypal token is 3 hours */
                  $scope.doPayment(purchase, 'paypal');
              }
              if( url.length > 0) {
                $window.location.href = url
              }

          }
      };


      $scope.canStartPayment = function(purchaseObject) {
        return $scope.purchaseMode == 'online' &&
               $scope.isPending(purchaseObject) &&
               $scope.paymentMethodIsBlank() &&
               $scope.isTimely(purchaseObject);
      };

      $scope.isExpired = function(purchaseObject) {
        return $scope.isPending(purchaseObject) &&
               $scope.paymentMethodIsBlank() &&
               !$scope.isTimely(purchaseObject);
      };

      $scope.isPending = function(purchaseObject) {
        return purchaseObject.status == 'pending';
      };

      $scope.isReimbursed = function(purchaseObject) {
        return purchaseObject.status == 'reimbursed';
      };

      $scope.isCancelled = function(purchaseObject) {
        return purchaseObject.status == 'cancelled';
      };


      $scope.isTimely = function(purchaseObject) {
        var today = moment(new Date())
        var due_date = moment(purchaseObject.due_date)
        return due_date.diff(today, 'days') >= 0
      };

      $scope.paymentMethodIsBlank = function() {
        return $scope.payment.method === null;
      };

      $scope.submit = function() {
        Validator.validate($scope.signup, 'accounts/edit_account')
                 .then(Account.saveIt)
                 .then($scope.home)
                 .then(ngToast.create('alterações salvas com sucesso.'))
                 .catch(FormErrors.set);
      };

      $scope.$on('auth:changed', $scope.home);
    });
})();
