import { App } from "@slack/bolt";

import CalendarEvent from "../classes/CalendarEvent";
import { ChatPostMessageResponse } from "@slack/web-api";
import { postMessage } from "./slack";
import moment from "moment-timezone";

/**
 * The interval in milliseconds at which the scheduled event checking task runs
 */
export const TIME_CHECK_INTERVAL = 1000 * 60 * 5; // 5 minutes in milliseconds

/**
 * The types of event reminders that can be sent
 */
export enum EventReminderType {
  FIVE_MINUTES = 1000 * 60 * 5, // 5 minutes in milliseconds
  SIX_HOURS = 1000 * 60 * 60 * 6, // 6 hours in milliseconds
}

/**
 * Checks if the given time is within the bounds of the target time, with the bounds being +/- the TIME_CHECK_INTERVAL with an open lower bound and a closed upper bound
 * @param timeMs The time to check in milliseconds
 * @param targetTimeMs The target time to check against in milliseconds
 * @returns Whether the time is within the bounds of the target time
 */
export function isTimeWithinBounds(timeMs: number, targetTimeMs: number): boolean {
  // Making the bounds of checking the time the middle of the intervals to prevent overlap
  const lowerBound = targetTimeMs - TIME_CHECK_INTERVAL / 2;
  const upperBound = targetTimeMs + TIME_CHECK_INTERVAL / 2;
  // If the event is at -/+ 2.5mins from the target time, it will be valid only if it is at the upper bound
  return timeMs > lowerBound && timeMs <= upperBound;
}

/**
 * Gets the type of reminder that should be sent for the given event based on the current time
 * @param event The event to get the reminder type for
 * @returns The type of reminder to send, or null if no reminder should be sent
 */
export function getEventReminderType(event: CalendarEvent): EventReminderType | null {
  const nowMs = new Date().getTime();
  const eventStartMs = event.start.getTime();

  if (isTimeWithinBounds(nowMs, eventStartMs - EventReminderType.SIX_HOURS)) {
    return EventReminderType.SIX_HOURS;
  } else if (isTimeWithinBounds(nowMs, eventStartMs - EventReminderType.FIVE_MINUTES)) {
    return EventReminderType.FIVE_MINUTES;
  } else {
    return null;
  }
}

/**
 * Posts a reminder for the given event to the channel it is associated with
 * @param event The event to post a reminder for
 * @param app The Bolt App
 */
export function remindUpcomingEvent(event: CalendarEvent, app: App): void {
  // If the event does not have event metadata, then minerva ignores it
  if (!event.minervaEventMetadata) {
    return;
  }

  const reminderType = getEventReminderType(event);

  if (!reminderType) {
    return;
  }

  let reminderText = generateEventReminderText(event, reminderType);
  let reactEmojis: string[] = [];

  if (reminderType === EventReminderType.SIX_HOURS) {
    // TODO Randomized emojis
    reactEmojis = ["white_check_mark", "x"];

    reminderText += `\nReact with :${reactEmojis[0]}: if you're coming, or :${reactEmojis[1]}: if you're not!`;
  }

  const reminderChannels = event.minervaEventMetadata.channels;

  console.log(
    `Sending reminder for event "${event.title}" at ${event.start} to ${event.minervaEventMetadata.channels
      .map((channel) => `#${channel.name}`)
      .join(", ")}`,
  );

  reminderChannels.forEach(async (channel) => {
    let res: ChatPostMessageResponse | undefined = undefined;
    try {
      res = await postMessage(app, channel, reminderText, {
        unfurl_links: false,
        unfurl_media: false,
      });
    } catch (error) {
      console.error(error);
    }

    if (res != undefined && reactEmojis.length > 0) {
      reactEmojis.forEach(async (emoji) => {
        // TODO Proper function for adding reactions
        try {
          await app.client.reactions.add({
            channel: channel.id,
            name: emoji,
            timestamp: res?.ts,
          });
        } catch (error) {
          console.error(`Failed to add reaction ${emoji} to message ${res?.ts} with error ${error}`);
        }
      });
    }
  });
}

/**
 * Posts reminders for the given events to the channels they are associated with
 * @param events The events to post reminders for
 * @param app The Bolt App
 */
export function remindUpcomingEvents(events: CalendarEvent[], app: App): void {
  events.forEach((event) => {
    remindUpcomingEvent(event, app);
  });
}

/**
 * Generates the text body for the event reminder message
 * @param event The event to generate the reminder text for
 * @param reminderType The type of reminder to generate the text for
 * @returns The generated reminder text
 */
export function generateEventReminderText(event: CalendarEvent, reminderType: EventReminderType): string {
  // let message = `<!channel>\nReminder: *${event.title}* is occurring`;
  let message = `Reminder: *${event.title}* is occurring`;

  if (reminderType === EventReminderType.FIVE_MINUTES) {
    const timeUntilEvent = event.start.getTime() - new Date().getTime();
    message += ` in *${Math.ceil(timeUntilEvent / 1000 / 60)} minutes*`;
  } else {
    message += ` at *${moment(event.start).tz("America/Toronto").format("MMMM Do, YYYY [at] h:mm A")}*`;
  }

  if (event.url) {
    message += `\n<${event.url}|Event Details>`;
  }

  message += `\nWays to attend:`;
  if (event.location) {
    message += `\n\t:office: In person @ ${event.location}`;
  }

  message += `\n\t:globe_with_meridians: Online @ ${
    event.minervaEventMetadata?.meetingLink ?? "https://meet.waterloorocketry.com/bay_area"
  }`;

  return message;
}
