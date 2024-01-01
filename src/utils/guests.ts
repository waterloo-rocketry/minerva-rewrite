import { App } from "@slack/bolt";
import SlackGuest from "../classes/SlackGuest";

/**
 * Retrieves a list of SlackGuests of single channel guests in a Slack workspace.
 * @param app The Slack Bolt app instance.
 * @returns A promise that resolves to an array of SlackGuests of single channel guests.
 */
export async function getAllSingleChannelGuests(app: App): Promise<SlackGuest[]> {
  const guestsList: SlackGuest[] = [];
  let nextCursor: string | undefined = undefined;

  do {
    const users = await app.client.users.list({
      limit: 200,
      cursor: nextCursor,
    });

    if (users.members) {
      users.members.forEach((user) => {
        if (user.is_ultra_restricted) {
          const newGuest = new SlackGuest(user.real_name as string, user.id as string, user.team_id as string);
          guestsList.push(newGuest);
        }
      });
    }

    nextCursor = users.response_metadata?.next_cursor;
  } while (nextCursor);

  return guestsList;
}

/**
 * Retrieves a list of SlackGuests of single channel guests in a specific channel.
 * @param app The Slack Bolt app instance.
 * @returns A promise that resolves to an array of SlackGuests of single channel guests in a specific channel.
 */
export async function getAllSingleChannelGuestsInChannel(
  app: App,
  channel: string,
  singleChannelGuests: SlackGuest[],
): Promise<SlackGuest[]> {
  const guestMembersInChannel = await app.client.conversations.members({
    channel: channel,
    limit: 500,
  });
  const guestMembersInChannelList: string[] | undefined = guestMembersInChannel.members;
  if (!guestMembersInChannelList) {
    return [];
  }
  const filteredGuests = singleChannelGuests.filter((guest) => guestMembersInChannelList.includes(guest.id));
  return filteredGuests;
}
