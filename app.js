/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'),
  app = express(),
  pkg = require('./package.json'),
  Q = require('q'),
  fs = require('fs'),
  watson = require('watson-developer-cloud'),
  moment = require('moment'),
  socketIO = require('socket.io'),
  request = require('request');

// Bootstrap application settings
require('./config/express')(app);

var log = console.log.bind(null, '  ');
var conversation;
// var tone_analyzer;

var allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
};

app.use(allowCrossDomain);

// set credentials from bluemix or local .env file
if (process.env.VCAP_SERVICES) {
  console.log("setting vcap services");
  var services = JSON.parse(process.env.VCAP_SERVICES);

  conversation = new watson.ConversationV1({
    url: services.conversation[0].credentials.url || 'https://gateway.watsonplatform.net/conversation/api',
    username: services.conversation[0].credentials.username || '<username>',
    password: services.conversation[0].credentials.password || '<password>',
    version_date: process.env.conversation_version,
    version: 'v1'
  });

  /*
  tone_analyzer = new watson.ToneAnalyzerV3({
    url: services.tone_analyzer[0].credentials.url || 'https://gateway.watsonplatform.net/tone-analyzer/api',
    username: services.tone_analyzer[0].credentials.username || '<username>',
    password: services.tone_analyzer[0].credentials.password || '<password>',
    version_date: process.env.tone_analyzer_version,
    version: 'v3'
  });
  */

} else {
  // load the environment variables - for local testing
  if (fs.existsSync('./.env.js')) {
    Object.assign(process.env, require('./.env.js'));
  }

  var services = JSON.parse(process.env.VCAP_SERVICES);

  conversation = new watson.ConversationV1({
    url: services.conversation[0].credentials.url || 'https://gateway.watsonplatform.net/conversation/api',
    username: services.conversation[0].credentials.username || '<username>',
    password: services.conversation[0].credentials.password || '<password>',
    version_date: process.env.conversation_version,
    version: 'v1'
  });

  /*
  tone_analyzer = new watson.ToneAnalyzerV3({
    url: services.tone_analyzer[0].credentials.url || 'https://gateway.watsonplatform.net/tone-analyzer/api',
    username: services.tone_analyzer[0].credentials.username || '<username>',
    password: services.tone_analyzer[0].credentials.password || '<password>',
    version_date: process.env.tone_analyzer_version,
    version: 'v3'
  });
  */
}

// error-handler application settings
require('./config/error-handler')(app);

var port = process.env.PORT || 3000;
var host = process.env.VCAP_APP_HOST || 'localhost';
var server = app.listen(port);

console.log(pkg.name + ':' + pkg.version, host + ':' + port);

/*******************************
*                              *
*  start main server section!  *
*                              *
*******************************/
var io = socketIO(server);
// store a persistent ID for the conversation agent.
var conversationContext = null;

var connections = 0;
io.on('connection', (socket) => {
	connections++;
	console.log('Client connected');
	socket.on('disconnect', () => {
		console.log('Client disconnected');
		if (demo.timer != null && (--connections) <= 0){
			connections = 0;
			console.log("Killing demo.");
			clearTimeout(demo.timer);
			demo.timer = null;
		}
	});
	
	// demo endpoint
	// this simply starts a separate demo thread/function which will "mimic" the live input
	socket.on('demostart', () => {
		if (demo.timer != null){
			//alternately, this could be moved to the start of the loop function.
			console.log("Restarting demo... Settings: ");
			clearTimeout(demo.timer);
			demo.timer = null;
		} else
			console.log("Starting demo... Settings: ");
		console.log("Initial Delay: " + (demo.initialdelay/1000)
			+ "s\tDelay between lines: " + (demo.interval/1000) + "s");
		demo.initialize();
	});
});

// Begin demo section
var demo = {};
//time between demo things
demo.interval = 5000;
demo.initialdelay = 3000;
demo.jsonfile = require("./script_demo.json");
demo.script = demo.jsonfile.script;
demo.length = demo.script.length;
demo.index = 0;
demo.timer = null;
demo.initialize = function(){
	demo.index = 0;
	conversationContext = null;
	//initialize the conversation agent
	conversation.message({
		workspace_id: process.env.workspace_id,
	}, function(error, response) {
		if (error) {
			console.log('error:', error);
			console.log('Demo failed to start!');
		}
		else {
			console.log('Demo started');
			conversationContext = response.context;
			demo.timer = setTimeout(demo.loop, demo.initialdelay);
		}
	});
}
demo.loop = function(){
	console.log("Sending demo line " + (demo.index+1));
	
	//insert timestamp
	demo.script[demo.index].Timestamp = moment().format('YYYY-MM-DD hh:mm:ssa');
	
	//Do all the actions
	analyzeTones(demo.script[demo.index]);
	conversationCode(demo.script[demo.index]);
	output.transcriptCallback(demo.script[demo.index]);
	
	demo.index++;
	if (demo.index < demo.length){
		demo.timer = setTimeout(demo.loop, demo.interval);
	} else{
		//clear timers and finish
		demo.timer = null;
		console.log("Demo finished!");
	}
};

// tone analyzer
var analyzeTones = function(scriptline){
	// console.log(scriptline);
	// Extract witness speech
	if (scriptline.Speaker == 'W') {
		
		request({
			uri: "http://localhost:5000/sentiments",
			method: "POST",
			form: { text: scriptline["Text"] }
		},
		function(error, response, body) {
			if (error) {
				console.log('error:', error);
				output.tonesCallback(null);
			}
			else {
				output.tonesCallback(body);
			}

		});
		/*
		// Feed it to tone_analyzer
		tone_analyzer.tone(
			{
				text: scriptline.Text,
				content_type: 'text/plain'
			},
			function(error, response) {
				if (error) {
					console.log('error:', error);
					output.tonesCallback(null);
				}
				else {
					output.tonesCallback(response);
				}
			}
		);
		*/
	} //Send null callback if not witness text 
	else output.tonesCallback(null);
}

// Conversation code
var conversationCode = function(scriptline){
	conversation.message({
		workspace_id: process.env.workspace_id,
			context: conversationContext,
		input: {'text': scriptline.Speaker + ": " + scriptline.Text}
	}, function(error, response) {
		if (error) {
			console.log('error:', error);
			output.conversationCallback(null);
		}
		else {
                        conversationContext = response.context;
			if (response.context.Brightness != null){
				cisl.brightness(response.context.Brightness);
			}if (response.context.Sound != null){
				cisl.sounds(response.context.Sound);
			}
			output.conversationCallback(response);
		}
	});
}

//Handle the outputs
//this probably could be a bit better...
//overlaps would definately be an issue... (fixed by using an arraylist instead)
var output = {};
output.tonesFlag = false;
output.transcriptFlag = false;
output.conversationFlag = false;
output.tones = null;
output.transcript = null;
output.conversation = null;

//callback functions
output.transcriptCallback = function(transcript){
	if (transcript != null)
		output.transcript = JSON.parse(JSON.stringify(transcript));
	output.transcriptFlag = true;
	output.tryOutput();
}
output.tonesCallback = function(tones){
	if (tones != null)
		output.tones = JSON.parse(JSON.stringify(tones));
	output.tonesFlag = true;
	output.tryOutput();
}
output.conversationCallback = function(conversation){
	if (conversation != null)
		output.conversation = JSON.parse(JSON.stringify(conversation));
	output.conversationFlag = true;
	output.tryOutput();
}

//try the outputs
output.tryOutput = function(){
	//If this doesn't work, then try again another day!
	if (output.tonesFlag && output.transcriptFlag && output.conversationFlag){
		var out = output.transcript;
		
		out.watson = {};
		out.watson.tones = output.tones;
		out.watson.conversation = output.conversation;
		
		io.emit("output", out);
		//LOG IT!
		// console.log(JSON.stringify(out, null, 2));
		
		//reset everything
		output.tonesFlag = false;
		output.transcriptFlag = false;
		output.conversationFlag = false;
		output.tones = null;
		output.transcript = null;
		output.conversation = null;
	}
}

//Cisl stuff...
var cisl = {};
cisl.brightness = function(brightness){
	if (brightness < 0){
		console.log("Making room darker");
	}if (brightness > 0){
		console.log("Making room brigher");
	}
}
cisl.sounds = function(sound){
	if (sound === "off") return;
	console.log("Playing sound: " + sound);
}
