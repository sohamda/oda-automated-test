const OracleBot = require('@oracle/bots-node-sdk');
const { WebhookClient, WebhookEvent } = OracleBot.Middleware;
const { messageModelUtil } = require('@oracle/bots-node-sdk/util');
const Cache = require('memory-cache');


module.exports = (app, io) => {
  const logger = console;
  // initialize the application with OracleBot
  OracleBot.init(app, {
    logger,
  });

  // add webhook integration
  const webhook = new WebhookClient({
    channel: {
      url: "https://botv2frk1I0040HE5BFBBbots-mpaasocimt.botmxp.ocp.oraclecloud.com:443/connectors/v1/tenants/idcs-6d466372210e4300bb31f4db15e8e96c/listeners/webhook/channels/85c35bb4-f544-412a-8912-a0559579f419", //process.env.BOT_WEBHOOK_URL,
      secret: "tbiwN5sfgA4uGEO0ccUgjuRGcnvMSy5W" //process.env.BOT_WEBHOOK_SECRET,
    }
  });
  
  
  // Add webhook event handlers (optional)
  webhook
    .on(WebhookEvent.ERROR, err => logger.error('Error:', err.message))
    .on(WebhookEvent.MESSAGE_SENT, message => logger.info('Message to bot:', message))
    .on(WebhookEvent.MESSAGE_RECEIVED, message => {
		// message was received from bot. forward to messaging client.
		//logger.info('Message from bot:', JSON.stringify(message));
		logger.info('Message from bot Converted :', messageModelUtil.convertRespToText(message.messagePayload));
		// TODO: implement send to client...
		doPublish(message.userId, message.messagePayload);	 
    });
	
	// publish to connected client
	doPublish = function(userId, theMessage) {
		console.log('send to webhook client : ' + userId);
		if(Cache.get(userId)) {
			io.sockets.emit(userId, {messageFromBot: theMessage, scenario: Cache.get(userId), readableMessage: messageModelUtil.convertRespToText(theMessage)});
		} else {
			console.log(userId + ' not in the cache');
		}
	};
	
	// cache user that is coming in 
	cacheUser = function(userId, scenario) {
		Cache.put(userId, scenario, 600000, function(key, value) {
			console.log('Cache with user key : ' + key + ' is getting removed after timeout of 10 minutes');
		});
	};
	
	
  // Create endpoint for bot webhook channel configurtion (Outgoing URI)
  // NOTE: webhook.receiver also supports using a callback as a replacement for WebhookEvent.MESSAGE_RECEIVED.
  //  - Useful in cases where custom validations, etc need to be performed.
  app.post('/bot/message', webhook.receiver());

  // Integrate with messaging client according to their specific SDKs, etc.
  app.post('/test/message', (req, res) => {
	  console.log("chat message received and sending it to bot : " + JSON.stringify(req.body));
	 
    const user = req.body.messageForBot.user;
	
	const MessageModel = webhook.MessageModel();
	
	// cache the user
	cacheUser(user, req.body.scenario);
	var messagePayload = '';
	
	if(req.body.type === 'text') {
		messagePayload = MessageModel.textConversationMessage(req.body.messageForBot.text);
	} else if(req.body.type === 'postback') {
		messagePayload = MessageModel.postbackConversationMessage(req.body.messageForBot.postback);
	} else if(req.body.type === 'location') {
		messagePayload = MessageModel.locationConversationMessage(req.body.messageForBot.location.latitude, req.body.messageForBot.location.longitude);
	}
	
    // construct message to bot from the client message format
    
    const message = {
      userId: user,
      messagePayload: messagePayload
    };
	
	logger.info('Message to bot:', JSON.stringify(message));
    // send to bot webhook channel
    webhook.send(message)
      .then(() => res.send('ok'), e => res.status(400).end(e.message));
  });
}