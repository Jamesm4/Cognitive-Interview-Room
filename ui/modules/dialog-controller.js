(function () {
    'use strict';

    /**
     * @name DialogController
     * @module dialog/controller
     * @description
     *
     * Controls the state of the Practitioner Assistant view. At any given point of time, the Practitioner Assistant is in one of the following states:
     *
     * - initial  The "home" view displayed to the user when launching dialog
     * - chatting  The view displayed when user is typing a new response/question
     * - preview  The view is showing a movie preview
     * - favorites  When in small resolutions the favorites panel is displayed
     *
     */
    var DialogController = function (_, $rootScope, $scope, $location, $anchorScroll, $timeout, gettextCatalog, dialogService, dialogConstants) {

      console.log("Enter dialog controller.");
      var socket = io();

      $(document).ready(function() {
        $("input#demo").click(function() {
            console.log("Starting demo!");
            socket.emit('demostart');
          });

        $("input#cisl").click(function() {
          alert("Not currently connected to CISL. Try the demo button!");
        });

        createToneAnalysis();

      });

      socket.on('output', function(msg) {
        console.log(msg);

        var timestamp = msg.Timestamp.split(' ');
        timestamp = timestamp[timestamp.length - 1];

        var speaker = (msg.Speaker === "I") ? "Interviewer" : "Witness";
        var sclass = speaker.toLowerCase();

        var html = `<p style="margin-bottom: 0.25em;">[${timestamp}] <span class="${sclass}">(${speaker})</span>: ${msg.Text}</p>`;

        $('div.transcript').append(html);
      });

    };

    angular.module('dialog.controller', ['gettext', 'lodash', 'ngRoute', 'ngSanitize', 'ngAnimate', 'dialog.service'])
      .config(function ($routeProvider) {
            $routeProvider.when('/', {
                'templateUrl': 'modules/dialog.html',
                'reloadOnSearch': false
            }).when('/chatting', {
                'templateUrl': 'modules/dialog.html',
                'reloadOnSearch': false
            });
        })
        .controller('DialogController', DialogController);

    var createToneAnalysis = function() {

      console.log("Creating tone analysis.");

      var svg = d3.select("svg#tone-analysis");

    }
}());
