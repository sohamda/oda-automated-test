const request = require('request');

var self = module.exports = {
	
	// call /test/message endpoint
	sendMessageToBot: function(sendMessageToBotEndpoint, message) {
		console.log("Sending message to bot: " + JSON.stringify(message));
		request.post(sendMessageToBotEndpoint, { json: message }, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					console.log("Message sent to bot : " + body)
				}
			}
		);
	},
	
	constructPostbackFromCards: function(botResponse, testDefinitionsPostback) {
		
		var message = '';
		//console.log("postback check botResponse: " + botResponse);
		botResponse.cards.forEach(function(eachcard) {
			eachcard.actions.forEach(function(eachaction) {
				//console.log("postback check stringify: " + JSON.stringify(eachaction.postback.variables));				
				Object.keys(eachaction.postback.variables).forEach(function (key) {
					//console.log("postback check keys: " + eachaction.postback.variables[key]);			
					          
					if(eachaction.postback.variables[key] === testDefinitionsPostback) {						
						message = {
							"variables" : eachaction.postback.variables,
							"action": eachaction.postback.action
							//"state": eachaction.postback.system.state						
						};
					}
				});				
			});			
		});
		//console.log("returning: " + JSON.stringify(message));
		return message;
	},
	
	constructPostbackFromAction: function(botResponse, testDefinitionsPostback) {
		
		var message = '';
		//console.log("postback check testDefinitionsPostback: " + testDefinitionsPostback);
		botResponse.actions.forEach(function(eachaction) {
			//console.log("postback check stringify: " + JSON.stringify(eachaction.postback.variables));				
			Object.keys(eachaction.postback.variables).forEach(function (key) {
				//console.log("postback check keys: " + eachaction.postback.variables[key]);			
						  
				if(eachaction.postback.variables[key] === testDefinitionsPostback) {						
					message = {
						"variables" : eachaction.postback.variables,
						"action": eachaction.postback.action
					};
				}
			});				
		});
		//console.log("returning: " + JSON.stringify(message));
		return message;
	},

	sendMessage: function(scenarioData, nextScenarioSeq, userId, sendMessageToBotEndpoint) {
		
		var scenarioName = scenarioData[nextScenarioSeq].name;
		if(scenarioData[nextScenarioSeq].send.text) {
			message = { messageForBot: {user: userId, text: scenarioData[nextScenarioSeq].send.text}, type: 'text', scenario: scenarioName };
			self.sendMessageToBot(sendMessageToBotEndpoint, message);
		} else if(scenarioData[nextScenarioSeq].send.location) {	
			message = { messageForBot: {user: userId, location: scenarioData[nextScenarioSeq].send.location}, type: 'location', scenario: scenarioName };
			self.sendMessageToBot(sendMessageToBotEndpoint, message);
		} else if(nextScenarioSeq > 0 && scenarioData[nextScenarioSeq - 1].responseFromBot) {
			//console.log("scenarioData[nextScenarioSeq].responseFromBot: " + JSON.stringify(scenarioData[nextScenarioSeq -1]));
			var responsesFromBot = scenarioData[nextScenarioSeq - 1].responseFromBot;
			//console.log("responsesFromBot: " + JSON.stringify(responsesFromBot));
			var lastResponseFromBot = responsesFromBot[responsesFromBot.length -1].actual;
			//console.log("lastResponseFromBot: " + JSON.stringify(lastResponseFromBot));
			
			if(lastResponseFromBot && scenarioData[nextScenarioSeq].send.card) {			
				postbackMsg = self.constructPostbackFromCards(lastResponseFromBot, scenarioData[nextScenarioSeq].send.card);
				//console.log(postbackMsg);
				message = { messageForBot: {user: userId, postback: postbackMsg}, type: 'postback', scenario: scenarioName };
				self.sendMessageToBot(sendMessageToBotEndpoint, message);
			} else if(lastResponseFromBot && scenarioData[nextScenarioSeq].send.postback) {			
				postbackMsg = self.constructPostbackFromAction(lastResponseFromBot, scenarioData[nextScenarioSeq].send.postback);
				//console.log(postbackMsg);
				message = { messageForBot: {user: userId, postback: postbackMsg}, type: 'postback', scenario: scenarioName };
				self.sendMessageToBot(sendMessageToBotEndpoint, message);
			} 
		} else {
			console.log("No message sent to bot, either 'send' object is empty or we don't have a previous response..");
		}
	}
}

