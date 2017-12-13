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

      var updateTones;

      $(document).ready(function() {
        $("input#demo").click(function() {
            console.log("Starting demo!");
            socket.emit('demostart');
          });

        $("input#cisl").click(function() {
          alert("Not currently connected to CISL. Try the demo button!");
        });

        updateTones = createToneAnalysis();

      });

      socket.on('output', function(msg) {
        // console.log(msg);

        var timestamp = msg.Timestamp.split(' ');
        timestamp = timestamp[timestamp.length - 1];

        var speaker = (msg.Speaker === "I") ? "Interviewer" : "Witness";
        var sclass = speaker.toLowerCase();
        var html = `<p style="margin-bottom: 0.25em;">[${timestamp}] <span class="${sclass}">(${speaker})</span>: ${msg.Text}</p>`;
        $('div.transcript').append(html);

        if(msg.watson.tones !== null) updateTones(msg.watson.tones.document_tone.tones);
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

      var width = 900;
      var height = 900;
      var margin = 100;

      var wrap = svg.append('g')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'tone-wrap');

      // Title
      var titleWrap = wrap.append('g')
        .attr('transform', `translate(${width/2}, ${margin/2})`)
        .attr('class', 'titleWrap');

      titleWrap.append('text')
        .style('text-anchor', 'middle')
        .style('font-size', '2em')
        .style('font-weight', 'bold')
        .text('Tone Analysis');

      // Axis
      var axisWrap = wrap.append('g')
        .attr('width', width - 2 * margin)
        .attr('height', height - 2 * margin)
        .attr('transform', `translate(${margin},${margin})`)
        .attr('class', 'axis-wrap');

      axisWrap.append('line')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', 0)
        .attr('y2', height-margin*2)
        .attr('class', 'yAxis');

      axisWrap.append('line')
        .attr('x1', 0)
        .attr('x2', width-margin)
        .attr('y1', height-margin*2)
        .attr('y2', height-margin*2)
        .attr('class', 'xAxis');

      axisWrap.append('text')
        .attr('transform', `rotate(-90) translate(${-(height-margin*2)/2}, ${-margin/2})`)
        .style('text-anchor', 'middle')
        .style('font-size', '1.75em')
        .style('font-weight', 'bold')
        .text('Confidence');

      axisWrap.append('text')
        .attr('transform', `translate(${-margin/4}, ${(height-margin*2)})`)
        .style('text-anchor', 'end')
        .style('font-size', '1.75em')
        .style('font-weight', 'bold')
        .text('0');

      axisWrap.append('text')
        .attr('transform', `translate(${-margin/4}, 20)`)
        .style('text-anchor', 'end')
        .style('font-size', '1.75em')
        .style('font-weight', 'bold')
        .text('1');

      axisWrap.append('text')
        .attr('transform', `translate(${(width-margin)/2}, ${height-3*margin/2})`)
        .style('text-anchor', 'middle')
        .style('font-size', '1.75em')
        .style('font-weight', 'bold')
        .text('Tones');

      // Bar Wrap
      var barWrap = wrap.append('g')
        .attr("transform", `translate(${margin}, ${margin})`)
        // .attr("transform", `translate(0, ${height-margin*2})`)
        .attr('class', 'bar-wrap');

      var updateTones = function(tones) {

        // console.log(tones);

        barWrap.selectAll('*').remove();

        var color = d3.scaleOrdinal(d3.schemeCategory20)
          .domain([
            "fear",
            "tentative",
            "analytical",
            "sadness",
            "anger",
            "joy",
            "confident"
          ]);

        var y = d3.scaleLinear()
          .domain([0, 1])
          .range([height-margin*2, 0]);

        var barSpace = 20;
        var barWidth = ((width - 2 * margin - barSpace * tones.length) / tones.length);

        var bars = barWrap.selectAll('g')
          .data(tones)
          .enter().append('g')
          .attr("transform", function(d, i) { return `translate(${i * (barWidth + barSpace) + barSpace/2}, 0)`; })

        bars.append("rect")
          .attr("y", function(d) { return y(d.score); })
          .attr("height", function(d) { return (height-margin*2-1) - y(d.score); })
          .attr("width", barWidth)
          .style("fill", function(d) { return color(d.tone_id); });

        bars.append("text")
         .attr("transform", function(d) { return `translate(${barWidth/2}, ${y(d.score) - 10} )`; })
         .style('text-anchor', 'middle')
         .style('font-size', '1.75em')
         .style('font-weight', 'bold')         
         .text(function(d) { return d.tone_name; });

      };

      return updateTones;

    }
}());
