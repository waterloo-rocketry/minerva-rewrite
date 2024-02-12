import { Middleware, SlackCommandMiddlewareArgs } from "@slack/bolt";
import { logCommandUsed } from "../../utils/logging";
import { postEphemeralMessage } from "../../utils/slack";
import SlackChannel from "../../classes/SlackChannel";
import { getDefaultSlackChannels, parseEscapedSlashCommandChannel } from "../../utils/channels";

export const notifyCommandHandler: Middleware<SlackCommandMiddlewareArgs> = async ({ command, ack, client }) => {
  await ack();
  await logCommandUsed(command);

  const tokens = command.text.split(" ");

  if (tokens.length == 0) {
    postEphemeralMessage(
      client,
      command.channel_id,
      command.user_id,
      "Please provide a message to send. Usage: `/notify <messageURL>`",
    );
    return;
  }

  // Check if first token is a valid URL
  const url = tokens.shift() as string;
  if (!url.startsWith("http")) {
    postEphemeralMessage(
      client,
      command.channel_id,
      command.user_id,
      "Please provide a valid message URL as the first argument.",
    );
    return;
  }

  let pingChannels = false;

  if (tokens.length > 0 && tokens[0] == "ping") {
    pingChannels = true;
    tokens.shift();
  }

  // If no channels specified, send to default
  let channels: SlackChannel[] = [];

  if (tokens.length == 1) {
    channels = await getDefaultSlackChannels(client);
  } else {
    for (const channelString of tokens) {
      let channel: SlackChannel;
      try {
        channel = parseEscapedSlashCommandChannel(channelString);
      } catch (e) {
        postEphemeralMessage(
          client,
          command.channel_id,
          command.user_id,
          `Error parsing channel \`${channelString}\`: ${e}`,
        );
        return;
      }
      channels.push(channel);
    }
  }

  const message = pingChannels ? `<!channel>\n${url}` : url;

  for (const channel of channels) {
    await client.chat.postMessage({
      channel: channel.id,
      text: message,
    });
  }
};

export default notifyCommandHandler;
