# Zero Code Testing Framework for Oracle Digital Assistant

This test framework has 2 parts :
1. bot-webhook-server
2. bot-test-framework

## bot-webhook-server
This is a webhook server based on @oracle/bots-node-sdk, sits between ODA and bot-test-framework.

Update "service.js" to provide the Webhook channel (url and secret) information.
You can get this info from the Oracle Digital Assistant console, from Channel configuration.

Deploy this module in Application Container Cloud Service (ACCS) or run this with "ngrok"

NOTE : Keep the session timeout in ODA a minumum as possible. Match it with config settings in "bot-test-framework" 

## bot-test-framework
This is zero code bot test framework, where you just need to configure the settings and define some test sceanrios, and you are ready to go :)

Update config.json

```javascript
{
	"userId": "<USER-WHO-SENDS-MESSAGE-TO-BOT>",
	"websocketEndpoint": "<ENDPOINT-WHERE_bot-webhook-server_IS-RUNNING>",
	"sendMessageToBot": "/test/message", // DONT CHANGE THIS IF YOU HAVE NOT UPDATED THIS IN bot-webhook-server.service.js
	"scenariosDirectory": "<WHERE-TO-FIND-TEST-DEFINITION-FILES>", // check out the samples inside "scenarios" folder
	"resultsDirectory": "<WHERE-TO-WRITE-THE-RESULTS>", 
	"waitTimeInMillis": <MATCH-THIS-WITH-ODA-SESSION-TIMEOUT-SETTINGS>
}
```

Define some scenarios based on the samples provided. And then you are ready to run

```
node index.js
```

## How to define tests & scenarios
1. You need to create a separate .json files for each tests. For example, order pizza, book time, file expenses etc.
2. Each test file will have:
   1. "testName"
   2. One or more "scenarios"
	
Each scenario must have:
1. name
2. send - object with property "text"/"card"/"postback"/"location"
3. receive - An array of objects with "text"/"cardWithTitles"/"optionsWithLabels"/"attachment"
   1. Define multiple receive if you expect bot to respond multiple times for one interaction.
