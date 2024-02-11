import { SlashCommand } from "@slack/bolt";
import { SlackLogger } from "../classes/SlackLogger";

/**
 * Logs the use of a slash command.
 * @param command - The slash command to log.
 */
export async function logCommandUsed(command: SlashCommand): Promise<void> {
  await SlackLogger.getInstance().info(
    `\`${command.user_name}\` used the \`${command.command}\` command in \`${command.channel_name}\``,
  );
}
