import { App } from '@slack/bolt';

// https://api.slack.com/methods/reactions.add
export function addReactionToMessage(
  app: App,
  channel: string,
  emoji: string,
  timestamp: string | number,
): Promise<unknown> {
  // Convert timestamp to string if it's a number
  const timestampStr =
    typeof timestamp === 'number' ? timestamp.toString() : timestamp;

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
      throw new Error('No emojis found');
    }
    const emojis: string[] = Object.keys(result.emoji);
    return emojis[Math.floor(Math.random() * emojis.length)];
  } catch (error) {
    console.error('Failed to get random emoji:', error);
    throw error;
  }
}
