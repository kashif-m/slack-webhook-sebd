
const https = require('https')
const { SLACK_API_TOKEN } = require('./constants.js')

const slackAPIEndpoints = {
	users: {
		lookupByEmail: 'https://slack.com/api/users.lookupByEmail'
	}
}

const httpsRequest = (url, opts, payload = false) =>
	new Promise((resolve, reject) => {

		console.log(url)
		let messageBody = payload ? payload : ""
		if (opts.header && JSON.stringify(opts.header).includes('json'))
			try { messageBody = JSON.stringify(payload) }
			catch (err) { reject(err) }

		const req = https.request(url, opts, res => {
			let response = ''
			res.on('data', d => { response += d })
			res.on('end', () => resolve(response))
		})

		req.on('error', err => reject(err))
	  	req.write(messageBody)
	  	req.end()
	})

const replaceWithUserID = async (msg) => {
	let formattedText = msg
	const names = msg.match(/<\@([a-zA-Z]| )*>/g)
	const opts = {
		method: 'GET'
	}
	while(names.length != 0) {
		const expr = names.pop()
		const name = expr.match(/([a-zA-Z]| )*/g)[2]
		const email = name.toLowerCase().replace(/ /g, '.') + "@juspay.in"
		let URL = `${slackAPIEndpoints.users.lookupByEmail}?token=${SLACK_API_TOKEN}&email=${email}`
		try {
			const res = JSON.parse(await httpsRequest(URL, opts))
			formattedText = formattedText.replace(`${expr}`, res.ok ? `<@${res.user.id}>` : name)
		} catch (err) {
			console.log(err)
		}
	}
	return formattedText
}

const log = (str, id = null) => console.log("[slack-webhook-send] ", str.replace('{{id}}', id))

module.exports = {
	httpsRequest,
	log,
	replaceWithUserID,
	slackAPIEndpoints
}