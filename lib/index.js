
const https = require('https')

const send = (SLACK_WEBHOOK_URL, payload) =>
	new Promise((resolve, reject) => {
		let messageBody
		try {
		  	messageBody = JSON.stringify(payload)
		} catch (err) {
			reject(err)
		}
	
	  	const opts = {
			method: 'POST',
			header: { 'Content-Type': 'application/json' }
	  	}
	  
	  	const req = https.request(SLACK_WEBHOOK_URL, opts, res => {
			let response = ''

			res.on('data', d => {response += d})
			res.on('end', () => resolve(response))
	  	})
	  
	  	req.on('error', err => reject(err))
	  	req.write(messageBody)
	  	req.end()
	})

const slackSend = (SLACK_WEBHOOK_URL, payload) =>
	new Promise(async (resolve, reject) => {

		console.log('[slack-notify] Sending Slack Message')
		try {
			const slackResponse = await send(SLACK_WEBHOOK_URL, payload)
			console.log('[slack-notify] Message delivered.')
			resolve(slackResponse)
		} catch (err) {
			reject(err)
			console.log('[slack-notify] Message not sent.')
		}
	})

const getPayload = args => {

	const notifier = args[1]
	const header = args[2]
	const actions = [], fields = []
	args = args.slice(3)

	while(args[0]) {
		if(args[0].match(/(Jira Ticket|Stop Build|Review|View log|View error|Install)/)) {
		  	actions.push({
				"type": "button",
				"text": args[0],
				"url": args[1],
				"style": args[0].match(/Stop/) ? 'danger' : 'default'
		  	})
		  	args = args.slice(2)
		  	continue
		}
		fields.push({
		  	"title": args[0],
		  	"value": args[1],
		  	"short": !args[0].match(/(Changelog|Pull)/)
		})
		args = args.slice(2)
	}

	const payload = {
		"text": `*${header}*`,
		"attachments": [{
		  	"color": notifier === 'success' ? '#49C39E'
					  : notifier === 'fail' ? '#D40E0D'
					  : notifier === 'skip' ? '#EBB424'
					  : '#363635',
		  	"fields": fields,
		  	"actions": actions
		}]
	}

	return payload
}

module.exports = {
	getPayload,
	slackSend
}