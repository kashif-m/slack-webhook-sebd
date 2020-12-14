const https = require("https");

const httpsRequest = (url, opts, payload = false) =>
  new Promise((resolve, reject) => {
    let messageBody = payload ? payload : "";
    if (opts.headers && JSON.stringify(opts.headers).includes("json"))
      try {
        messageBody = JSON.stringify(payload);
      } catch (err) {
        reject(err);
      }
    const req = https.request(url, opts, (res) => {
      let response = "";
      res.on("data", (d) => {
        response += d;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(response));
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(messageBody);
    req.end();
  });

const replaceWithUserID = async (msg, SLACK_API_TOKEN = "") => {
  const Constants = require("./constants.js");
  let formattedText = msg;
  const names = getNames(msg);
  const opts = {
    method: "GET",
  };
  while (names.length != 0) {
    const expr = names.pop();
    let name = expr.match(/([a-zA-Z]| )*/g)[2];
    const ns = name.split(" ");
    let URLs = [];

    name = ns.length > 2 ? `${ns[0]} ${ns.slice(1).join("")}` : name;
    const email = name.toLowerCase().replace(/ /g, ".") + "@juspay.in";

    URLs.push(
      `${Constants.SLACK_API_ENDPOINTS.lookupByEmail}?token=${SLACK_API_TOKEN}&email=${email}`
    );

    if (ns.length > 1 && ns[1].length === 1) {
      let _email = `${ns[0].toLowerCase()}@juspay.in`;
      URLs.push(
        `${Constants.SLACK_API_ENDPOINTS.lookupByEmail}?token=${SLACK_API_TOKEN}&email=${_email}`
      );
    }

    try {
      while (URLs.length > 0) {
        let res = await httpsRequest(URLs[0], opts);
        if (res.ok) {
          formattedText = formattedText.replace(
            `${expr}`,
            res.ok ? `<@${res.user.id}>` : name
          );
          break;
        } else if (!res.ok && URLs.length === 1)
          formattedText = formattedText.replace(`${expr}`, name);
        URLs = URLs.slice(1);
      }
    } catch (err) {
      console.log(err);
    }
  }
  return formattedText;
};

const decideOperation = (args) => args.includes("--readMessage") || args.includes("--readThread") ? "read" : "write";

const parseSlackReadArguments = (_args) => {
  const tsIndex = _args.indexOf("--ts"),
    channelIndex = _args.indexOf("--channel"),
    cursorIndex = _args.indexOf("--cursor"),
    inclusiveIndex = _args.indexOf("--inclusive"),
    latestIndex = _args.indexOf("--latest"),
    limitIndex = _args.indexOf("--limit"),
    oldestIndex = _args.indexOf("--oldest"),
    readMethod = _args.includes("--readMessage") ? "readMessage"
      : _args.includes("--readThread") ? "readThread"
      : "none";

  let ts = tsIndex > -1 && _args.length > tsIndex ? _args[tsIndex + 1] : false,
    channel = channelIndex > -1 && _args.length > channelIndex ? _args[channelIndex + 1] : false,
    cursor = cursorIndex > -1 && _args.length > cursorIndex ? _args[cursorIndex + 1] : false,
    inclusive = inclusiveIndex > -1 && _args.length > inclusiveIndex ? _args[inclusiveIndex + 1] : false,
    latest = latestIndex > -1 && _args.length > latestIndex ? _args[latestIndex + 1] : false,
    limit = limitIndex > -1 && _args.length > limitIndex ? _args[limitIndex + 1] : false,
    oldest = oldestIndex > -1 && _args.length > oldestIndex ? _args[oldestIndex + 1] : false;

  return {
    ts,
    channel,
    cursor,
    inclusive,
    latest,
    limit,
    oldest,
    readMethod,
  }
}

const parseSlackWriteArguments = (_args) => {
  args = _args.slice(3);

  let buttons = false,
    shortFields = false,
    longFields = false;
  const bIndex = _args.indexOf("--buttons");
  if (bIndex > -1 && _args.length > bIndex) {
    let temp = _args.slice(bIndex + 1).filter((item) => item.match(/^--/));
    let toIndex = temp.length > 0 ? _args.indexOf(temp[0]) : _args.length - 1;
    buttons = _args.slice(bIndex + 1, toIndex);
  }

  const sfIndex = _args.indexOf("--short");
  if (sfIndex > -1 && _args.length > sfIndex) {
    let temp = _args.slice(sfIndex + 1).filter((item) => item.match(/^--/));
    let toIndex = temp.length > 0 ? _args.indexOf(temp[0]) : _args.length - 1;
    shortFields = _args.slice(sfIndex + 1, toIndex);
  }

  const lfIndex = _args.indexOf("--long");
  if (lfIndex > -1 && _args.length > lfIndex) {
    let temp = _args.slice(lfIndex + 1).filter((item) => item.match(/^--/));
    let toIndex = temp.length > 0 ? _args.indexOf(temp[0]) : _args.length - 1;
    longFields = _args.slice(lfIndex + 1, toIndex);
  }

  const uIndex = _args.indexOf("--update");
  const update =
    uIndex > -1 && _args.length > uIndex ? _args[uIndex + 1] : false;
  const rIndex = _args.indexOf("--reply");
  const reply =
    rIndex > -1 && _args.length > rIndex ? _args[rIndex + 1] : false;
  const dIndex = _args.indexOf("--delete");
  const _delete =
    dIndex > -1 && _args.length > dIndex ? _args[dIndex + 1] : false;

  return {
    longFields,
    shortFields,
    buttons,
    reply,
    update,
    _delete,
  };
};

const getNames = (str, parse = false) => {
  const names = str.match(/<\@([a-zA-Z]| )*>/g) || [];
  let formattedText = str;

  if (parse && names.length > 0) {
    for (index in names) {
      const expr = names[index];
      let _name = expr.match(/([a-zA-Z]| )*/g)[2];
      const replaceBy = index == names.length - 1 ? _name : `${_name}, `;
      formattedText = formattedText.replace(`${expr}`, replaceBy);
    }

    return formattedText;
  }

  return names;
};

const isHex = (val) => (val.match(/^#[a-fA-F0-9]{6}/) ? true : false);

const log = (str, id = null) =>
  console.log("[slack-webhook-send] ", str.replace("{{id}}", id));

module.exports = {
  httpsRequest,
  log,
  parseSlackWriteArguments,
  parseSlackReadArguments,
  replaceWithUserID,
  getNames,
  isHex,
  decideOperation,
};
