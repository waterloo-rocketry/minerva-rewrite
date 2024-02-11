import { WebClient } from "@slack/web-api";
import { ChatPostMessageResponse } from "@slack/web-api";
import SlackUser, { UserType } from "../classes/SlackUser";
import SlackChannel from "../classes/SlackChannel";
import { determineUserType } from "./users";
import { ReactionsAddResponse } from "@slack/web-api";
import { SlackLogger } from "../classes/SlackLogger";

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
 * @returns A promise that resolves to the response from the Slack API
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
    SlackLogger.getInstance().error(`Failed to post message to channel \`${channel.name}\` with error:`, error);
    throw error;
  }

  return res;
}

/**
 * Posts an ephemeral message to a Slack channel
 * @param client Slack Web API client
 * @param channel The Slack channel to post the message to
 * @param user The Slack user to post the message to
 * @param text The text of the message to post
 * @param options Optional arguments for the message as per https://api.slack.com/methods/chat.postEphemeral#args
 * @returns A promise that resolves to the response from the Slack API
 */
export async function postEphemeralMessage(
  client: WebClient,
  channel: string,
  user: string,
  text: string,
  options?: ChatPostMessageOptionalArgs,
): Promise<ChatPostMessageResponse | undefined> {
  let res: ChatPostMessageResponse | undefined = undefined;
  try {
    res = await client.chat.postEphemeral({
      channel: channel,
      user: user,
      text: text,
      ...options,
    });

    return res;
  } catch (error) {
    SlackLogger.getInstance().error(
      `Failed to post ephemeral message to user \`${user}\` in channel \`${channel}\` with error:`,
      error,
    );
    throw error;
  }
}

// https://api.slack.com/methods/emoji.list
/**
 * Retrieves all custom emoji from a Slack workspace.
 * @param client Slack Web API client
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
    SlackLogger.getInstance().error(`Failed to get emojis for workspace:`, error);
    throw error;
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
    try {
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
    } catch (error) {
      SlackLogger.getInstance().error(`Failed to get users from workspace:`, error);
      throw error;
    }
  }
  return usersList;
}

/**
 * Retrieves all members in a Slack channel.
 * @param client Slack Web API client.
 * @param channelId The id of the Slack channel.
 * @returns A promise that resolves to an array of SlackUserIDs in the channel, or undefined if the channel is not found.
 */
export async function getChannelMembers(client: WebClient, channelId: string): Promise<SlackUserID[]> {
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
    return members.length > 0 ? members : [];
  } catch (error) {
    SlackLogger.getInstance().error(`Failed to get members for channel with id \`${channelId}\`:`, error);
    throw error;
  }
}

// https://api.slack.com/methods/reactions.add
/**
 * Adds a reaction to a specific message in a Slack channel.
 * @param client The Slack Web API client.
 * @param channel The ID of the channel where the message is posted.
 * @param emoji The name of the emoji to add.
 * @param timestamp The timestamp of the message to react to, as a string or number.
 * @returns A promise that resolves to the response from the Slack API.
 */
export function addReactionToMessage(
  client: WebClient,
  channel: string,
  emoji: string,
  timestamp: string | number,
): Promise<ReactionsAddResponse> {
  // Convert timestamp to string if it's a number
  const timestampStr = typeof timestamp === "number" ? timestamp.toString() : timestamp;

  try {
    return client.reactions.add({
      channel,
      name: emoji,
      timestamp: timestampStr,
    });
  } catch (error) {
    SlackLogger.getInstance().error(
      `Failed to add reaction \`${emoji}\` to message \`${timestampStr}\` in \`${channel}\`:`,
      error,
    );
    throw error;
  }
}

/**
 * Retrieves the permalink for a message in a Slack channel.
 * @param client Slack Web API client
 * @param channel The ID of the channel where the message is posted
 * @param timestamp The timestamp of the message to react to
 * @returns A promise that resolves to the permalink of the message, or undefined if the message is not found
 */
export async function getMessagePermalink(
  client: WebClient,
  channel: string,
  timestamp: string,
): Promise<string | undefined> {
  let res;
  try {
    res = await client.chat.getPermalink({
      channel,
      message_ts: timestamp,
    });
  } catch (error) {
    SlackLogger.getInstance().error(
      `Error fetching message permalink for message with timestamp \`${timestamp}\` in \`${channel}\`:`,
      error,
    );
    throw error;
  }

  if (res?.ok) {
    return res.permalink;
  }
}
