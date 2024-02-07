import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from "@slack/bolt";
import { logCommandUsed } from "../../utils/logging";
import { postEphemeralMessage } from "../../utils/slack";
import { SlackLogger } from "../../classes/SlackLogger";

const message = `For more information, check out <https://github.com/waterloo-rocketry/minerva-rewrite/blob/main/README.md|minerva's README>.`;

export async function helpCommandHandler({
  command,
  ack,
  client,
}: SlackCommandMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
  ack();
  logCommandUsed(command);

  try {
    await postEphemeralMessage(client, command.channel_id, command.user_id, message);
  } catch (error) {
    SlackLogger.getInstance().error("Failed to send help message", error);
  }
}
