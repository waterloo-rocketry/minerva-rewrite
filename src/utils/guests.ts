import { App } from "@slack/bolt";

/**
 * Retrieves a list of real names of single channel guests in a Slack workspace.
 * @param app The Slack Bolt app instance.
 * @returns A promise that resolves to an array of real names of single channel guests.
 */
export async function getAllSingleChannelGuests(app: App): Promise<string[]> {
  const guestsList: string[] = [];
  let nextCursor: string | undefined = undefined;

  do {
    const users = await app.client.users.list({
      limit: 200,
      cursor: nextCursor,
    });

    if (users.members) {
      users.members.forEach((user) => {
        if (user.is_ultra_restricted) {
          guestsList.push(user.real_name as string);
        }
      });
    }

    nextCursor = users.response_metadata?.next_cursor;
  } while (nextCursor);

  return guestsList;
}
