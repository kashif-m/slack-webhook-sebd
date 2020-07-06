
const { httpsRequest, replaceWithUserID, log } = require('./util.js')
const Constants = require('./constants.js')

const isHex = val => val.match(/^#[a-eA-E0-9]{6}/) ? true : false

const slackSend = payload =>
	new Promise(async (resolve, reject) => {

		const url = Constants.SLACK_WEBHOOK_URL
		log("Sending slack message ...")
		try {
			const opts = {
				method: 'POST',
				header: { 'Content-Type': 'application/json' }
			}
			const slackResponse = await httpsRequest(url, opts, payload)
			log("Message delivered.")
			resolve(slackResponse)
		} catch (err) {
			log("Message not sent.")
			reject(err)
		}
	})

const getPayload = async (args, buttons) => {

	const header	= Constants.HEADER
	const notifier	= Constants.NOTIFIER
	const actions = [], fields = []

	while(args[0]) {
		console.log(args[0])
		if(buttons && buttons.includes(args[0]))
		  	actions.push({
				"type": "button",
				"text": args[0],
				"url": args[1],
				"style": args[0].match(/Stop/) ? 'danger' : 'default'
		  	})
		else {
			let msg = args[1]
			if(args[1].match(/<@.*>/)) msg = await replaceWithUserID(args[1])
			fields.push({
				"title": args[0],
				"value": msg,
				"short": !args[0].match(/(Changelog|Pull|Path)/)
			})
		}
		args = args.slice(2)
	}

	const payload = {
		"text": `*${header}*`,
		"attachments": [{
		  	"color": notifier === 'success' ? '#49C39E'
					  : notifier === 'fail' ? '#D40E0D'
					  : notifier === 'skip' ? '#EBB424'
					  : isHex(notifier) ? notifier : '#363635',
		  	"fields": fields,
		  	"actions": actions
		}]
	}

	console.log(payload)

	return payload
}

module.exports = {
	getPayload,
	slackSend
}