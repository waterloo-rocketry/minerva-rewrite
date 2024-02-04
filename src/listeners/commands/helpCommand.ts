import { Middleware, SlackCommandMiddlewareArgs } from "@slack/bolt";
import { logCommandUsed } from "../../utils/logging";
import { postEphemeralMessage } from "../../utils/slack";
import { SlackLogger } from "../../classes/SlackLogger";

const message = `For more information, check out <https://github.com/waterloo-rocketry/minerva-rewrite/blob/main/README.md|minerva's README>.`;

export const helpCommandHandler: Middleware<SlackCommandMiddlewareArgs> = async ({ command, ack, client }) => {
  await ack();
  await logCommandUsed(command);

  try {
    await postEphemeralMessage(client, command.channel_id, command.user_id, message);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    throw new Error("This is a test error");
  } catch (error) {
    SlackLogger.getInstance().error(
      `Failed to post ephemeral message to user \`${command.user_id}\` with error:`,
      error,
    );
  }
};
