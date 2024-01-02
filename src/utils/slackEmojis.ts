import { App } from "@slack/bolt";
import { ReactionsAddResponse } from "@slack/web-api";

// https://api.slack.com/methods/reactions.add
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
