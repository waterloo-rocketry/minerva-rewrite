import { Middleware, SlackCommandMiddlewareArgs } from "@slack/bolt";
import { logCommandUsed } from "../../utils/logging";
import { postEphemeralMessage } from "../../utils/slack";

const message = `For more information, check out <https://github.com/waterloo-rocketry/minerva-rewrite/blob/main/README.md|minerva's README>.`;

const helpCommandHandler: Middleware<SlackCommandMiddlewareArgs> = async ({ command, ack, client }) => {
  await ack();
  await logCommandUsed(command);

  await postEphemeralMessage(client, command.channel_id, command.user_id, message);
};

export default helpCommandHandler;
