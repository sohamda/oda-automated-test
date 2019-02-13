

## Zero Code Test framework 

This is zero code bot test framework, where you just need to configure the settings and define some test sceanrios, and you are ready to go :)

Update config.json

```
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

