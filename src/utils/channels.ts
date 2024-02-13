import { WebClient } from "@slack/web-api";
import SlackChannel from "../classes/SlackChannel";
import ObjectSet from "../classes/ObjectSet";
import { defaultSlackChannels } from "../common/constants";
import { SlackLogger } from "../classes/SlackLogger";

/**
 * Filters a Slack channel from an array of channels based on its name.
 * @param name - The name of the channel to filter.
 * @param channels - The array of Slack channels to filter from.
 * @returns The filtered Slack channel, or undefined if not found.
 * @throws Error if the name is "default" (as it is a group of channels) or if no channel with the given name is found.
 */
export function filterSlackChannelFromName(name: string, channels: SlackChannel[]): SlackChannel | undefined {
  if (name == "default") throw new Error("`default` is not a valid channel name, as it is a group of channels");
  const channel = channels?.find((channel) => channel.name === name);
  if (channel == undefined) throw new Error(`could not find channel with name "${name}"`);

  return channel;
}

/**
 * Filters multiple Slack channels from an array of channels based on their names.
 * @param names - The names of the channels to filter.
 * @param channels - The array of Slack channels to filter from.
 * @returns An array of filtered Slack channels.
 */
export function filterSlackChannelsFromNames(names: string[], channels: SlackChannel[]): SlackChannel[] {
  const res = new ObjectSet<SlackChannel>((channel) => channel.name);

  for (const name of names) {
    // If the name is "default", it filters the default Slack channels defined in the constants.
    if (name == "default") {
      filterDefaultSlackChannels(channels).forEach((channel) => res.add(channel));
    } else {
      const channel = channels.find((channel) => channel.name === name);
      // If a channel with a given name is not found, it logs an error and continues to the next name.
      if (channel == undefined) {
        SlackLogger.getInstance().warning(`could not find channel with name \`${name}\` when filtering channels`);
        continue;
      }

      // If a channel has an undefined name or id, it logs an error and continues to the next channel.
      if (channel.name == undefined || channel.id == undefined) {
        SlackLogger.getInstance().error(
          `channel with name \`${name}\` has undefined name or id. This should not happen.`,
        );
        continue;
      }

      res.add(new SlackChannel(channel.name, channel.id));
    }
  }

  return res.values();
}

/**
 * Filters the default Slack channels from an array of channels.
 * @param channels - The array of Slack channels to filter from.
 * @returns An array of filtered default Slack channels.
 */
export function filterDefaultSlackChannels(channels: SlackChannel[]): SlackChannel[] {
  return filterSlackChannelsFromNames(defaultSlackChannels, channels);
}

/**
 * Retrieves all Slack channels using the Slack API.
 * @param client Slack Web API client
 * @returns A promise that resolves to an array of Slack channels.
 */
export async function getAllSlackChannels(client: WebClient): Promise<SlackChannel[]> {
  // Excludes archived channels and has a maximum limit of 1000 channels.
  const channels = await client.conversations.list({
    types: "public_channel",
    exclude_archived: true,
    limit: 1000, // This is the max limit
  });

  const res: SlackChannel[] = [];

  for (const channel of channels.channels ?? []) {
    if (channel.name == undefined || channel.id == undefined) {
      SlackLogger.getInstance().error(
        `channel with name \`${channel.name}\` has undefined name or id. This should not happen.`,
      );
      continue;
    }

    res.push(new SlackChannel(channel.name, channel.id));
  }

  return res;
}

/**
 * Gets the default Slack channels for the workspace.
 * @param client The Slack API Web Client
 * @returns The default Slack channels for the workspace
 */
export async function getDefaultSlackChannels(client: WebClient): Promise<SlackChannel[]> {
  const allChannels = await getAllSlackChannels(client);
  const defaultChannels = filterDefaultSlackChannels(allChannels);
  return defaultChannels;
}

/**
 * Parses the escaped channel text from a Slack command and returns the Slack channel. Escaped channels are in the format <#C12345678|channel-name>
 * @param text The escaped channel text
 * @returns The Slack channel
 */
export function parseEscapedSlashCommandChannel(text: string): SlackChannel {
  // Escaped channel text is in the format <#C12345678|channel-name>
  const matches = text.match(/<#(C\w+)\|(.+)>/);
  if (matches == null) {
    throw new Error(`could not parse escaped channel text: ${text}`);
  }

  const id = matches[1];
  const name = matches[2];
  return new SlackChannel(name, id);
}
