#!/usr/bin/env node

// USAGE
// $ slack-webhook-send webhook_url < success | fail | skip > header < list of heading, value >
// eg: $ slack-webhook-send https://hooks.slack.com... success "Release Scope" beta Version 2.0rc1

(async () => {
	
	const lib				= require('../lib/index.js')

	const args 				= Array.from(process.argv.slice(2))
	const index				= args.indexOf('--buttons')
	const buttons			= args.slice(index + 1)
	const keyVal			= args.slice(1, index)

	const payload = lib.getPayload(keyVal, buttons)
	try {
		const SLACK_WEBHOOK_URL = args[0]
		const response = await lib.send(SLACK_WEBHOOK_URL, payload)
		console.log(`Response: ${response}`)
	} catch(err) {
		console.log(`Response: ${err}`)
	}
})()