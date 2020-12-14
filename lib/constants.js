let token = null,
	webhookURL = null,
	args = Array.from(process.argv.slice(2));

if (process.argv.includes("--token"))
  token = process.argv[process.argv.indexOf("--token") + 1];
if (process.argv.includes("--webhook"))
  webhookURL = process.argv[process.argv.indexOf("--webhook") + 1];

const { decideOperation } = require("./util"),
	isWriteOperation = decideOperation(args) == "write";

let notifier = isWriteOperation ? args[0] : null,
	header = isWriteOperation ? args[1] : null,
	channel = isWriteOperation ? args[2] : null;

module.exports = {
  SLACK_API_TOKEN: token,
  SLACK_WEBHOOK_URL: webhookURL,
  NOTIFIER: notifier,
  HEADER: header,
  CHANNEL: channel,
  SLACK_API_ENDPOINTS: {
    postMessage: "https://slack.com/api/chat.postMessage",
    authTest: "https://slack.com/api/auth.test",
    lookupByEmail: "https://slack.com/api/users.lookupByEmail",
    chatUpdate: "https://slack.com/api/chat.update",
		deleteMessage: "https://slack.com/api/chat.delete",
		readMessage: "https://slack.com/api/conversations.history",
		readThread: "https://slack.com/api/conversations.replies",
  },
};
