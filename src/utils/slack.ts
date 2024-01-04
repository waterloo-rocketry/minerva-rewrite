import { App } from "@slack/bolt";

import SlackChannel from "../classes/SlackChannel";

/**
 * Posts a message to a Slack channel
 * @param app The Bolt App
 * @param channel The Slack channel to post the message to
 * @param text The text of the message to post
 * @todo Add support for #default as a channel
 */
export function postMessage(app: App, channel: SlackChannel, text: string): void {
  try {
    app.client.chat.postMessage({
      channel: channel.id,
      text: text,
    });
  } catch (error) {
    console.error(`Failed to post message to channel ${channel.name} with error ${error}`);
  }
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
