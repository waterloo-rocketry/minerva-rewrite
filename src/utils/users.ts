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
 * @param slackUsers The array of all active SlackUsers.
 * @returns A promise that resolves to an array of SlackGuests of single channel guests.
 */
export async function getAllSingleChannelGuests(slackUsers: SlackUser[]): Promise<SlackUser[]> {
  let allSingleChannelGuests: SlackUser[] = [];
  // Since the development Slack is on a free plan, multi- and single-channel guests don't exist there.
  //  Therefore, we're validating functionality with admin and owner users instead.
  if (environment.environment == "development") {
    allSingleChannelGuests = slackUsers.filter((user) => {
      return user.userType == UserType.OWNER || user.userType == UserType.ADMIN;
    });
  } else {
    allSingleChannelGuests = slackUsers.filter((user) => {
      return user.userType == UserType.ULTRA_RESTRICTED;
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
 * @param channels The Slack channels to post the message to the single-channel guests
 * @param text The text of the message to post
 * @param allUsersInWorkspace All Slack users in the workspace. If not provided, the users will be fetched from the Slack API
 * @returns The number of single-channel guests messaged
 */
export async function postMessageToSingleChannelGuestsInChannels(
  client: WebClient,
  channels: SlackChannel[],
  text: string,
  allUsersInWorkspace?: SlackUser[],
): Promise<number> {
  const allSingleChannelGuestsInChannels = await getAllSingleChannelGuestsInChannels(
    client,
    channels,
    allUsersInWorkspace,
  );
  const DMSingleChannelGuestPromises = allSingleChannelGuestsInChannels.map((guest) =>
    postMessage(client, guest, text),
  );

  await Promise.all(DMSingleChannelGuestPromises);

  return allSingleChannelGuestsInChannels.length;
}

/**
 * Retrieves a list of active SlackUsers of single channel guests in a specific channel.
 * @param client Slack Web API client.
 * @param channel The SlackChannel object.
 * @param allUsersInWorkspace All Slack users in the workspace. If not provided, the users will be fetched from the Slack API
 * @returns A promise that resolves to an array of SlackGuests of single channel guests in a specific channel.
 */
export async function getAllSingleChannelGuestsInOneChannel(
  client: WebClient,
  channel: SlackChannel,
  allUsersInWorkspace?: SlackUser[],
): Promise<SlackUser[]> {
  const allUsersInChannel = await getAllUsersInChannel(client, channel.name);

  if (allUsersInWorkspace == undefined) {
    allUsersInWorkspace = await getAllSlackUsers(client);
  }

  const allSingleChannelGuests = await getAllSingleChannelGuests(allUsersInWorkspace);
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
 * @param allUsersInWorkspace All Slack users in the workspace. If not provided, the users will be fetched from the Slack API
 * @returns A promise that resolves to an array of SlackGuests of single channel guests in multiple channels.
 */
export async function getAllSingleChannelGuestsInChannels(
  client: WebClient,
  channels: SlackChannel[],
  allUsersInWorkspace?: SlackUser[],
): Promise<SlackUser[]> {
  const allSingleChannelGuestsInChannels = new ObjectSet<SlackUser>((user) => user.id);

  const getSingleChannelGuestPromises = channels.map((channel) =>
    getAllSingleChannelGuestsInOneChannel(client, channel, allUsersInWorkspace).then((guests) => {
      guests.forEach((guest) => {
        allSingleChannelGuestsInChannels.add(guest);
      });
    }),
  );
  await Promise.all(getSingleChannelGuestPromises);

  return allSingleChannelGuestsInChannels.values();
}
