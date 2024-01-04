import * as environment from "./env";
import { App } from "@slack/bolt";
import SlackChannel from "../classes/SlackChannel";
import SlackUser, { UserType } from "../classes/SlackUser";
import { Member } from "@slack/web-api/dist/response/UsersListResponse";
import { filterSlackChannelFromName, getAllSlackChannels } from "./channels";
import { SlackUserID, allSlackUsers, getChannelMembers } from "./slack";

/**
 * Determine the type of a Slack user based on the provided Member object.
 * @param user The Slack Member object.
 * @returns The determined user type.
 */
export function determineUserType(user: Member): UserType {
  if (user.is_admin) {
    return UserType.ADMIN;
  } else if (user.is_owner) {
    return UserType.OWNER;
  } else if (user.is_restricted) {
    return UserType.RESTRICTED;
  } else if (user.is_bot) {
    return UserType.BOT;
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
 * @param app The Slack Bolt app instance.
 * @param slackUsers The array of all active SlackUsers.
 * @returns A promise that resolves to an array of SlackGuests of single channel guests.
 */
export async function getAllSingleChannelGuests(app: App, slackUsers: SlackUser[]): Promise<SlackUser[]> {
  const allActiveSlackUsers = slackUsers;
  let allSingleChannelGuests: SlackUser[] = [];
  console.log(environment.environment);
  if (environment.environment == "development") {
    allSingleChannelGuests = allActiveSlackUsers.filter((user) => {
      return user.userType == "admin";
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
 * @param app The Slack Bolt app instance.
 * @param channel The name of the Slack channel.
 * @returns A promise that resolves to an array of user IDs in the channel,
 *   or undefined if the channel is not found.
 */
export async function getAllUsersInChannel(app: App, channel: string): Promise<SlackUserID[] | undefined> {
  const allSlackChannels = await getAllSlackChannels(app);
  const channelId = await filterSlackChannelFromName(channel, allSlackChannels);
  if (!channelId) {
    throw new Error(`Channel ${channel} not found.`);
  }
  const channelMembers = await getChannelMembers(app, channelId.id);
  return channelMembers;
}

/**
 * Retrieves a list of active SlackUsers of single channel guests in a specific channel.
 * @param app The Slack Bolt app instance.
 * @param channel The SlackChannel object.
 * @returns A promise that resolves to an array of SlackGuests of single channel guests in a specific channel.
 */
export async function getAllSingleChannelGuestsInOneChannel(app: App, channel: SlackChannel): Promise<SlackUser[]> {
  const allUsersInChannel = await getAllUsersInChannel(app, channel.name);
  const activeUsers = await allSlackUsers(app);
  const allSingleChannelGuests = await getAllSingleChannelGuests(app, activeUsers);
  if (!allUsersInChannel) {
    return [];
  }
  const filteredGuests = allSingleChannelGuests.filter((guest) => allUsersInChannel.includes(guest.id));
  return filteredGuests;
}

/**
 * Retrieves a list of active SlackUsers of single channel guests in multiple channels.
 * @param app The Slack Bolt app instance.
 * @param channels The array SlackChannels.
 * @returns A promise that resolves to an array of SlackGuests of single channel guests in multiple channels.
 */
export async function getAllSingleChannelGuestsInChannels(app: App, channels: SlackChannel[]): Promise<SlackUser[]> {
  const allSingleChannelGuestsInChannels: SlackUser[] = [];
  for (const channel of channels) {
    const singleChannelGuests = await getAllSingleChannelGuestsInOneChannel(app, channel);
    allSingleChannelGuestsInChannels.concat(singleChannelGuests);
  }
  return allSingleChannelGuestsInChannels;
}
