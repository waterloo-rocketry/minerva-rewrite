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
