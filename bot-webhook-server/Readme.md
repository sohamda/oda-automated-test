## bot-webhook-server

This is a webhook server based on @oracle/bots-node-sdk, sits between ODA and bot-test-framework.

Update "service.js" to provide the Webhook channel (url and secret) information. You can get this info from the Oracle Digital Assistant console, from Channel configuration.

Deploy this module in Application Container Cloud Service (ACCS) or run this with "ngrok"

NOTE : Keep the session timeout in ODA a minumum as possible. Match it with config settings in "bot-test-framework"
