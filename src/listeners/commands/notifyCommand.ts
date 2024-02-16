import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from "@slack/bolt";

import { logCommandUsed } from "../../utils/logging";
import { postEphemeralMessage, postMessage } from "../../utils/slack";
import SlackChannel from "../../classes/SlackChannel";
import {
  extractChannelIdFromMessageLink,
  getDefaultSlackChannels,
  parseEscapedSlashCommandChannel,
} from "../../utils/channels";
import { slackWorkspaceUrl } from "../../common/constants";
import { SlackLogger } from "../../classes/SlackLogger";
import { loggingChannel } from "../../common/constants";
import ObjectSet from "../../classes/ObjectSet";

export type NotifyParameters = {
  messageUrl: string;
  pingChannels: boolean;
  includeDefaultChannels: boolean;
  channels: SlackChannel[];
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

  const { channels, includeDefaultChannels, messageUrl, pingChannels } = notifyParams;

  const message = pingChannels ? `<!channel>\n${messageUrl}` : messageUrl;
  const channelSet = new ObjectSet<SlackChannel>((c) => c.id);

  if (includeDefaultChannels) {
    // When default is specified, we filter out the channel that the message is in
    const messageChannelId = extractChannelIdFromMessageLink(messageUrl);
    const channelsToAdd = (await getDefaultSlackChannels(client)).filter((c) => c.id != messageChannelId);
    for (const channel of channelsToAdd) {
      channelSet.add(channel);
    }
  }

  for (const channel of channels) {
    channelSet.add(channel);
  }

  try {
    for (const channel of channelSet.values()) {
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

  const channels: SlackChannel[] = [];
  let includeDefaultChannels = false;

  if (tokens.length == 0) {
    includeDefaultChannels = true;
  } else {
    for (const channelString of tokens) {
      if (channelString == "default") {
        includeDefaultChannels = true;
        continue;
      } else {
        let channel: SlackChannel;
        try {
          channel = parseEscapedSlashCommandChannel(channelString);
        } catch (e) {
          throw new Error(`Error parsing channel \`${channelString}\`: ${e}`);
        }
        channels.push(channel);
      }
    }
  }

  return { messageUrl, includeDefaultChannels, pingChannels, channels };
}
