import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from "@slack/bolt";

import { logCommandUsed } from "../../utils/logging";
import { postEphemeralMessage, postMessage } from "../../utils/slack";
import SlackChannel from "../../classes/SlackChannel";
import { getDefaultSlackChannels, parseEscapedSlashCommandChannel } from "../../utils/channels";
import { slackWorkspaceUrl } from "../../common/constants";
import { SlackLogger } from "../../classes/SlackLogger";
import { loggingChannel } from "../../common/constants";

export type NotifyParameters = {
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
  command,
  ack,
  client,
}: SlackCommandMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
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

  channels = channels.filter((c) => c.id != command.channel_id);

  try {
    for (const channel of channels) {
      await postMessage(client, channel, message);
    }
  } catch (e) {
    await postEphemeralMessage(
      client,
      command.channel_id,
      command.user_id,
      `An error occurred while notifying the channels. Check <#${loggingChannel.id}> for more details.`,
    );
    return;
  }

  const responseMessage = `Notified channels ${channels
    .map((c) => `\`${c.name}\``)
    .join(", ")} about message \`${messageUrl}\``;

  await postEphemeralMessage(client, command.channel_id, command.user_id, responseMessage);

  SlackLogger.getInstance().info(responseMessage);
}

/**
 * Parses the `/notify` command and returns the parameters
 * @param command The arguments of the `/notify` command
 * @returns The parameters for the notify command
 */
export function parseNotifyCommand(command: string): NotifyParameters {
  const tokens = command.split(" ");

  if (tokens.length == 1 && tokens[0].trim() == "") {
    throw new Error("Please provide a message to send. Usage: `/notify <messageURL>`");
  }

  // Check if first token is a valid URL
  // Links will be wrapped in < and >, so we remove those
  const messageUrl = (tokens.shift() as string).replace(/<|>/g, "");
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
