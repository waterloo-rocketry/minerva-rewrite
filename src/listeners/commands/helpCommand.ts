import { SlackCommandMiddlewareArgs, AllMiddlewareArgs } from "@slack/bolt";
import { StringIndexed } from "@slack/bolt/dist/types/helpers";

import { logCommandUsed } from "../../utils/logging";
import { postEphemeralMessage } from "../../utils/slack";

const message = `For more information, check out <https://github.com/waterloo-rocketry/minerva-rewrite/blob/main/README.md|minerva's README>.`;

/**
 * Handles the /help command
 * @param obj The arguments for the middleware
 * @param obj.ack The Bolt app's `ack()` function
 * @param obj.command The command payload
 * @param obj.client The Bolt app client
 * @returns A promise of void
 */
export default async function helpCommandHandler({
  ack,
  command,
  client,
}: SlackCommandMiddlewareArgs & AllMiddlewareArgs<StringIndexed>): Promise<void> {
  await ack();
  await logCommandUsed(command);

  await postEphemeralMessage(client, command.channel_id, command.user_id, message);
}
