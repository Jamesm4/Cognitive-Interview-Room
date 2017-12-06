/* Copyright IBM Corp. 2015
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
        var promptValidEmail = false;
        var aboutClicked = false;
        var howToClicked = false;
        var self = this;
        var placeholderText = null;
        var states = {
            'intro': {
                'key': 'intro',
                'class': 'intro',
                'placeholder': 'Your IBM email address (e.g. jdoe@us.ibm.com)',
                'introText': ''
            },
            'chatting': {
                'key': 'chatting',
                'class': 'chatting',
                'placeholder': 'Enter your question here...',
                'introText': ''
            },
            'preview': {
                'key': 'preview',
                'class': 'preview',
                'placeholder': 'Enter your response here...',
                'introText': ''
            }
        };

        var setState = function (state) {
            self.state = _.cloneDeep(state);
        };

        // closes the How To modal and stops the video
        self.closeVideo = function () {
            $('#howtovid')[0].pause();
            return false;
        };

        // submits input and retrieves response
        self.sendInput = function (input) {
            self.question = input;
            self.submit();
        };

        // used to be able to ng-repeat for set integer
        self.range = function(number) {
          var tbr = [];
          for(var i = 0; i < number; i++) {
            tbr.push(i);
          }
          return tbr;
        };

        // check if user is returning user
        function checkCookie() {
            var username = getCookie(dialogConstants.usernameCookie);
            var ibmid = getCookie(dialogConstants.ibmIdCookie);
            if ((username !== "" && ibmid !== "") || dialogConstants.skipAuth) {
                newUser = false;
            } else {
                newUser = true;

            }
        }

        checkCookie();

        // If first time user, will set state to intro and display intro welcome page
        // otherwise will skip to chatting page
        if (newUser === true) {
            setState(states.intro);
        } else {
            setState(states.chatting);
        }
        //gets the conversation array such that it can be tracked for additions
        self.conversation = dialogService.getConversation();
        self.question = null;

        if (!self.placeHolder) {
            $('#question').removeAttr('disabled');
            $('#question').focus();
        }


        /**
         * Submits the current question using dialogService
         */
        var valid = false;
        self.submit = function () {
            var child = null;
            var timeout = null;
            var footer = null;
            if (!self.question || self.question.length === 0) {
                $('#question').focus();
                return;
            }

            // If first time user entering name then retrieve
            // user info from faces API and save ibmid in cookies otherwise submit question
            if (self.conversation.length == 0 && newUser == true && valid == false) {
                document.cookie = dialogConstants.ibmIdCookie + "=" + self.question.toLowerCase();
                getUserInfo(self.question);
            } else {
                // shifts view to bottom of scrollable div
                $('#question').attr('disabled', '');
                timeout = $timeout(function () {
                    var scrollable = $('#scrollable-div');
                    if (scrollable[0]) {
                        scrollable[0].scrollTop = scrollable[0].scrollHeight;
                    }
                }, 500);

                console.log("Question ", self.question);
                dialogService.query(self.question).then(function (response) {
                    $('#question').removeAttr('disabled');
                    $('#question').val('');
                    $('#question').focus();
                    if ($.isArray(response)) {
                        response = response[response.length - 1];

                        //don't want to put focus into the field! (we don't want the keyboard popping up)
                        if ($(window).height() > 750) {
                            $('#question').focus();
                        }
                    }
                    // scroll to bottom of screen when new responses pops up
                    // NOTE: We must include scope.apply manually so that these changes propagate properly in the view
                    //$scope.$apply(function () {
                    if ($('#scrollable-div').prop('clientHeight') < $('#scrollable-div').prop('scrollHeight')) {
                        child = document.getElementById('resize-footer-col');
                        child.style.display = 'table-cell';
                        footer = document.getElementById('dialog-footer');
                        footer.style.overflowY = 'scroll';
                        if (timeout) {
                            $timeout.cancel(timeout);
                        }
                        timeout = $timeout(function () {
                            var scrollableDiv = $('#scrollable-div');
                            child.style.display = 'none';
                            if (scrollableDiv[0]) {
                                scrollableDiv[0].scrollTop = scrollableDiv[0].scrollHeight;
                            }
                        }, 500);
                    }
                    else {
                        child = document.getElementById('resize-footer-col');
                        if (child) {
                            child.style.display = 'table-cell';
                            footer = document.getElementById('dialog-footer');
                            footer.style.overflowY = 'hidden';
                            if (timeout) {
                                $timeout.cancel(timeout);
                            }
                            timeout = $timeout(function () {
                                var scrollableDiv = $('#scrollable-div');
                                child.style.display = 'none';
                                if (scrollableDiv[0]) {
                                    scrollableDiv[0].scrollTop = scrollableDiv[0].scrollHeight;
                                }
                            }, 500);
                        }

                    }
                    // });
                }, function (error) {
                    $scope.$apply(function () {
                        console.log(error);
                        $('#question').removeAttr('disabled');
                        $('#question').val('');
                        $('#question').focus();
                    });
                });
                delete self.question;
            }
        };

        function getCookie(cname) {
            var name = cname + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        }

        // if returning user, simulate submitting name to skip welcome screen
        if (newUser == false) {
            var username = dialogConstants.skipAuth? "guest" : getCookie(dialogConstants.usernameCookie);
            self.sendInput(username);
        }

        // uses Faces API to retrieve user info from given ibm id and submits user's first name
        function getUserInfo(ibmid) {
            console.log(ibmid, 'ibmid');
            var id = "email:" + ibmid;
            var jsonData = {q: id};
            return $.ajax({
                type: "GET",
                async: true,
                cache: false,
                url: 'http://faces.tap.ibm.com/api/find/?',
                dataType: 'json',
                data: jsonData
            }).done(function (res) {
                // if Faces API returns multiple results (multiple IBMers) in returned JSON data,
                // then search through array for user's own email and check/record it
                var presentInRes = false;
                var indexEmail;
                for (var i = 0; i < res.length; i++) {
                    if (self.question.toLowerCase() == res[i].email.toLowerCase()) {
                        presentInRes = true;
                        indexEmail = i;
                        break;
                    }
                }
                // if user puts in an ibm id and it doesn't match with email returned by Faces API
                // then will be alerted with error message
                if (!presentInRes) {
                    alert("Please enter a valid IBM ID!");
                    promptValidEmail = true;
                    $('#question').removeAttr('disabled');
                    $('#question').val('');
                    $('#question').focus();
                } else {
                    // if user input valid ibm id, will be asked to confirm otherwise user will input ibm id again
                    if (confirm("Just want to make sure you're " + res[indexEmail].name +
                            ". Please hit OK if that's your name so I can remember you next time we chat! Otherwise, press Cancel and input your IBM ID again.") == true) {
                        promptValidEmail = false;
                        valid = true;
                        var indexFirstName = 0;
                        while (((res[indexEmail].name).split(" "))[indexFirstName] == ' ') {

                            indexFirstName++;
                        }
                        self.sendInput(((res[indexEmail].name).split(" "))[indexFirstName]);
                    } else {
                        // user has to input ibm id again, enable the input field box again
                        promptValidEmail = true;
                        $('#question').removeAttr('disabled');
                        $('#question').val('');
                        $('#question').focus();

                    }
                }
            })
                .fail(function (xhr, status, error) {
                    console.log(xhr);
                    console.log(status);
                    console.log(error);
                    return {
                        'name': 'error'
                    };
                })
        }

        // switch to chatting screen
        self.switchToChatting = function () {
            console.log("Switch To Chatting fn");
            $location.path('chatting');
        };

        // event listener that listens for Watson response to return and finish loading, enables user input field box again
        // after loading has completed
        $scope.$on('$viewContentLoaded', function (next, current) {
            console.log("On content loaded");
            if (placeholderText) {
                $('#question').removeAttr('disabled');
                $('#question').focus();

            }
        });

        //Watch the conversation array.. If a segment is added then update the state
        $scope.$watch(function () {
            return self.conversation;
        }, function () {
            console.log("A new response fn");
            // We have a new response, switch to 'answered' state
            if (!_.isEmpty(self.conversation)) {
                if (self.conversation.length === 1) {
                    states.intro.introText = self.conversation[0].responses;
                    $('body').addClass('dialog-body-running');
                    console.log("state key", self.state.key);
                    if (self.state.key !== states.preview.key) {
                        setState(states.chatting);
                    }
                }
            }
        }, true);
    };

    angular.module('dialog.controller', ['gettext', 'lodash', 'ngRoute', 'ngSanitize', 'ngAnimate', 'dialog.service']).config(
        function ($routeProvider) {
            $routeProvider.when('/', {
                'templateUrl': 'modules/dialog.html',
                'reloadOnSearch': false
            }).when('/chatting', {
                'templateUrl': 'modules/dialog.html',
                'reloadOnSearch': false
            });
        }).controller('DialogController', DialogController);
}());
