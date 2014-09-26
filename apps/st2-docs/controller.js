'use strict';
angular.module('main')
  .config(function ($stateProvider) {

    $stateProvider
      // Controller for testing. Won't show up in main menu.
      .state('docs', {
        url: '/docs',
        controller: 'st2DocsCtrl',
        templateUrl: 'apps/st2-docs/template.html'
      })

      ;
  });

angular.module('main')

  // Docs controller
  .controller('st2DocsCtrl', function ($scope, st2Api) {
    $scope.rules = st2Api.rules.list();

    $scope.actions = st2Api.actions.list();
    $scope.actions.$promise.then(function (actions) {
      var id = _.first(actions, { name: 'http' })[0].id;
      $scope.action = st2Api.actions.get({ id: id});
    });

    $scope.triggers = st2Api.triggers.list();

    $scope.triggerInstances = st2Api.triggerInstances.list();

    $scope.actionExecutions = st2Api.actionExecutions.list();

    $scope.history = st2Api.history.list();
  })

  .filter('getProperty', function () {
    return function getPropertyFilter (property, propertyName) {
      var parts = propertyName.split('.')
        , length = parts.length;

      for (var i = 0; i < length; i++) {
        property = property[parts[i]];
      }

      return property;
    };
  });