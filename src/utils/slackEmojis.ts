import { App } from "@slack/bolt";
import { ReactionsAddResponse } from "@slack/web-api";

// https://api.slack.com/methods/reactions.add
/**
 * Adds a reaction to a specific message in a Slack channel.
 * @param app The Slack App instance.
 * @param channel The ID of the channel where the message is posted.
 * @param emoji The name of the emoji to add.
 * @param timestamp The timestamp of the message to react to, as a string or number.
 * @returns A promise that resolves to the response from the Slack API.
 */
export function addReactionToMessage(
  app: App,
  channel: string,
  emoji: string,
  timestamp: string | number,
): Promise<ReactionsAddResponse> {
  // Convert timestamp to string if it's a number
  const timestampStr = typeof timestamp === "number" ? timestamp.toString() : timestamp;

  return app.client.reactions.add({
    channel,
    name: emoji,
    timestamp: timestampStr,
  });
}

// https://api.slack.com/methods/emoji.list
/**
 * Retrieves all custom emoji from a Slack workspace.
 * @param app The Slack App instance.
 * @returns A promise that resolves to an array of emoji names.
 */
export async function getAllEmoji(app: App): Promise<string[]> {
  try {
    const result = await app.client.emoji.list();
    if (!result.emoji) {
      throw new Error("No emojis found");
    }
    return Object.keys(result.emoji);
  } catch (error) {
    console.error("Failed to get emoji:", error);
    throw error;
  }
}

interface SlackAPIResponse {
  ok: boolean;
}

function isSlackAPIResponse(object: unknown): object is SlackAPIResponse {
  if (typeof object === "object" && object !== null) {
    return "ok" in object && typeof (object as SlackAPIResponse).ok === "boolean";
  }
  return false;
}

/**
 * Generates a pair of unique, random emoji from the available set in a Slack workspace.
 * If there are not enough emojis, defaults to ["white_check_mark", "x"].
 * @param app The Slack App instance.
 * @returns A promise that resolves to an array containing two emoji names.
 */
export async function generateEmojiPair(app: App): Promise<string[]> {
  const emojis = await getAllEmoji(app);
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
 * @param app The Slack App instance.
 * @param channel The ID of the channel where the message is posted.
 * @param emojis An array of two emoji names to add as reactions.
 * @param timestamp The timestamp of the message to react to, as a string or number.
 * @returns A promise that resolves when the reactions have been added.
 */
export async function seedMessageReactions(
  app: App,
  channel: string,
  emojis: string[],
  timestamp: string | number,
): Promise<void> {
  const response = await addReactionToMessage(app, channel, emojis[0], timestamp);

  if (isSlackAPIResponse(response) && response.ok) {
    await addReactionToMessage(app, channel, emojis[1], timestamp);
  }
}
