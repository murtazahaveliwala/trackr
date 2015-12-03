(function() {
  var app = angular.module('trackrAdmin', []);

  app.controller('ServerControlController', [
    '$scope',
    '$http',
    '$timeout',
    function($scope, $http, $timeout) {
      var MESSAGE_TIMEOUT = 1000,
          FETCH_TIMEOUT = 2000;

      $scope.ping = '';
      $scope.pingInProgress = false;

      $scope.checkStatus = function() {
        $scope.pingInProgress = true;

        $http.get('/check').success(function(response) {

          $scope.ping = response;
          $scope.pingInProgress = false;
          resetMessage();
        }).error(function(response) {
          $scope.ping = -1;
          $scope.pingInProgress = false;
          console.log('Error checking server\'s status', response);
          resetMessage();
        });

        function resetMessage() {
          $timeout(function() {
            $scope.ping = '';
          }, MESSAGE_TIMEOUT);
        }
      };

      $scope.duration = 5;
      $scope.startConfirmation = '';
      $scope.startInProgress = false;
      $scope.probeRequesterStarted = false;

      $scope.startProbeRequester = function() {
        $scope.startInProgress = true;
        $scope.startConfirmation = '';

        var duration = '';
        if ($scope.duration) {
          duration = $scope.duration * 1000; // convert to millis
        }

        $http.get('/start/' + duration).
            success(function(response) {
              $scope.startConfirmation = response;
              $scope.startInProgress = false;
              $scope.probeRequesterStarted = true;
              resetMessage();
            }).error(function(response) {
              $scope.startConfirmation = '';
              $scope.startInProgress = false;
              console.log('Error starting server\'s probe requester', response);
              resetMessage();
            });

        function resetMessage() {
          $timeout(function() {
            $scope.startConfirmation = '';
          }, MESSAGE_TIMEOUT);
        }
      };

      $scope.stopConfirmation = '';
      $scope.stopInProgress = false;

      $scope.stopProbeRequester = function() {
        $scope.stopInProgress = true;
        $scope.stopConfirmation = '';

        $http.get('/stop').
            success(function(response) {
              $scope.stopConfirmation = response;
              $scope.stopInProgress = false;
              $scope.probeRequesterStarted = false;
              resetMessage();
            }).error(function(response) {
              $scope.stopConfirmation = '';
              $scope.stopInProgress = false;
              console.log('Error stopping server\'s probe requester', response);
              resetMessage();
            });

        function resetMessage() {
          $timeout(function() {
            $scope.stopConfirmation = '';
          }, MESSAGE_TIMEOUT);
        }
      };

      $scope.readings = {};
      $scope.fetchingReadings = false;
      $scope.fetchReadings = function() {
        $scope.fetchingReadings = true;

        $http.get('/readings').
            success(function(response) {
              $scope.readings = response;
              $scope.fetchingReadings = false;
            }).
            error(function(response) {
              $scope.fetchingReadings = false;
              console.log('Error receiving readings!', response);
            });
      };

      var fetcherTimeout = undefined;
      $scope.autoFetch = false;
      $scope.toggleFetchReadings = function() {
        $scope.autoFetch = !$scope.autoFetch;

        if ($scope.autoFetch) {
          fetcherTimeout = $timeout(function fetch() {
            $scope.fetchReadings();

            fetcherTimeout = $timeout(fetch, FETCH_TIMEOUT);
          }, FETCH_TIMEOUT);
        } else {
          $timeout.cancel(fetcherTimeout);
        }
      };
    }
  ]);
})();