
const { httpsRequest, replaceWithUserID, log } = require('./util.js')
const Constants = require('./constants.js')

const isHex = val => val.match(/^#[a-fA-F0-9]{6}/) ? true : false

const slackSend = (payload, sendMethod = 'postMessage') =>
	new Promise(async (resolve, reject) => {

		let url, opts, token

		if(sendMethod === 'webhook') {
			url = Constants.SLACK_WEBHOOK_URL
			opts = {
				method: 'POST',
				header: { 'Content-Type': 'application/json' }
			}
		} else if(sendMethod === 'postMessage') {
			token	= Constants.SLACK_API_TOKEN
			url 	= Constants.SLACK_API_ENDPOINTS.postMessage
			opts	= {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			}
		}

		log("Sending slack message ...")
		try {

			const slackResponse = await httpsRequest(url, opts, payload)
			if(slackResponse.ok) {
				log("Message delivered.")
				resolve(slackResponse)
			} else reject(slackResponse)
		} catch(err) {
			reject(err)
		}
	})

const getPayload = async (args, buttons) => {

	const channel	= Constants.CHANNEL
	const header	= Constants.HEADER
	const notifier	= Constants.NOTIFIER
	let fields 		= []
	let blocks 		= []
	let actions 	= []

	while(args[0]) {

		let heading	 = args[0].replace(/~/g, ' ')
		let value 	 = args[1].replace(/~/g, ' ')

		if(value === 'null') {
			args = args.slice(2)
			continue
		}

		if(value.match(/<@.*>/)) value = await replaceWithUserID(value)

		if(heading.match(/(repository|commit|version|release scope|build number|development build|app name|app id|source branch|destination branch|reporter|reviewers|approvers|product manager|triggered by)/i)) {

			value = heading.match(/(development build|build number|reporter|reviewers|approvers|product manager|triggered by|app id|app name|repository|commit)/i) ? value : `\`${value}\``
			fields.push({
				"type": "mrkdwn",
				"text": `*${heading}*\n${value}`
			})

			if(fields.length === 2) {
				blocks.push({ "type": "section", fields })
				fields = []
			}
		} else {

			if(buttons.includes(heading)) {
				actions.push({
					"type": "button",
					"text": {
						"type": "plain_text",
						"text": `${heading}`
					},
					"url": value
				})
			} else {
				if(fields.length > 0) {
					blocks.push({ "type": "section", fields })
					fields = []
				}
				blocks.push({
					"type": "section",
					"text": {
						"type": "mrkdwn",
						"text": `*${heading}*\n${value}`
					}
				})	
			}
		}

		args = args.slice(2)
	}

	if(fields.length > 0) blocks.push({ "type": "section", fields })

	blocks.push({
		"type": "actions",
		"elements": actions
	})

	const payload = {
		"channel": channel,
		"text": `*${header}*`,
		"attachments": [{
		  	"color": notifier === 'success' ? '#6ACC14'
					  : notifier === 'fail' ? '#FF0022'
					  : notifier === 'skip' ? '#F0FF1F'
					  : isHex(notifier) ? notifier : '#363635',
			"blocks": blocks
		}]
	}

	console.log(payload)

	return payload
}

module.exports = {
	getPayload,
	slackSend
}