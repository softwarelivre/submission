(function() {
  angular
    .module('segue.submission.errors', [])
    .service('FormErrors', function($rootScope) {
      var self = this;
      var errors = {};
      var codes = _(tv4.errorCodes).invert().value();

      self.clear = function() {
        errors = {};
        $rootScope.$broadcast('errors:clear');
      };

      self.setOne = function(field, label) {
        var path = field + "." + label;
        $rootScope.$broadcast('errors:set', path);
        console.log(path);
      };
      /* TODO: REMOVE SET FUNCTION */
      self.set = function(raw) {
        $rootScope.$broadcast('errors:clear');
        var errors = (raw.data)? raw.data.error:raw;
        _.each(errors, function(error) {
          var paramKey = (error.params)?   error.params.key               : null;
          var dataPath = (error.dataPath)? error.dataPath.replace('/','') : null;
          var field = error.field || paramKey || dataPath;
          var label = error.label || codes[error.code].toLowerCase();
          self.setOne(field, label);
        });
      };
      self.setError = function(raw) {
        $rootScope.$broadcast('errors:clear');
        var error = (raw.data)? raw.data.error:raw;
        _.each(_.keys(error.errors), function(field) {
            var fieldError = {
                'field': field,
                'msgs': error.errors[field]
            }
            $rootScope.$broadcast('errors:set', fieldError);
        });
      };
      self.setScopeError = function($scope) {
        return function(raw) {
            $scope.$broadcast('errors:clear');
            var error = (raw.data) ? raw.data.error : raw;
            _.each(_.keys(error.errors), function (field) {
                var fieldError = {
                    'field': field,
                    'msgs': error.errors[field]
                };
                $scope.$broadcast('errors:set', fieldError);
            });
        }
      };
      return self;
    })
    .directive('formErrorAny', function($timeout) {
      return function(scope, elem, attr) {
        elem.addClass("ng-hide");
        elem.addClass("error");

        scope.$on('errors:clear', function(e) { elem.addClass('ng-hide'); });
        scope.$on('errors:set',   function(e) { elem.removeClass('ng-hide'); });
      };
    })
    .directive('formError', function($timeout) {
      return function(scope, elem, attr) {
        elem.addClass("ng-hide");
        elem.addClass("error");
        var myError = "^"+attr.formError+"$";

        scope.$on('errors:clear', function(e, name) {
            //FIX ME PLEASE FIND THE FORM GROUP
            first_parent = elem.parent();
            second_parent = elem.parent().parent();
            if( first_parent.hasClass('form-group') )
            {
                first_parent.removeClass("has-error");
            }
            else if( second_parent.hasClass('form-group') )
            {
                second_parent.removeClass("has-error");
            }
            elem.addClass("ng-hide");
        });
        scope.$on('errors:set', function(e, name) {
          if (name.match(myError)) {

              attr.uibTooltip = 'After today restriction';
              //FIX ME PLEASE FIND THE FORM GROUP
            first_parent = elem.parent();
            second_parent = elem.parent().parent();
            if( first_parent.hasClass('form-group') )
            {
                first_parent.addClass("has-error");
            }
            else if(second_parent.hasClass('form-group') )
            {
                second_parent.addClass("has-error");
            }
            elem.removeClass("ng-hide");
          }
        });
      };
    })
    .directive('fieldError', function($timeout) {
      return function(scope, elem, attr) {
        elem.addClass("ng-hide");
        elem.addClass("error");
        var myError = attr.fieldError

        scope.$on('errors:clear', function(e, error) {
            formGroup = elem.parent();
            formGroup.removeClass("has-error");
            elem.addClass("ng-hide");
            elem.empty();
        });
        scope.$on('errors:set', function(e, error) {
          if (error.field == myError) {
            formGroup = elem.parent();
            formGroup.addClass("has-error");
            _.each(error.msgs, function(msg) {
                elem.append('<p class=help-block>'+ msg + '</p>');
            });
            elem.removeClass("ng-hide");
          }
        });
      };
    });
})();
