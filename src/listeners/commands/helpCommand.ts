import { slackBotToken } from '../../utils/env';
import { Middleware, SlackCommandMiddlewareArgs } from '@slack/bolt';

const README_URL =
  'https://github.com/waterloo-rocketry/minerva-rewrite/blob/main/README.md';
const message = `For more information, check out this ${README_URL}!`;

export const helpCommandHandler: Middleware<
  SlackCommandMiddlewareArgs
> = async ({ command, ack, client }) => {
  await ack();

  await client.chat.postEphemeral({
    token: slackBotToken,
    channel: command.channel_id,
    user: command.user_id,
    text: message,
  });
};
