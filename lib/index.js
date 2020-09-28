
const { httpsRequest, replaceWithUserID, log } = require('./util.js')
const Constants = require('./constants.js')

const isHex = val => val.match(/^#[a-fA-F0-9]{6}/) ? true : false

const slackSend = (payload, sendMethod, AUTH) =>
	new Promise(async (resolve, reject) => {

		let url, opts, token

		if(sendMethod === 'webhook') {
			url = Constants.SLACK_WEBHOOK_URL || AUTH
			opts = {
				method: 'POST',
				header: { 'Content-Type': 'application/json' }
			}
		} else {
			token	= Constants.SLACK_API_TOKEN || AUTH
			url 	= Constants.SLACK_API_ENDPOINTS[sendMethod]
			opts = {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			}
		}

		try {

			if(sendMethod === 'deleteMessage') log('Deleting {{id}}', payload.ts)
			else if(sendMethod === 'chatUpdate') log('Updating {{id}}...', payload.ts)
			else if(sendMethod === 'postMessage') {
				if(payload.thread_ts) log('Replying to {{id}}...', payload.thread_ts)
				else log('Sending slack message ...')
			}

			const slackResponse = await httpsRequest(url, opts, payload)

			if(slackResponse.ok) {
				if(sendMethod === 'deleteMessage') log('Deleted message.')
				else if(sendMethod === 'chatUpdate') log('Updated message.')
				else if(sendMethod === 'postMessage') {
					if(payload.thread_ts) log('Message posted as thread.', payload.thread_ts)
					else log('Slack message sent.')
				}
				resolve(slackResponse)
			} else reject(slackResponse)
		} catch(err) {
			reject(err)
		}
	})

const getPayload = async (shortFields = [], longFields = [], buttons = [], NOTIFIER, CHANNEL, HEADER, SLACK_API_TOKEN = false) => {

	const channel	= Constants.CHANNEL  || CHANNEL
	const header	= Constants.HEADER   || HEADER
	const notifier	= Constants.NOTIFIER || NOTIFIER
	let fields 		= []
	let blocks 		= []
	let actions 	= []

	let args = shortFields.concat(longFields)
	while(args[0]) {

		let heading	 = args[0].replace(/~/g, ' ')
		let value 	 = args[1].replace(/~/g, ' ')

		if(value === 'null') {
			args = args.slice(2)
			continue
		}

		if(value.match(/<@.*>/)) value = await replaceWithUserID(value, SLACK_API_TOKEN)

		if(shortFields.includes(heading)) {
			fields.push({
				"type": "mrkdwn",
				"text": `*${heading}*\n${value}`
			})

			if(fields.length === 2) {
				blocks.push({ "type": "section", fields })
				fields = []
			}
		} else {

			if(buttons && buttons.includes(heading)) {
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

	if(actions.length > 0)
		blocks.push({ "type": "actions", "elements": actions })

	const payload = {
		"channel": channel,
		"text": `*${header}*`,
		"callback_id": "randomID",
		"attachments": [{
		  	"color": notifier === 'success' ? '#6ACC14'
					  : notifier === 'fail' ? '#FF0022'
					  : notifier === 'skip' ? '#F0FF1F'
					  : isHex(notifier) ? notifier : '#363635',
			"blocks": blocks
		}]
	}

	return payload
}

module.exports = {
	getPayload,
	slackSend
}