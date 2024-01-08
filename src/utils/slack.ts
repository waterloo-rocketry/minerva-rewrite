import { WebClient } from "@slack/web-api";
import { ChatPostMessageResponse } from "@slack/web-api";
import SlackUser, { UserType } from "../classes/SlackUser";
import SlackChannel from "../classes/SlackChannel";
import { determineUserType, getAllSingleChannelGuestsInOneChannel } from "./users";

export type SlackUserID = string;

/**
 * Optional arguments for chat.postMessage as per https://api.slack.com/methods/chat.postMessage#arguments
 */
interface ChatPostMessageOptionalArgs {
  as_user?: boolean;
  icon_emoji?: string;
  icon_url?: string;
  link_names?: boolean;
  mrkdwn?: boolean;
  reply_broadcast?: boolean;
  thread_ts?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

/**
 * Posts a message to a Slack channel
 * @param client Slack Web API client
 * @param channel The Slack channel / Slack user to post the message to
 * @param text The text of the message to post
 * @param options Optional arguments for the message as per https://api.slack.com/methods/chat.postMessage#arguments
 */
export async function postMessage(
  client: WebClient,
  channel: SlackChannel | SlackUser,
  text: string,
  options?: ChatPostMessageOptionalArgs,
): Promise<ChatPostMessageResponse | undefined> {
  let res: ChatPostMessageResponse | undefined = undefined;
  try {
    res = await client.chat.postMessage({
      channel: channel.id,
      text: text,
      ...options,
    });
  } catch (error) {
    throw `Failed to post message to channel ${channel.name} with error ${error}`;
  }

  return res;
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
