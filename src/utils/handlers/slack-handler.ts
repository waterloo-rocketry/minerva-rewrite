import { WebClient, WebAPICallResult } from '@slack/web-api';

const web = new WebClient('env.slackBotToken');

// https://api.slack.com/methods/reactions.add
export function addReactionToMessage(channel: string, emoji: string, timestamp: string | number): Promise<WebAPICallResult> {
    return web.reactions.add({
        channel,
        name: emoji,
        timestamp,
    });
};

// https://api.slack.com/methods/emoji.list
export async function getRandomEmoji(): Promise<string> {
    try {
        const result = await web.emoji.list();
        // The result is a JSON object, convert it to an array for convenience
        const emojis: string[] = Object.keys(result.emoji);
        return emojis[Math.floor(Math.random() * emojis.length)];
    } catch (error) {
        console.error('Failed to get random emoji:', error);
        throw error;
    }
}