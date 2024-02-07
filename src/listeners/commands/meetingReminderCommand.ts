import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from "@slack/bolt";
import { OAuth2Client } from "google-auth-library";

import { filterEventsForChannels, getEvents, parseEvents } from "../../utils/googleCalendar";
import { getAllSlackChannels } from "../../utils/channels";
import { logCommandUsed } from "../../utils/logging";
import { postEphemeralMessage } from "../../utils/slack";
import { EventReminderType, remindUpcomingEvent } from "../../utils/eventReminders";
import { SlackLogger } from "../../classes/SlackLogger";

export async function meetingReminderCommandHandler(
  { command, ack, client }: SlackCommandMiddlewareArgs & AllMiddlewareArgs,
  googleAuth: OAuth2Client,
): Promise<void> {
  ack();
  logCommandUsed(command);

  try {
    const slackChannels = await getAllSlackChannels(client);
    const fetchedEvents = await getEvents(googleAuth);
    const events = parseEvents(fetchedEvents, slackChannels);
    const eventsInChannel = filterEventsForChannels(events, [command.channel_name]);

    if (eventsInChannel.length === 0) {
      await postEphemeralMessage(client, command.channel_id, command.user_id, "No upcoming events in this channel.");
    } else {
      const soonestEvent = eventsInChannel.sort((a, b) => a.start.getTime() - b.start.getTime())[0];

      const commandText = command.text.trim().toLowerCase();

      await remindUpcomingEvent(
        soonestEvent,
        client,
        commandText == "ping" ? EventReminderType.MANUAL_PING : EventReminderType.MANUAL,
      );
      await postEphemeralMessage(
        client,
        command.channel_id,
        command.user_id,
        "Manual reminder sent for next event in channel.",
      );
    }
  } catch (error) {
    SlackLogger.getInstance().error("Failed to send manual meeting reminder", error);
  }
}
