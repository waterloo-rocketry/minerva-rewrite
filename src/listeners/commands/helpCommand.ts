import { SlackCommandMiddlewareArgs, AllMiddlewareArgs } from "@slack/bolt";
import { StringIndexed } from "@slack/bolt/dist/types/helpers";

import { logCommandUsed } from "../../utils/logging";
import { postEphemeralMessage } from "../../utils/slack";
import { SlackLogger } from "../../classes/SlackLogger";

const message = `For guides on how to use minerva's functionality, check out the feature reference guides in the Google Drive (<https://drive.google.com/drive/u/1/folders/1h7FZKuF3Zvv8EygjB8pSTk2aGuHHpBtj|link>) 
* <https://docs.google.com/document/d/1KbeJtU06Uosjpd3XlvEGtElOx5lAZz9vDe8yzHyFhvU/edit#heading=h.g3pdvke98aqf|Meeting Reminders>
* <https://docs.google.com/document/d/1otYHtmFHzkN8g7089EGQpxi9-7C_iKFhDt2L2tuwxHs/edit#heading=h.8w6auka00s3p|Message Notifications>
`;

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

  try {
    await postEphemeralMessage(client, command.channel_id, command.user_id, message);
  } catch (error) {
    SlackLogger.getInstance().error("Failed to send help message", error);
  }
}
