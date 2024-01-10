import { WebClient } from "@slack/web-api";
import { ReactionsAddResponse } from "@slack/web-api";
import { getAllEmoji } from "./slack";

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

  return client.reactions.add({
    channel,
    name: emoji,
    timestamp: timestampStr,
  });
}

/**
 * Generates a pair of unique, random emoji from the available set in a Slack workspace.
 * If there are not enough emojis, defaults to ["white_check_mark", "x"].
 * @param client The Slack Web API client.
 * @returns A promise that resolves to an array containing two emoji names.
 */
export async function generateEmojiPair(client: WebClient): Promise<string[]> {
  const emojis = await getAllEmoji(client);
  if (emojis.length < 2) {
    return ["white_check_mark", "x"];
  }
  const emoji1 = Math.floor(Math.random() * emojis.length);
  let emoji2;
  do {
    emoji2 = Math.floor(Math.random() * emojis.length);
  } while (emoji1 === emoji2); // Ensure the two emojis are different
  return [emojis[emoji1], emojis[emoji2]];
}

/**
 * Seeds a message in a Slack channel with two specified emoji reactions.
 * @param client The Slack App instance.
 * @param channel The ID of the channel where the message is posted.
 * @param emojis An array of two emoji names to add as reactions.
 * @param timestamp The timestamp of the message to react to, as a string or number.
 * @returns A promise that resolves when the reactions have been added.
 */
export async function seedMessageReactions(
  client: WebClient,
  channel: string,
  emojis: string[],
  timestamp: string | number,
): Promise<void> {
  const response = await addReactionToMessage(client, channel, emojis[0], timestamp);

  if (response.ok) {
    await addReactionToMessage(client, channel, emojis[1], timestamp);
  }
}
