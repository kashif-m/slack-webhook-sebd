# slack-webhook-send

# This README is deprecated. Will update it as soon as I get time.

 **Global Usage**
 > Install using `npm i -g slack-webhook-send`
```bash
slack-webhook-send WEBHOOK_URL \
  success|fail|skip|HEX color \
  header \
  < list of heading, value > \
  --buttons < list of buttons >
```

**Use as a library**
> Install using `npm i slack-webhook-send`
 - Form a payload ( this uses Slack Attachment )
```bash
const slack	= require('slack-webhook-send')

const notifier = "#ABABAB"
const header = "Hello from Mars"
const keyVal = [notifier, header, "Version", "10.0.3", "App Name", "bulwark", "Yea?", "http://programmingexcuses.com/"]
const buttons = ["Yea?"]

const payload = slack.getPayload (keyVal, buttons)
```
 - Send Slack Message
```bash
slack.send(SLACK_WEBHOOK_URL, payload)
	.then(res => console.log(res))
	.catch(err => console.log(err))
```


## Functions
**getPayload(args, buttons)**
- The first argument is a sequence of **Header**, **Notifier type** and a list of key-value pair.
- **Header** 			- this is the main heading of Slack message.
- **Notifier type** 	- this can be success, fail, skip or your own HEX value for the side bar color.
- **Key - value pair**	- this is a sequence of message content to be sent.

**send(SLACK_WEBHOOK_URL, payload)**
- Make sure your Slack App has [Incoming Webhooks](https://api.slack.com/messaging/webhooks) turned on.

## Refer for clarity
**[Slack Attachments](https://api.slack.com/messaging/composing/layouts#attachments)**

**[Incoming Webhooks](https://api.slack.com/messaging/webhooks)**

## Notes
- Button title needs to be followed by a valid URL or it is not gonna show up.