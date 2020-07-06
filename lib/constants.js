
let token = null, webhookURL = null
let args 			= Array.from(process.argv.slice(2))
if(process.argv.includes('--token'))	token		= process.argv[process.argv.indexOf('--token') + 1]
if(process.argv.includes('--webhook'))	webhookURL	= process.argv[process.argv.indexOf('--webhook') + 1]
const notifier		= args[0]
const header		= args[1]
const channel		= args[2]

module.exports = {
	SLACK_API_TOKEN: token,
	SLACK_WEBHOOK_URL: webhookURL,
	NOTIFIER: notifier,
	HEADER: header,
	CHANNEL: channel,
	SLACK_API_ENDPOINTS: {
		postMessage		:	'https://slack.com/api/chat.postMessage',
		authTest		:	'https://slack.com/api/auth.test',
		lookupByEmail	:	'https://slack.com/api/users.lookupByEmail',
	}
}