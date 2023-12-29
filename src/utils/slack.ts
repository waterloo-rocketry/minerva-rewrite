import { App } from "@slack/bolt";

import SlackChannel from "../classes/SlackChannel";

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
