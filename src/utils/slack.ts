import { App } from "@slack/bolt";
import { ChatPostMessageResponse } from "@slack/web-api";
import SlackChannel from "../classes/SlackChannel";

/**
 * Optional arguments for chat.postMessage as per https://api.slack.com/methods/chat.postMessage#arguments
 */
interface ChatPostMessageOptionalArgs {
  as_user?: boolean;
  icon_emoji?: string;
  icon_url?: string;
  link_names?: boolean;
  mrkdwn?: boolean;
  reply_broadcast?: boolean;
  thread_ts?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

/**
 * Posts a message to a Slack channel
 * @param app The Bolt App
 * @param channel The Slack channel to post the message to
 * @param text The text of the message to post
 * @param options Optional arguments for the message as per https://api.slack.com/methods/chat.postMessage#arguments
 */
export async function postMessage(
  app: App,
  channel: SlackChannel,
  text: string,
  options?: ChatPostMessageOptionalArgs,
): Promise<ChatPostMessageResponse | undefined> {
  let res: ChatPostMessageResponse | undefined = undefined;
  try {
    res = await app.client.chat.postMessage({
      channel: channel.id,
      text: text,
      ...options,
    });
  } catch (error) {
    throw `Failed to post message to channel ${channel.name} with error ${error}`;
  }

  return res;
}
