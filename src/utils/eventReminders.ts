import { App } from "@slack/bolt";

import CalendarEvent from "../classes/CalendarEvent";
import { postMessage } from "./slack";

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
 * @todo add support for #default as a channel
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

  const reminderText = generateEventReminderText(event, reminderType);
  console.log(
    `Sending reminder for event ${event.title} at ${event.start} to #${event.minervaEventMetadata.channel.name}.`,
  );
  postMessage(app, event.minervaEventMetadata.channel, reminderText);
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
 * @todo This is a placeholder function that should be replaced with a function that generates the actual reminder text
 */
export function generateEventReminderText(event: CalendarEvent, reminderType: EventReminderType): string {
  return `I should be generating a reminder for ${event.title} at ${event.start} with reminder type ${EventReminderType[reminderType]}!`;
}
