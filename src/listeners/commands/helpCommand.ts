import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from "@slack/bolt";
import { logCommandUsed } from "../../utils/logging";
import { postEphemeralMessage } from "../../utils/slack";
import { SlackLogger } from "../../classes/SlackLogger";

const message = `For more information, check out <https://github.com/waterloo-rocketry/minerva-rewrite/blob/main/README.md|minerva's README>.`;

/**
 * Handler for the /help command
 * @param payload The payload of the command
 */
export async function helpCommandHandler(payload: SlackCommandMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
  const { command, ack, client } = payload;

  ack();

  logCommandUsed(command);

  try {
    await postEphemeralMessage(client, command.channel_id, command.user_id, message);
  } catch (error) {
    SlackLogger.getInstance().error("Failed to send help message", error);
  }
}
