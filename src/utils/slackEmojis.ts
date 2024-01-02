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
export async function getRandomEmoji(app: App): Promise<string> {
  try {
    const result = await app.client.emoji.list();
    if (!result.emoji) {
      throw new Error("No emojis found");
    }
    const emojis: string[] = Object.keys(result.emoji);
    return emojis[Math.floor(Math.random() * emojis.length)];
  } catch (error) {
    console.error("Failed to get random emoji:", error);
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
  const emoji1 = await getRandomEmoji(app);
  let emoji2: string;

  for (let i = 0; i < 5; i++) {
    emoji2 = await getRandomEmoji(app);
    if (emoji2 !== emoji1) {
      return [emoji1, emoji2];
    }
  }

  return ["white_check_mark", "x"];
}

export async function seedMessageReactions(
  app: App,
  channel: string,
  emojis: string[],
  timestamp: string | number,
): Promise<void> {
  const response = await addReactionToMessage(app, channel, emojis[0], timestamp);

  if (isSlackAPIResponse(response) && response.ok) {
    setTimeout(async () => {
      await addReactionToMessage(app, channel, emojis[1], timestamp);
    }, 1000);
  }
}
