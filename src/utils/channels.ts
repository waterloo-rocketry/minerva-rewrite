import { App } from "@slack/bolt";
import SlackChannel from "../classes/SlackChannel";
import { defaultSlackChannels } from "../common/constants";

export function filterSlackChannelFromName(name: string, channels: SlackChannel[]): SlackChannel | undefined {
  if (name == "default") throw new Error("`default` is not a valid channel name, as it is a group of channels");
  const channel = channels?.find((channel) => channel.name === name);
  if (channel == undefined) throw new Error(`Could not find channel with name ${name}`);

  return channel;
}

export function filterSlackChannelsFromNames(names: string[], channels: SlackChannel[]): SlackChannel[] {
  const res = new Set<SlackChannel>();

  for (const name of names) {
    if (name == "default") {
      filterDefaultSlackChannels(channels).forEach((channel) => res.add(channel));
    } else {
      const channel = channels.find((channel) => channel.name === name);
      if (channel == undefined) {
        console.error(`Could not find channel with name ${name}`);
        continue;
      }

      if (channel.name == undefined || channel.id == undefined) {
        console.error(`Channel with name ${name} has undefined name or id. This should not happen.`);
        continue;
      }

      res.add(new SlackChannel(channel.name, channel.id));
    }
  }

  return Array.from(res);
}

export function filterDefaultSlackChannels(channels: SlackChannel[]): SlackChannel[] {
  return filterSlackChannelsFromNames(defaultSlackChannels, channels);
}

export async function getAllSlackChannels(app: App): Promise<SlackChannel[]> {
  const channels = await app.client.conversations.list({
    types: "public_channel",
    exclude_archived: true,
    limit: 1000, // This is the max limit
  });

  const res = [];

  for (const channel of channels.channels ?? []) {
    if (channel.name == undefined || channel.id == undefined) {
      console.error(`Channel with name ${channel.name} has undefined name or id. This should not happen.`);
      continue;
    }

    res.push(new SlackChannel(channel.name, channel.id));
  }

  return res;
}
