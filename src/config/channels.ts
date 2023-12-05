import { App } from '@slack/bolt';
import SlackChannel from '../common/SlackChannel';

const defaultSlackChannels = ['general', 'airframe', 'propulsion'];

export async function getSlackChannelFromName(
  app: App,
  name: string,
): Promise<SlackChannel | undefined> {
  const channels = await getAllSlackChannels(app);
  const channel = channels?.find((channel) => channel.name === name);
  if (channel == undefined) {
    console.error(`Could not find channel with name ${name}`);
    return undefined;
  }

  return channel;
}

export async function getSlackChannelsFromNames(
  app: App,
  names: string[],
): Promise<SlackChannel[]> {
  const res = [];
  const channels = await getAllSlackChannels(app);

  for (const name of names) {
    const channel = channels?.find((channel) => channel.name === name);
    if (channel == undefined) {
      console.error(`Could not find channel with name ${name}`);
      continue;
    }

    if (channel.name == undefined || channel.id == undefined) {
      console.error(
        `Channel with name ${name} has undefined name or id. This should not happen.`,
      );
      continue;
    }

    res.push(new SlackChannel(channel.name, channel.id));
  }

  return res;
}

export async function getDefaultSlackChannels(
  app: App,
): Promise<SlackChannel[]> {
  return await getSlackChannelsFromNames(app, defaultSlackChannels);
}

async function getAllSlackChannels(app: App): Promise<SlackChannel[]> {
  const channels = await app.client.conversations.list({
    types: 'public_channel',
    exclude_archived: true,
    limit: 1000, // This is the max limit
  });

  const res = [];

  for (const channel of channels.channels ?? []) {
    if (channel.name == undefined || channel.id == undefined) {
      console.error(
        `Channel with name ${channel.name} has undefined name or id. This should not happen.`,
      );
      continue;
    }

    res.push(new SlackChannel(channel.name, channel.id));
  }

  return res;
}
