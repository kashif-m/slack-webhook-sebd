const { httpsRequest, replaceWithUserID, log, getNames, isHex } = require("./util.js");
const Constants = require("./constants.js");

const slackSend = (payload, sendMethod, AUTH) =>
  new Promise(async (resolve, reject) => {
    let url, opts, token;

    if (sendMethod === "webhook") {
      url = Constants.SLACK_WEBHOOK_URL || AUTH;
      opts = {
        method: "POST",
        header: { "Content-Type": "application/json" },
      };
    } else {
      token = Constants.SLACK_API_TOKEN || AUTH;
      url = Constants.SLACK_API_ENDPOINTS[sendMethod];
      opts = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
    }

    try {
      if (sendMethod === "deleteMessage") log("Deleting {{id}}", payload.ts);

      else if (sendMethod === "chatUpdate")
        log("Updating {{id}}...", payload.ts);

			else if (sendMethod === "postMessage") {
        if (payload.thread_ts) log("Replying to {{id}}...", payload.thread_ts);
        else log("Sending slack message ...");
      }

      const slackResponse = await httpsRequest(url, opts, payload);

      if (slackResponse.ok) {
        if (sendMethod === "deleteMessage") log("Deleted message.");
        else if (sendMethod === "chatUpdate") log("Updated message.");
        else if (sendMethod === "postMessage") {
          if (payload.thread_ts)
            log("Message posted as thread.", payload.thread_ts);
          else log("Slack message sent.");
        }
        resolve(slackResponse);
      } else reject(slackResponse);
    } catch (err) {
      reject(err);
    }
  });

const getPayload = async (
  shortFields = [],
  longFields = [],
  buttons = [],
  args
) => {

  let notifier = "",
    channel = "",
    header = "",
    SLACK_API_TOKEN = "",
    fields = [],
    blocks = [],
    actions = [],
    fieldsToSkipTagFor;

  if (args) {
    notifier = Constants.CHANNEL || args.notifier;
    header = Constants.HEADER || args.header;
    channel = Constants.NOTIFIER || args.channel;
    SLACK_API_TOKEN = Constants.SLACK_API_TOKEN || args.SLACK_API_TOKEN;
    fieldsToSkipTagFor = args.fieldsToSkipTagFor || [];
  }

  let allFields = shortFields.concat(longFields).concat(buttons);
  while (allFields[0]) {
    let heading = allFields[0].replace(/~/g, " ");
    let value = allFields[1].replace(/~/g, " ");

    if (value === "null") {
      allFields = allFields.slice(2);
      continue;
    }

    if (value.match(/<@.*>/)) {
      if (!fieldsToSkipTagFor.includes(heading))
        value = await replaceWithUserID(value, SLACK_API_TOKEN);
      else
        value = getNames(value, true);
    }

    if (shortFields.includes(heading)) {
      fields.push({
        type: "mrkdwn",
        text: `*${heading}*\n${value}`,
      });

      if (fields.length === 2) {
        blocks.push({ type: "section", fields });
        fields = [];
      }
    } else if (buttons.includes(heading)) {
      actions.push({
        type: "button",
        text: {
          type: "plain_text",
          text: `${heading}`,
        },
        url: value,
      });
    } else if (longFields.includes(heading)) {
      if (fields.length > 0) {
        blocks.push({ type: "section", fields });
        fields = [];
      }

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${heading}*\n${value}`,
        },
      });
    }

    allFields = allFields.slice(2);
  }

  if (fields.length > 0) blocks.push({ type: "section", fields });
  if (actions.length > 0) blocks.push({ type: "actions", elements: actions });

  const payload = {
    channel: channel,
    text: `*${header}*`,
    callback_id: "randomID",
    attachments: [
      {
        color:
          notifier === "success"
            ? "#6ACC14"
            : notifier === "fail"
            ? "#FF0022"
            : notifier === "skip"
            ? "#F0FF1F"
            : isHex(notifier)
            ? notifier
            : "#363635",
        blocks: blocks,
      },
    ],
  };

  return payload;
};

module.exports = {
  getPayload,
  slackSend,
};
