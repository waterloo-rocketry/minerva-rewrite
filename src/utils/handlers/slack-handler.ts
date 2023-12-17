import { WebClient, WebAPICallResult } from '@slack/web-api';

const web = new WebClient('env.slackBotToken');

// https://api.slack.com/methods/reactions.add
export function addReactionToMessage(
  channel: string,
  emoji: string,
  timestamp: string | number,
): Promise<WebAPICallResult> {
  // Convert timestamp to string if it's a number
  const timestampStr =
    typeof timestamp === 'number' ? timestamp.toString() : timestamp;

  return web.reactions.add({
    channel,
    name: emoji,
    timestamp: timestampStr,
  });
}

// https://api.slack.com/methods/emoji.list
export async function getRandomEmoji(): Promise<string> {
  try {
    const result = await web.emoji.list();
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
