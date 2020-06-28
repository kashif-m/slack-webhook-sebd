#!/usr/bin/env node

// USAGE
// $ npm run slackSend webhook_url < success | fail | skip > header < list of heading, value >
// eg: $ npm run slackSend https://hooks.slack.com... success "Release Scope" beta Version 2.0rc1

(async () => {
	
	const lib = require('../lib/index.js')
	const args = Array.from(process.argv.slice(2)).filter(a => !a.match(/^--/) && a !== 'slackSend')
	const SLACK_WEBHOOK_URL = args[0]
	const payload = lib.getPayload(args)
	try {
		const response = await lib.slackSend(SLACK_WEBHOOK_URL, payload)
		console.log(`Response: ${response}`)
	} catch(err) {
		console.log(`Response: ${err}`)
	}
})()