#!/usr/bin/env node

// USAGE
// $ slack-webhook-send < success | fail | skip > header < list of heading, value > --webhook <SLACK_WEBHOOK_URL>
// eg: $ slack-webhook-send success "Release Scope" beta Version 2.0rc1 --webhook https://hooks.slack.com...

(async () => {
	
	const lib			= require('../lib/index.js')
	const util			= require('../lib/util.js')
	let args 			= Array.from(process.argv.slice(2))
	args 				= args.slice(3)

	const buttonsIndex	= args.indexOf('--buttons')
	let buttons			= buttonsIndex > 0 ? args.slice(buttonsIndex + 1) : false
	let temp			= buttons && buttons.filter(item => item.includes('--')) || []
	let index			= buttons && buttons.indexOf(temp.length > 0 ? temp[0] : "") || -1
	buttons				= index > 0 ? buttons.slice(0, index) : buttons

	temp				= args.filter(item => item.match(/^--/))
	index		 		= args.indexOf(temp.length > 0 ? temp[0] : "" )
	let keyVal			= index > 0 ? args.slice(0, index) : args

	try {
		const payload	= await lib.getPayload(keyVal, buttons)
		const response	= await lib.slackSend(payload, 'postMessage')
	} catch(err) {
		util.log("Message not sent.\nResponse:")
		console.log(err)
	}
})()