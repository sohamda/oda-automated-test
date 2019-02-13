
const io = require('socket.io-client');
const PubSub = require('pubsub-js');
const Cache = require('memory-cache');
var colors = require('colors');

const fileReader = require('./lib/file-reader');
const messageToBot = require('./lib/message-to-bot');
const testRunner = require('./lib/test-runner');
const config = require('./config.json');

// global variables/configurations

var userId = process.env.userId || config.userId;
const websocketEndpoint = process.env.websocketEndpoint || config.websocketEndpoint; //'https://4c354226.ngrok.io';
const sendMessageToBotEndpoint = websocketEndpoint + (process.env.sendMessageToBot || config.sendMessageToBot);//'/test/message';

const scenariosDirectory = process.env.scenariosDirectory || config.scenariosDirectory; //'./scenarios/';
const resultsDirectory = process.env.resultsDirectory || config.resultsDirectory; //'./results';
const waitTimeInMillis = process.env.waitTimeInMillis || config.waitTimeInMillis;

// clear cache before starting
Cache.clear();

var fileSequence = -1;
Cache.put('fileSequence', fileSequence);


var fileNames = fileReader.fileNames(scenariosDirectory);
Cache.put('fileNames', fileNames);

var resultsFolder = fileReader.createResultsFolder(resultsDirectory);
Cache.put('resultsFolder', resultsFolder);

Cache.put('totalTestDefs', 0);
Cache.put('totalScenariosPassed', 0);
Cache.put('totalScenariosExecuted', 0);


/**
* Read the next file from "scenariosDirectory" and put the content in the Cache and then publish event > Read_Next_Scenario
* When there are no files to read, publish an event to print the final results.
*
*/
var readNextFileSubscriber = function(msg, data) {
	//console.log("Inside readNextFileSubscriber");	
	
	var nextFileSeq = Cache.get('fileSequence') + 1;
	var fileNames = Cache.get('fileNames');
	
	if(!fileNames[nextFileSeq]) {	
		PubSub.publish('Print_Final_Results', 'hello world!');	
	} else {
		//console.log("Executing, sequence for files : " + nextFileSeq + ", reading file :" + fileNames[nextFileSeq])
		console.log("Executing test definitions from file :" + fileNames[nextFileSeq]);
		var content = fileReader.fileContent(scenariosDirectory, fileNames[nextFileSeq]);
		content = JSON.parse(content);
		
		var scenarioSequence = -1;
		Cache.del('scenariosData');Cache.del('scenarioSequence');Cache.del('testName');Cache.del('scenariosPassed');
						
		// update/initialize cache
		Cache.put('scenarioSequence', scenarioSequence);
		Cache.put('testName', content.testName);
		Cache.put('scenariosData', content.scenarios);
		Cache.put('fileSequence', nextFileSeq);
		// global print variables
		Cache.put('totalTestDefs', (Cache.get('totalTestDefs') + 1));
		
		
		Cache.put('scenariosPassed', 0);
		
		// publish to start first scenario 
		//console.log("firing Read_Next_Scenario");
		PubSub.publish('Read_Next_Scenario', 'hello world!');	
	}
};


/**
* Read the next Scenario from the Cache, send Message to bot and handles timeout on response from bot.
* When there are no Scenarios to read, publish an event to read the next file.
*
*/
var readNextScenarioSubscriber = function(msg, data) {
	//console.log("Inside readNextScenarioSubscriber");
	
	var nextScenarioSeq = Cache.get('scenarioSequence') + 1;
	var scenarioData = Cache.get('scenariosData');
	
	//console.log("nextScenarioSeq :" + nextScenarioSeq);
	
	if(!scenarioData[nextScenarioSeq]) {
		//console.log("firing Read_Next_File");
		// write to file
		var resultsFolder = Cache.get('resultsFolder');
		var testname = Cache.get('testName');
		fileReader.writeResults(resultsFolder, testname, scenarioData);	

		Cache.put('totalScenariosPassed', (Cache.get('totalScenariosPassed') + Cache.get('scenariosPassed')));
		Cache.put('totalScenariosExecuted', (Cache.get('totalScenariosExecuted') + scenarioData.length));		
		PubSub.publish('Print_Results', 'hello world!');
		
	} else {		
		//console.log("Executing scenario:" + JSON.stringify(scenarioData[nextScenarioSeq]));
		console.log("Executing scenario:" + scenarioData[nextScenarioSeq].name);
		messageToBot.sendMessage(scenarioData, nextScenarioSeq, userId, sendMessageToBotEndpoint);
		
		// test scenario on never received reply (not received in 20 secs).
		Cache.put('timeout', 'checkResponse', 20000, function(key, value) {			
			
			var scenarioSeq = Cache.get('scenarioSequence');
			var scenariosData = Cache.get('scenariosData');
			if(!testRunner.validateAllScenariosAreChecked(scenariosData[scenarioSeq])) {
				console.log(colors.red('timeout occurred on timeout cache...'));	
				testRunner.updateResponseStatusToFalse(scenariosData[scenarioSeq]);
				testRunner.updateReceiveData(scenariosData[scenarioSeq], {messageFromBot: "", readableMessage: ""});
				PubSub.publish('Read_Next_Scenario', 'hello world!');	
			}
		});
				
		// update cache
		Cache.put('scenarioSequence', nextScenarioSeq);
	}
};

/**
* Validates the response coming from bot and once validated fire the event to read next scenario.
*/
var validateResponse = function(msg, data) {
	//console.log("Inside validateResponse");
	
	var scenarioSeq = Cache.get('scenarioSequence');
	var scenariosData = Cache.get('scenariosData');
	
	// store the response to use it in next communication
	scenariosData[scenarioSeq] = testRunner.updateReceiveData(scenariosData[scenarioSeq], data);		
	
	//validate bot response
	scenariosData = testRunner.validateBotResponse(data, scenariosData, scenarioSeq);
	
	//console.log("scenariosData[scenarioSeq]: " + JSON.stringify(scenariosData[scenarioSeq]));
	
	// update cache
	Cache.put('scenariosData', scenariosData);
	
	// once everything is validated then fire the next scenario
	if(testRunner.validateAllScenariosAreChecked(scenariosData[scenarioSeq])) {
		//console.log("firing Read_Next_Scenario");	
		var scenariosPassed = Cache.get('scenariosPassed');
		Cache.put('scenariosPassed', scenariosPassed+1);
		PubSub.publish('Read_Next_Scenario', 'hello world!');		
	}	
};


var printResults = function(msg, data) {
	//console.log("Inside printResults");
	var testName = Cache.get('testName');
	var scenariosPassed = Cache.get('scenariosPassed');
	var scenariosData = Cache.get('scenariosData');
	console.log(colors.blue("------------------------------------------------------------------"));
	console.log(colors.yellow("Test execution complete for : " + testName));
	console.log(colors.yellow("Scenarios executed : " + scenariosData.length));
	console.log(colors.green("Passed : " + scenariosPassed) + "   	 	" + colors.red("Failed : " + (scenariosData.length - scenariosPassed)));
	console.log(colors.blue("------------------------------------------------------------------"));
	console.log();
	setTimeout(function() {PubSub.publish('Read_Next_File', 'hello world!');}, waitTimeInMillis);
	
};

var printFinalResults = function(msg, data) {

	var totalTestDefs = Cache.get('totalTestDefs');
	var totalScenariosPassed = Cache.get('totalScenariosPassed');
	var totalScenariosExecuted = Cache.get('totalScenariosExecuted');
	console.log(colors.magenta("------------------------------------------------------------------"));
	console.log(colors.yellow("Test execution completed. Total test definitions : " + totalTestDefs));
	console.log(colors.yellow("Total Scenarios executed : " + totalScenariosExecuted));
	console.log(colors.green("Total Passed : " + totalScenariosPassed) + "   		" + colors.red("Total Failed : " + (totalScenariosExecuted - totalScenariosPassed)));
	console.log(colors.blue("Results in :" + Cache.get('resultsFolder')));
	console.log(colors.magenta("------------------------------------------------------------------"));
	process.exit(0);
};



PubSub.subscribe('Read_Next_File', readNextFileSubscriber);
PubSub.subscribe('Read_Next_Scenario', readNextScenarioSubscriber);
PubSub.subscribe('Validate_Response', validateResponse);
PubSub.subscribe('Print_Results', printResults);
PubSub.subscribe('Print_Final_Results', printFinalResults);

// pubsub to receive the response from bot
var socket = io.connect(websocketEndpoint, {reconnect: true});

socket.on('connect', function(){
	console.log("client connected to server : " + websocketEndpoint);
	//console.log("firing Read_Next_File");
	PubSub.publish('Read_Next_File', 'hello world!');
});

socket.on(userId, function(data){
	console.log("got update from bot:" + data);
	// publish to start validation
	//console.log("firing Validate_Response");
	PubSub.publish('Validate_Response', data);	
});

