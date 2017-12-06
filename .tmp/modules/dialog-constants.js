/**
 *
 * IBM Confidential
 * OCO Source Materials
 *
 * (C) Copyright IBM Corp. 2001, 2015
 *
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has been
 * deposited with the U.S. Copyright Office.
 *
 */
(function () {
    'use strict';

    angular.module('dialog.constants', [])

    /**
     * @name DialogConstants
     * @module dialog/constants
     * @description
     */
        .constant('dialogConstants', {
            messages: {
                genericWelcomeMsg: 'Nice to meet you. What can I do for you?',
                personalWelcomeMsg: 'Nice to meet you, %s. What can I do for you? Here are some questions I get asked frequently to get you started:',
                personalReturnWelcomeMsg: 'Good to see you again, %s! How can I help you today?'

            },
            errorMessages: {
                lowConfError: "I'm sorry, I didn't catch that. Could you please try rephrasing your question and include the offering you are inquiring about?",
                bluemixError: "Sorry, I'm having trouble connecting to Bluemix. Please come back later!",
                timeoutError: "Sorry, I wasn't able to find you an answer. Could you please rephrase your question and include the offering you are inquiring about?",
                serviceError: "Oh no, seems like we've hit a Service error! I will log this for troubleshooting. Please try rephrasing your questions.",

            },
            url: {
                //getWCSResponse: window.location.href.split('#')[0] + 'api/message' //'http://<your_app_name>.mybluemix.net/api/message' //"http://localhost:3000/api/message"
                getWCSResponse: "http://localhost:3000/api/message"
                //getWCSResponse: 'https://<your_app_name>.mybluemix.net/api/message'
            },
            ibmIdCookie: 'ibmid',
            usernameCookie: 'username',
            skipAuth: true,
            customGreeting: false

        });
}());
