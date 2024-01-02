import { App } from "@slack/bolt";
import SlackUser, { UserType } from "../classes/SlackUser";
import { Member } from "@slack/web-api/dist/response/UsersListResponse";
import { filterSlackChannelFromName, getAllSlackChannels } from "./channels";

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
  } else {
    return UserType.RESTRICTED;
  }
}

/**
 * Fetches all active Slack users.
 * @param app The Slack Bolt app instance.
 * @returns A promise that resolves to an array of active SlackUser instances.
 */
export async function allSlackUsers(app: App): Promise<SlackUser[]> {
  const activeUsers: SlackUser[] = [];
  const users = await app.client.users.list({
    limit: 900,
  });
  if (users.members) {
    users.members.forEach((user) => {
      if (user.deleted == false) {
        const userType: UserType = determineUserType(user);
        const newGuest = new SlackUser(user.real_name as string, user.id as string, userType);
        activeUsers.push(newGuest);
      }
    });
  }
  return activeUsers;
}

/**
 * Retrieves a list of active SlackUsers of single channel guests.
 * @param app The Slack Bolt app instance.
 * @param slackUsers The array of all active SlackUsers.
 * @returns A promise that resolves to an array of SlackGuests of single channel guests.
 */
export async function getAllSingleChannelGuests(app: App, slackUsers: SlackUser[]): Promise<SlackUser[]> {
  const allActiveSlackUsers = slackUsers;
  const allSingleChannelGuests = allActiveSlackUsers.filter((user) => {
    return user.userType == "ultra_restricted";
  });
  return allSingleChannelGuests;
}

/**
 * Retrieves all active users in a Slack channel.
 * @param app The Slack Bolt app instance.
 * @param channel The name of the Slack channel.
 * @returns A promise that resolves to an array of user IDs in the channel,
 *   or undefined if the channel is not found.
 */
export async function getAllUsersInChannel(app: App, channel: string): Promise<string[] | undefined> {
  const allSlackChannels = await getAllSlackChannels(app);
  const channelId = await filterSlackChannelFromName(channel, allSlackChannels);
  if (!channelId) {
    throw new Error(`Channel ${channel} not found.`);
  }
  const allUsersInChannel = await app.client.conversations.members({
    channel: channelId.id,
    limit: 900,
  });
  return allUsersInChannel.members;
}

/**
 * Retrieves a list of active SlackUsers of single channel guests in a specific channel.
 * @param app The Slack Bolt app instance.
 * @param channel The channel name.
 * @returns A promise that resolves to an array of SlackGuests of single channel guests in a specific channel.
 */
export async function getAllSingleChannelGuestsInOneChannel(app: App, channel: string): Promise<SlackUser[]> {
  const allUsersInChannel = await getAllUsersInChannel(app, channel);
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
 * @param channels The array of channel names.
 * @returns A promise that resolves to an array of SlackGuests of single channel guests in multiple channels.
 */
export async function getAllSingleChannelGuestsInChannels(app: App, channels: string[]): Promise<SlackUser[]> {
  const allSingleChannelGuestsInChannels: SlackUser[] = [];
  for (const channel of channels) {
    const singleChannelGuests = await getAllSingleChannelGuestsInOneChannel(app, channel);
    allSingleChannelGuestsInChannels.concat(singleChannelGuests);
  }
  return allSingleChannelGuestsInChannels;
}
