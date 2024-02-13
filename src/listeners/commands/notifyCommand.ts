import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from "@slack/bolt";
import { StringIndexed } from "@slack/bolt/dist/types/helpers";

import { logCommandUsed } from "../../utils/logging";
import { postEphemeralMessage } from "../../utils/slack";
import SlackChannel from "../../classes/SlackChannel";
import { getDefaultSlackChannels, parseEscapedSlashCommandChannel } from "../../utils/channels";
import { slackWorkspaceUrl } from "../../common/constants";
import { SlackLogger } from "../../classes/SlackLogger";

type NotifyParameters = {
  messageUrl: string;
  pingChannels: boolean;
  channels: SlackChannel[] | "default";
};

/**
 * Handles the /notify command
 * @param obj The arguments for the middleware
 * @param obj.ack The Bolt app's `ack()` function
 * @param obj.command The command payload
 * @param obj.client The Bolt app client
 * @returns A promise of void
 */
export default async function notifyCommandHandler({
  ack,
  command,
  client,
}: SlackCommandMiddlewareArgs & AllMiddlewareArgs<StringIndexed>): Promise<void> {
  await ack();
  await logCommandUsed(command);

  let notifyParams: NotifyParameters;

  try {
    notifyParams = parseNotifyCommand(command.text);
  } catch (e) {
    if (e instanceof Error) {
      await postEphemeralMessage(client, command.channel_id, command.user_id, e.message);
    } else {
      await postEphemeralMessage(client, command.channel_id, command.user_id, "An unknown error occurred.");
    }

    return;
  }

  let { channels } = notifyParams;
  const { messageUrl, pingChannels } = notifyParams;

  const message = pingChannels ? `<!channel>\n${messageUrl}` : messageUrl;

  if (channels == "default") {
    channels = await getDefaultSlackChannels(client);
  }

  for (const channel of channels) {
    await client.chat.postMessage({
      channel: channel.id,
      text: message,
    });
  }

  SlackLogger.getInstance().info(
    `Notified channels ${channels.map((c) => `\`${c.name}\``).join(", ")} about message \`${messageUrl}\``,
  );
}

/**
 * Parses the `/notify` command and returns the parameters
 * @param command The arguments of the `/notify` command
 * @returns The parameters for the notify command
 */
function parseNotifyCommand(command: string): NotifyParameters {
  const tokens = command.split(" ");

  if (tokens.length == 0) {
    throw new Error("Please provide a message to send. Usage: `/notify <messageURL>`");
  }

  // Check if first token is a valid URL
  const messageUrl = tokens.shift() as string;
  if (!messageUrl.startsWith(`${slackWorkspaceUrl}/archives/`)) {
    throw new Error("Please provide a valid message URL from this Slack workspace as the first argument.");
  }

  let pingChannels = false;

  if (tokens.length > 0 && tokens[0] == "ping") {
    pingChannels = true;
    tokens.shift();
  }

  let channels: SlackChannel[] | "default" = [];

  if (tokens.length == 0) {
    channels = "default";
  } else {
    for (const channelString of tokens) {
      let channel: SlackChannel;
      try {
        channel = parseEscapedSlashCommandChannel(channelString);
      } catch (e) {
        throw new Error(`Error parsing channel \`${channelString}\`: ${e}`);
      }
      channels.push(channel);
    }
  }

  return { messageUrl, pingChannels, channels };
}
