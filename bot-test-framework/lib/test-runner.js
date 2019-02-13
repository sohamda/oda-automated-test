
var self = module.exports = {
	
	validateBotResponse: function(botResponse, scenarioData, scenarioSequence) {
			
		// validate a against each response
		if(botResponse.scenario === scenarioData[scenarioSequence].name) {
			//console.log("botResponse.readableMessage :" + botResponse.readableMessage);					
			scenarioData[scenarioSequence].receive.forEach(function(eachReceive) {	
				responseExists = false; 
				//console.log("eachReceive :" + eachReceive.responseExists);
				if(!eachReceive.responseExists) {
					//console.log(" inside check ");
					//console.log("botResponse.messageFromBot.text :" + botResponse.messageFromBot.text);
					//console.log("botResponse.messageFromBot.cards :" + botResponse.messageFromBot.cards);
					
					if(botResponse.messageFromBot.text && eachReceive.text) {
						if(botResponse.messageFromBot.text === eachReceive.text) {
							//console.log(botResponse.messageFromBot.text + " exists in test def");
							responseExists = true;
						}										
					} 
					if(botResponse.messageFromBot.cards && eachReceive.cardWithTitles) {
						var allCardsExists = true;
						botResponse.messageFromBot.cards.forEach(function(card) {
							if(eachReceive.cardWithTitles.indexOf(card.title) < 0) {
								//console.log(card.title + " doesn't exists in test def");
								allCardsExists = false;
							}
						});
						responseExists = allCardsExists;
					} 
					if(botResponse.messageFromBot.actions && eachReceive.optionsWithLabels) {
						var allOptionsExists = true;
						botResponse.messageFromBot.actions.forEach(function(action) {
							Object.keys(action.postback.variables).forEach(function (key) {
								if(eachReceive.optionsWithLabels.indexOf(action.postback.variables[key]) < 0) {
									allOptionsExists = false;
								}
								
							});
						});
						responseExists = allOptionsExists;
					} 
					if(botResponse.messageFromBot.attachment && eachReceive.attachment) {
						if(botResponse.messageFromBot.attachment.type === eachReceive.attachment) {
							//console.log(botResponse.messageFromBot.attachment.type + " exists in test def");
							responseExists = true;
						};
						responseExists = responseExists;
					}
					eachReceive.responseExists = responseExists;
				}
								
			});
		}

		// generate a report
		return scenarioData;
	},
	
	updateResponseStatusToFalse: function(scenariosData) {
		scenariosData.receive.forEach(function(eachReceive) {
			if(!eachReceive.responseExists) {
				eachReceive.responseExists = false;
			}			
		});
	},
	
	updateReceiveData: function(scenariosData, botResponse) {
		
		var res = {actual: botResponse.messageFromBot, readable: botResponse.readableMessage};	
		if(scenariosData.responseFromBot) {
			scenariosData.responseFromBot.push(res);
		} else {
			scenariosData.responseFromBot = [res];
		}
		return scenariosData;
	},
	
	validateAllScenariosAreChecked: function(scenariosData) {
	
		var validateAllScenariosAreChecked = true;
		var receives = scenariosData.receive;
		for (var j = 0, len1 = receives.length; j < len1; j++) {
			//console.log("scenariosData[i].name: " + scenariosData.name + ", receives[j].responseExists :" + receives[j].responseExists);
			if(!receives[j].responseExists) {
				validateAllScenariosAreChecked = false;
				break;
			}
		}
		
		return validateAllScenariosAreChecked;	
	}
	
}


