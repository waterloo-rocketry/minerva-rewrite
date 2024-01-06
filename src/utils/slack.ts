import { WebClient } from "@slack/web-api";

import SlackChannel from "../classes/SlackChannel";

/**
 * Posts a message to a Slack channel
 * @param client Slack Web API client
 * @param channel The Slack channel to post the message to
 * @param text The text of the message to post
 * @todo Add support for #default as a channel
 */
export function postMessage(client: WebClient, channel: SlackChannel, text: string): void {
  try {
    client.chat.postMessage({
      channel: channel.id,
      text: text,
    });
  } catch (error) {
    console.error(`Failed to post message to channel ${channel.name} with error ${error}`);
  }
}
