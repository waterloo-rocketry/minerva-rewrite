import { slackBotToken } from "../../utils/env";
import { Middleware, SlackCommandMiddlewareArgs } from "@slack/bolt";

const message = `For more information, check out <https://github.com/waterloo-rocketry/minerva-rewrite/blob/main/README.md|minerva's README>.`;

export const helpCommandHandler: Middleware<SlackCommandMiddlewareArgs> = async ({ command, ack, client }) => {
  await ack();

  await client.chat.postEphemeral({
    token: slackBotToken,
    channel: command.channel_id,
    user: command.user_id,
    text: message,
  });
};
