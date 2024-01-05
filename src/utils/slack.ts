import { App } from "@slack/bolt";
import SlackUser, { UserType } from "../classes/SlackUser";
import SlackChannel from "../classes/SlackChannel";
import { determineUserType, getAllSingleChannelGuestsInOneChannel } from "./users";

export type SlackUserID = string;

/**
 * Posts a message to a Slack channel
 * @param app The Bolt App
 * @param channel The Slack channel to post the message to
 * @param text The text of the message to post
 * @todo Add support for #default as a channel
 */
export function postMessage(app: App, channel: SlackChannel, text: string): void {
  try {
    app.client.chat.postMessage({
      channel: channel.id,
      text: text,
    });
  } catch (error) {
    console.error(`Failed to post message to channel ${channel.name} with error ${error}`);
  }
}

/**
 * Posts a message to all single-channel guests in a specified channel
 * @param app The Bolt App
 * @param channel The Slack channel to post the message to the single-channel guests
 * @param text The text of the message to post
 */
export async function postMessageToSingleChannelGuestsInChannel(app: App, channel: SlackChannel): Promise<void> {
  const allSingleChannelGuestsInOneChannel = await getAllSingleChannelGuestsInOneChannel(app, channel);
  for (const guest of allSingleChannelGuestsInOneChannel) {
    try {
      app.client.chat.postMessage({
        channel: guest.id,
        text: "Hello! You are a single channel guest.",
      });
    } catch (error) {
      console.error(`Failed to post message to channel ${channel.name} with error ${error}`);
    }
  }
}

/**
 * Fetches all active Slack users by default else specified.
 * @param app The Slack Bolt app instance.
 * @param includeDeactivatedMembers The boolean to include deleted/deactivated members or not.
 * @returns A promise that resolves to an array of active SlackUser instances.
 */
export async function getAllSlackUsers(app: App, includeDeactivatedMembers: boolean = false): Promise<SlackUser[]> {
  const usersList: SlackUser[] = [];
  let cursor: string | undefined = undefined;

  while (true) {
    const response = await app.client.users.list({
      limit: 900,
      cursor: cursor,
    });

    if (response.members) {
      response.members.forEach((user) => {
        if (user.deleted == includeDeactivatedMembers) {
          const userType: UserType = determineUserType(user);
          const newGuest = new SlackUser(user.real_name as string, user.id as string, userType);
          usersList.push(newGuest);
        }
      });
    }

    cursor = response.response_metadata?.next_cursor;
    if (!cursor) {
      break;
    }
  }
  return usersList;
}

/**
 * Retrieves all members in a Slack channel.
 * @param app The Slack Bolt app instance.
 * @param channelId The id of the Slack channel.
 * @returns A promise that resolves to an array of SlackUserIDs in the channel,
 *   or undefined if the channel is not found.
 */
export async function getChannelMembers(app: App, channelId: string): Promise<SlackUserID[] | undefined> {
  try {
    let cursor: string | undefined = undefined;
    const members: SlackUserID[] = [];

    while (true) {
      const response = await app.client.conversations.members({
        channel: channelId,
        limit: 900,
        cursor: cursor,
      });

      if (response.members) {
        members.push(...(response.members as SlackUserID[]));
      }

      cursor = response.response_metadata?.next_cursor;
      if (!cursor) {
        break;
      }
    }
    return members.length > 0 ? members : undefined;
  } catch (error) {
    console.error("Error fetching channel members:", error);
    return undefined;
  }
}
