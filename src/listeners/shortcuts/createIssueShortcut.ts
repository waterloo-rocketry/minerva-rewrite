import { AllMiddlewareArgs, MessageShortcut, SlackShortcutMiddlewareArgs } from "@slack/bolt";
import { WebClient } from "@slack/web-api";

import { buildIssueRequestModal, extractMentionedUserIds, slackTextToMarkdown } from "../../utils/issueRequests";
import { getMessagePermalink } from "../../utils/slack";
import { githubIssuesRepo } from "../../utils/env";
import { SlackLogger } from "../../classes/SlackLogger";

/**
 * The callback ID of the "Create software issue" message shortcut, as configured in the Slack app
 */
export const CREATE_ISSUE_SHORTCUT_ID = "create_issue_from_message";

/**
 * Looks up the display names of Slack users. Users that can't be looked up are left out.
 * @param client Slack Web API client
 * @param userIds The IDs of the users to look up
 * @returns The display names keyed by user ID
 */
async function getUserNames(client: WebClient, userIds: string[]): Promise<Record<string, string>> {
  const names: Record<string, string> = {};
  await Promise.all(
    userIds.map(async (id) => {
      try {
        const res = await client.users.info({ user: id });
        const name = res.user?.profile?.display_name || res.user?.real_name || res.user?.name;
        if (name) names[id] = name;
      } catch {
        // Fall back to the raw user ID in the description
      }
    }),
  );
  return names;
}

/**
 * Handles the "Create software issue" message shortcut by opening the issue request modal,
 * prefilled with the message's text and linked back to the message
 * @param obj The arguments for the middleware
 * @param obj.ack The Bolt app's `ack()` function
 * @param obj.shortcut The shortcut payload
 * @param obj.client The Bolt app client
 * @returns A promise of void
 */
export default async function createIssueShortcutHandler({
  ack,
  shortcut,
  client,
}: SlackShortcutMiddlewareArgs<MessageShortcut> & AllMiddlewareArgs): Promise<void> {
  await ack();
  SlackLogger.getInstance().info(
    `\`${shortcut.user.name}\` used the \`${CREATE_ISSUE_SHORTCUT_ID}\` shortcut in \`${shortcut.channel.name}\``,
  );

  const text = shortcut.message.text ?? "";

  try {
    // The trigger ID expires after 3 seconds, so look everything up in parallel before opening the modal
    const [permalink, userNames] = await Promise.all([
      getMessagePermalink(client, shortcut.channel.id, shortcut.message_ts).catch(() => undefined),
      getUserNames(client, extractMentionedUserIds(text)),
    ]);

    await client.views.open({
      trigger_id: shortcut.trigger_id,
      view: buildIssueRequestModal(
        githubIssuesRepo,
        { channelId: shortcut.channel.id, messageTs: shortcut.message_ts, permalink },
        slackTextToMarkdown(text, userNames),
      ),
    });
  } catch (error) {
    SlackLogger.getInstance().error("Failed to open the issue request modal from a message", error);
  }
}
