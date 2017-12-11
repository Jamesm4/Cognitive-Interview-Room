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
  moment = require('moment');

// Bootstrap application settings
require('./config/express')(app);

var log = console.log.bind(null, '  ');
var conversation;
var tone_analyzer;

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

  tone_analyzer = new watson.ToneAnalyzerV3({
    url: services.tone_analyzer[0].credentials.url || 'https://gateway.watsonplatform.net/tone-analyzer/api',
    username: services.tone_analyzer[0].credentials.username || '<username>',
    password: services.tone_analyzer[0].credentials.password || '<password>',
    version_date: process.env.tone_analyzer_version,
    version: 'v3'
  });

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

  tone_analyzer = new watson.ToneAnalyzerV3({
    url: services.tone_analyzer[0].credentials.url || 'https://gateway.watsonplatform.net/tone-analyzer/api',
    username: services.tone_analyzer[0].credentials.username || '<username>',
    password: services.tone_analyzer[0].credentials.password || '<password>',
    version_date: process.env.tone_analyzer_version,
    version: 'v3'
  });
}

// error-handler application settings
require('./config/error-handler')(app);

var port = process.env.PORT || 3000;
var host = process.env.VCAP_APP_HOST || 'localhost';
var server = app.listen(port);

console.log(pkg.name + ':' + pkg.version, host + ':' + port);

//start websockets section
var socketIO = require('socket.io');
var io = socketIO(server);

io.on('connection', (socket) => {
	console.log('Client connected');
	socket.on('disconnect', () => console.log('Client disconnected'));
	
	// demo endpoint
	// this simply starts a separate demo thread/function which will "mimic" the live input
	socket.on('demostart', () => {
		if (demo.timer != null){
			//alternately, this could be moved to the start of the loop function.
			clearTimeout(demo.timer);
			demo.timer = null;
			console.log("Restarting demo... Settings: ");
		} else
			console.log("Starting demo... Settings: ");
		console.log("Initial Delay: " + (demo.initialdelay/1000) + "s\tDelay between lines: " + (demo.interval/1000) + "s");
		demo.index = 0;
		demo.timer = setTimeout(demo.loop, demo.initialdelay);
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
demo.loop = function(){
	console.log("Sending demo line " + (demo.index+1));
	
	//insert timestamp
	demo.script[demo.index].Timestamp = moment().format('YYYY-MM-DD hh:mm:ssa');
	
	//send all the lines
	var tones = analyzeTones(demo.script[demo.index]);
	var conversation = conversationCode(demo.script[demo.index]);
	combineOutputs(demo.script[demo.index], tones, conversation);
	
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
	// Extract witness speech
	if (scriptline.Speaker == 'W') {		
		// Save witness text to witness variable
		//witness.push(scriptline);

		// Feed it to tone_analyzer
		tone_analyzer.tone(
			{
				text: scriptline.Text,
				content_type: 'text/plain'
			},
			function(error, response) {
				if (error) {
					console.log('error:', error);
					return null;
				}
				else {
					//output.push(response);
					//console.log(JSON.stringify(response, null, 2));
					//io.emit("tone", response);
					return response;
				}
			}
		);
	} return null;
}

// Conversation code
var conversationCode = function(scriptline){
	return null;
}

// Combine the outputs
var combineOutputs = function(transcript, tones, conversation){
	// hack it
	var output = JSON.parse(JSON.stringify(transcript));
	output.watson = {};
	
	if (tones != null)
		output.watson.tones = tones;
	
	if (conversation != null) 
		output.watson.conversation = conversation;
	
	io.emit("output", output);
	//LOG IT!
	console.log(JSON.stringify(output));
}