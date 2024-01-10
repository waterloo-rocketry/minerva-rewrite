import { WebClient } from "@slack/web-api";
import SlackUser, { UserType } from "../classes/SlackUser";
import SlackChannel from "../classes/SlackChannel";
import { determineUserType, getAllSingleChannelGuestsInOneChannel } from "./users";

export type SlackUserID = string;

/**
 * Posts a message to a Slack channel
 * @param client Slack Web API client
 * @param channel The Slack channel / Slack user to post the message to
 * @param text The text of the message to post
 * @todo Add support for #default as a channel
 */
export function postMessage(client: WebClient, channel: SlackChannel | SlackUser, text: string): void {
  try {
    client.chat.postMessage({
      channel: channel.id,
      text: text,
    });
  } catch (error) {
    console.error(`Failed to post message to channel ${channel.name} with error ${error}`);
  }
}

// https://api.slack.com/methods/emoji.list
/**
 * Retrieves all custom emoji from a Slack workspace.
 * @param app The Slack App instance.
 * @returns A promise that resolves to an array of emoji names.
 */
export async function getAllEmoji(client: WebClient): Promise<string[]> {
  try {
    const result = await client.emoji.list();
    if (!result.emoji) {
      throw new Error("No emojis found");
    }
    return Object.keys(result.emoji);
  } catch (error) {
    console.error("Failed to get emoji:", error);
    throw error;
  }
}
/**
 * Posts a message to all single-channel guests in a specified channel
 * @param client Slack Web API client
 * @param channel The Slack channel to post the message to the single-channel guests
 * @param text The text of the message to post
 */
export async function postMessageToSingleChannelGuestsInChannel(
  client: WebClient,
  channel: SlackChannel,
  text: string,
): Promise<void> {
  const allSingleChannelGuestsInOneChannel = await getAllSingleChannelGuestsInOneChannel(client, channel);
  for (const guest of allSingleChannelGuestsInOneChannel) {
    try {
      await postMessage(client, guest, text);
    } catch (error) {
      console.error(`Failed to post message to ${guest.name} with error ${error}`);
    }
  }
}

/**
 * Fetches all active Slack users by default else specified.
 * @param client Slack Web API client.
 * @param includeDeactivatedMembers The boolean to include deleted/deactivated members or not.
 * @returns A promise that resolves to an array of active SlackUser instances.
 */
export async function getAllSlackUsers(
  client: WebClient,
  includeDeactivatedMembers: boolean = false,
): Promise<SlackUser[]> {
  const usersList: SlackUser[] = [];
  let cursor: string | undefined = undefined;

  while (true) {
    const response = await client.users.list({
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
 * @param client Slack Web API client.
 * @param channelId The id of the Slack channel.
 * @returns A promise that resolves to an array of SlackUserIDs in the channel,
 *   or undefined if the channel is not found.
 */
export async function getChannelMembers(client: WebClient, channelId: string): Promise<SlackUserID[] | undefined> {
  try {
    let cursor: string | undefined = undefined;
    const members: SlackUserID[] = [];

    while (true) {
      const response = await client.conversations.members({
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
