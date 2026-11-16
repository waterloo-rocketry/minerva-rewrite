import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from "@slack/bolt";

import { logCommandUsed } from "../../utils/logging";
import { postEphemeralMessage } from "../../utils/slack";
import { buildIssueRequestModal } from "../../utils/issueRequests";
import { githubIssuesRepo } from "../../utils/env";
import { SlackLogger } from "../../classes/SlackLogger";

/**
 * Handles the /request command by opening the issue request modal
 * @param obj The arguments for the middleware
 * @param obj.ack The Bolt app's `ack()` function
 * @param obj.command The command payload
 * @param obj.client The Bolt app client
 * @returns A promise of void
 */
export default async function requestCommandHandler({
  ack,
  command,
  client,
}: SlackCommandMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
  await ack();
  await logCommandUsed(command);

  try {
    // Any text after the command is used as a starting point for the description
    await client.views.open({
      trigger_id: command.trigger_id,
      view: buildIssueRequestModal(githubIssuesRepo, {}, command.text.trim() || undefined),
    });
  } catch (error) {
    SlackLogger.getInstance().error("Failed to open the issue request modal", error);
    await postEphemeralMessage(
      client,
      command.channel_id,
      command.user_id,
      "Sorry, I couldn't open the request form. Please try again.",
    );
  }
}
