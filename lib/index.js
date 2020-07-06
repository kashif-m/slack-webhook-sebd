
const { httpsRequest, replaceWithUserID, log } = require('./util.js')
const Constants = require('./constants.js')

const isHex = val => val.match(/^#[a-eA-E0-9]{6}/) ? true : false

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
			} else throw new Error(slackResponse)
		} catch(err) {
			log("Message not sent.")
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

		let sliceVal = 2
		let heading	 = args[0].replace('~', ' ')
		let value 	 = args[1].replace('~', ' ')
		if(value.match(/<@.*>/)) value = await replaceWithUserID(value)

		if(heading.match(/(repository|commit|version|release scope|build number|development build|app name|app id|source branch|destination branch|reporter|reviewers|approvers|product manager|triggered by)/i)) {

			value = heading.match(/(development build|build number|reporter|reviewers|approvers|product manager|triggered by)/i) ? value
				: heading.match(/repository/i) ? `<https://bitbucket.org/juspay/${value}|\`${value}\`>`
				: `\`${value}\``
			if(heading.match(/commit/i)) {
				const commit_link = args[1]
				const commit_hash = args[1].replace(/.*\//, '')
				value = `*${heading}*\n<${commit_link}|\`${commit_hash}\`>`
			}
			fields.push({
				"type": "mrkdwn",
				"text": heading.match(/commit/i) ? value : `*${heading}*\n${value}`
			})

			if(fields.length === 2) {
				blocks.push({"type": "section", fields})
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
			} else blocks.push({
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": `*${heading}*\n${value}`
				}
			})
		}

		args = args.slice(sliceVal)
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
		  	"color": notifier === 'success' ? '#49C39E'
					  : notifier === 'fail' ? '#D40E0D'
					  : notifier === 'skip' ? '#EBB424'
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