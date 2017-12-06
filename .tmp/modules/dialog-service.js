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
var newUser;
(function () {
    'use strict';

    angular.module('dialog.service', [])

      /**
       * @name dialogService
       * @module dialog/service
       * @description
       *
       * Implements the dialogService interface using the Orchestrator API
       */
      .service('dialogService', function (_, $http, $q, $timeout, $sce, dialogConstants) {

            var conversation = [];

            /**
             * Gets all entries (responses) in the conversation so far.
             *
             * @public
             * @return {object[]} All entries in the conversation.
             */
            var getConversation = function () {
                return conversation;
            };

            /**
             * A shorthand for retrieving the latest entry in the conversation.
             * @public
             * @return {object} The latest entry in the conversation.
             */
            var getLatestResponse = function () {
                return conversation.length > 0 ? conversation[conversation.length - 1] : undefined;
            };


            /**
             * Retrieves value stored in cookie
             *
             * @return string Value stored in cookie.
             */
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


            /**
             * Calls the Orchestrator API. Given a question/input from the
             * user a call is made to the API.
             *
             * @private
             * @return {object} A JSON object with the question, answer, source, and feedback status of a segment in the conversation.
             */

            var getResponse = function (question) {

                if (conversation.length > 1) {

                    var latestConversation = conversation.length > 0 ? conversation[conversation.length - 2] : undefined;
                    var context = latestConversation !== 'undefined' ? latestConversation.context : null;

                    var jsonDataResponse = {
                        input: {text: question},
                        alternate_intents: true,
                        context: context
                    };

                    return $http.post(dialogConstants.url.getWCSResponse, jsonDataResponse).then(function (res) {
                        return {
                            'input': res.data.input ? res.data.input.text : '',
                            'context': res.data.context,
                            'responses': res.data.output.text
                        };

                    }, function (error) {
                        console.log("ERROR");
                        console.log(error);
                        return {
                            'input': question,
                            'context': null,
                            'responses': null,
                            'source': 'ERROR'
                        };
                    });
                } else {
                    if (newUser == true && !dialogConstants.skipAuth) {
                        document.cookie = dialogConstants.usernameCookie + "=" + question;
                    }

                    if (dialogConstants.customGreeting) {
                        var deferred = $q.defer();
                        deferred.resolve({'responses': 'START_CONVERSATION', 'source': 'START_CONVERSATION'});

                        return deferred.promise;
                    } else {
                        var jsonDataResponse = {
                            input: {text: "start conversation"},
                            alternate_intents: true,
                            context: null
                        };

                        return $http.post(dialogConstants.url.getWCSResponse, jsonDataResponse).then(function (res) {
                            return {
                                'input': res.data.input ? res.data.input.text : '',
                                'context': res.data.context,
                                'responses': res.data.output.text && res.data.output.text.length > 0 ? res.data.output.text[0] : ''
                            };

                        }, function (error) {
                            console.log("ERROR");
                            console.log(error);
                            return {
                                'input': question,
                                'context': null,
                                'responses': null,
                                'source': 'ERROR'
                            };
                        });
                    }

                }
            };

            /**
             * @private
             * Returns a truncated String
             * @return string The truncated version of the text
             */
            function truncateText(text) {
                var shortenedString;
                var patt1 = /</g;
                var patt2 = />/g;
                var openHTMLTag;
                var closeHTMLTag;
                if (text.length <= 180) {
                    return text.substring(0, text.length);
                } else {

                    // checks for white spaces and closing tags so we don't return cut off words in truncated text
                    for (var i = 180; i > 0; i--) {
                        if (text.charAt(i) == " " || text.charAt(i - 1) == ">") {
                            shortenedString = text.substring(0, i);
                            break;
                        }
                    }
                    // checking for HTML tags so we don't break them
                    // if the number of open html tags don't match the number of closing html tags
                    // then we will find the closing html tags and get the substring that includes the closing
                    // html tags
                    openHTMLTag = shortenedString.match(patt1) != null? shortenedString.match(patt1).length : null;
                    closeHTMLTag = shortenedString.match(patt2) != null? shortenedString.match(patt2).length : null;
                    if (openHTMLTag !== closeHTMLTag) {
                        for (var i = shortenedString.length; i < text.length; i++) {
                            if (text.charAt(i) == ">") {
                                closeHTMLTag++;
                            }
                            if (openHTMLTag == closeHTMLTag) {
                                shortenedString = text.substring(0, i + 1);
                            }
                            break;
                        }
                    }

                    if (shortenedString.includes("<a")) {
                        // if substring includes opening link tag then find the index of the last occurrence of the
                        // opening tag
                        var openATag = shortenedString.lastIndexOf("<a");
                        // if there isn't a tag to close the link tag in substring then find
                        // the corresponding closing link tag by traversing from the opening link tag index to the end of the text
                        if (!shortenedString.includes("</a>")) {
                            var indexLinkCloseTag = text.substring(openATag, text.length).indexOf('</a>') + openATag;
                            return text.substring(0, (indexLinkCloseTag + 4));
                        } else {
                            // if there are both closing and opening link tags in substring already then return substring
                            return shortenedString;
                        }
                        // if substring doesn't contain link tags then just return the substring
                    } else {
                        return shortenedString;
                    }
                }
            }


            /**
             * Gets response and sets each segment of the
             * conversation array which is displayed in dialog-entries.html
             * @public
             * @return {object[]} An array of chat segments.
             */
            var query = function (input) {
                // push the user's question to the conversation
                conversation.push({
                    'input': conversation.length == 0 ? '' : input,
                    'context': null,
                    'discovery': false
                });

                return getResponse(input).then(function (lastRes) {
                    // if lastRes is discovery, then lastRes.responses will be an array otherwise it will be a string
                    var segment = conversation[conversation.length - 1];
                    if (lastRes && lastRes.source !== "ERROR") {
                        segment.context = lastRes.context;
                        //get last question/answer segment of conversation array
                        if (!lastRes.responses || lastRes.responses === "undefined" || (typeof lastRes.responses === "string" && lastRes.responses.trim().length === 0) || (typeof lastRes.responses === "string" && lastRes.responses === 'undefined<br>undefined')) {
                            // no response returned from api calls
                            segment.responses = dialogConstants.errorMessages.lowConfError;
                        } else {
                            // if returning user, display welcome back message instead of intro greeting message
                            if (conversation.length == 1 && dialogConstants.customGreeting) {
                                if (conversation.length == 1 && newUser === false && !dialogConstants.skipAuth) {
                                    segment.responses = sprintf(dialogConstants.messages.personalReturnWelcomeMsg, input);
                                } else if (conversation.length == 1 && newUser === true && dialogConstants.skipAuth) {
                                    // welcome greeting message
                                    segment.responses = sprintf(dialogConstants.messages.personalWelcomeMsg, input);
                                } else if (conversation.length == 1 && dialogConstants.skipAuth) {
                                    segment.responses = sprintf(dialogConstants.messages.genericWelcomeMsg, input);
                                }
                            }
                            else {
                                if(lastRes.responses instanceof Array) {
                                    if(lastRes.responses.length > 1){
                                        // discovery responses
                                        segment.discovery = true;
                                        // controls (false = collapsed /true: expanded) collapse/expand button of each disco watson response
                                        segment.clicked = true;
                                        // controls (false = close/true = open) each individual disco answer/modal within watson response
                                        segment.modalClicked = false;

                                        var firstAnswer = "Great question! I found a couple of results for you.";
                                        segment.responses = firstAnswer;
                                        // Place rest of answers in an array that will be displayed in drop down list
                                        if(lastRes.responses.length > 1){
                                            // lastRes.responses is an array of all the disco answers
                                            var allAnswers = [];
                                            for(var i = 0; i < lastRes.responses.length; i++){
                                                // take only first 180 characters of discovery response
                                                // using metadata because original source of data was database
                                                
                                                // Original source; compatible with Watson Discovery Datacrawler Documents (requires metadata field)                                                
                                                /*
                                                 * console.log(lastRes.responses[i].metadata.review_text);
                                                 * lastRes.responses[i].metadata.lessAnswers = truncateText(lastRes.responses[i].metadata.review_text) + "...";
                                                 * allAnswers.push(lastRes.responses[i].metadata);
                                                 */

                                                // Jury-rigged solution for Watson Discovery News
                                                // Mock up a version of the metadata object present in datacrawler output
                                                var text = lastRes.responses[i].text;
                                                console.log(text);
                                                
                                                var mockMetadata = { review_text : text,
                                                                     lessAnswers : truncateText(text) + "..." };

                                                allAnswers.push(mockMetadata); 

                            
                                            }

                                            segment.allResponses = allAnswers;

                                        }

                                    } else {
                                        segment.responses = typeof lastRes.responses[0] === "string"? lastRes.responses[0] : lastRes.responses[0].metadata.review_text ? lastRes.responses[0].metadata.review_text : "";
                                    }

                                } else {
                                    segment.responses = lastRes.responses;
                                }
                            }
                        }
                    } else {
                        segment.responses = dialogConstants.errorMessages.serviceError;
                    }
                    return conversation;
                }, function (error) {
                    // Watson response will be hardcoded error message if we don't receive response within 10 seconds or because system can't connect
                    if (error.statusText === 'error') {
                        conversation[index - 1].responses = dialogConstants.errorMessages.bluemixError;
                    } else if (error.statusText === 'timeout') {
                        conversation[index - 1].responses = dialogConstants.errorMessages.timeoutError;
                    }
                });

            };

            return {
                'getConversation': getConversation,
                'getLatestResponse': getLatestResponse,
                'query': query
            };
        }
      );
}());
