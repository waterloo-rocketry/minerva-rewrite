import * as environment from "./env";
import { WebClient } from "@slack/web-api";
import SlackChannel from "../classes/SlackChannel";
import ObjectSet from "../classes/ObjectSet";
import SlackUser, { UserType } from "../classes/SlackUser";
import { Member } from "@slack/web-api/dist/response/UsersListResponse";
import { filterSlackChannelFromName, getAllSlackChannels } from "./channels";
import { SlackUserID, getAllSlackUsers, getChannelMembers, postMessage } from "./slack";

/**
 * Determine the type of a Slack user based on the provided Member object.
 * @param user The Slack Member object.
 * @returns The determined user type.
 */
export function determineUserType(user: Member): UserType {
  if (user.is_owner) {
    return UserType.OWNER;
  } else if (user.is_bot) {
    return UserType.BOT;
  } else if (user.is_admin) {
    return UserType.ADMIN;
  } else if (user.is_restricted) {
    return UserType.RESTRICTED;
  } else if (user.is_ultra_restricted) {
    return UserType.ULTRA_RESTRICTED;
  } else if (user.is_restricted) {
    return UserType.RESTRICTED;
  } else {
    return UserType.FULL_MEMBER;
  }
}

/**
 * Retrieves a list of active SlackUsers of single channel guests.
 * @param client Slack Web API client.
 * @param slackUsers The array of all active SlackUsers.
 * @returns A promise that resolves to an array of SlackGuests of single channel guests.
 */
export async function getAllSingleChannelGuests(client: WebClient, slackUsers: SlackUser[]): Promise<SlackUser[]> {
  const allActiveSlackUsers = slackUsers;
  let allSingleChannelGuests: SlackUser[] = [];
  // Since the development Slack is on a free plan, multi- and single-channel guests don't exist there.
  //  Therefore, we're validating functionality with admin and owner users instead.
  if (environment.environment == "development") {
    allSingleChannelGuests = allActiveSlackUsers.filter((user) => {
      return user.userType == "admin" || user.userType == "owner";
    });
  } else {
    allSingleChannelGuests = allActiveSlackUsers.filter((user) => {
      return user.userType == "ultra_restricted";
    });
  }
  return allSingleChannelGuests;
}

/**
 * Retrieves all active users in a Slack channel.
 * @param client Slack Web API client.
 * @param channel The name of the Slack channel.
 * @returns A promise that resolves to an array of user IDs in the channel,
 *   or undefined if the channel is not found.
 */
export async function getAllUsersInChannel(client: WebClient, channel: string): Promise<SlackUserID[] | undefined> {
  const allSlackChannels = await getAllSlackChannels(client);
  const channelId = await filterSlackChannelFromName(channel, allSlackChannels);
  if (!channelId) {
    throw new Error(`Channel ${channel} not found.`);
  }
  const channelMembers = await getChannelMembers(client, channelId.id);
  return channelMembers;
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

export async function postMessageToSingleChannelGuestsInChannels(
  client: WebClient,
  channels: SlackChannel[],
  text: string,
): Promise<void> {
  const allSingleChannelGuestsInChannels = await getAllSingleChannelGuestsInChannels(client, channels);
  allSingleChannelGuestsInChannels.forEach((user) => {
    postMessage(client, user, text);
  });
}

/**
 * Retrieves a list of active SlackUsers of single channel guests in a specific channel.
 * @param client Slack Web API client.
 * @param channel The SlackChannel object.
 * @returns A promise that resolves to an array of SlackGuests of single channel guests in a specific channel.
 */
export async function getAllSingleChannelGuestsInOneChannel(
  client: WebClient,
  channel: SlackChannel,
): Promise<SlackUser[]> {
  const allUsersInChannel = await getAllUsersInChannel(client, channel.name);
  const activeUsers = await getAllSlackUsers(client);
  const allSingleChannelGuests = await getAllSingleChannelGuests(client, activeUsers);
  if (!allUsersInChannel) {
    return [];
  }
  const filteredGuests = allSingleChannelGuests.filter((guest) => allUsersInChannel.includes(guest.id));
  return filteredGuests;
}

/**
 * Retrieves a list of active SlackUsers of single channel guests in multiple channels.
 * @param client Slack Web API client.
 * @param channels The array SlackChannels.
 * @returns A promise that resolves to an array of SlackGuests of single channel guests in multiple channels.
 */
export async function getAllSingleChannelGuestsInChannels(
  client: WebClient,
  channels: SlackChannel[],
): Promise<SlackUser[]> {
  const allSingleChannelGuestsInChannels = new ObjectSet<SlackUser>((user) => user.id);
  channels.forEach(async (channel) => {
    const singleChannelGuestsInChannel = await getAllSingleChannelGuestsInOneChannel(client, channel);
    singleChannelGuestsInChannel.forEach((user) => {
      allSingleChannelGuestsInChannels.add(user);
    });
  });

  return allSingleChannelGuestsInChannels.values();
}
