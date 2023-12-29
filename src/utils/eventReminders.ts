import { App } from "@slack/bolt";

import CalendarEvent from "../classes/CalendarEvent";
import { postMessage } from "./slack";

export const TIME_CHECK_INTERVAL = 1000 * 60 * 5; // 5 minutes in milliseconds

export enum EventReminderType {
  FIVE_MINUTES = 1000 * 60 * 5, // 5 minutes in milliseconds
  SIX_HOURS = 1000 * 60 * 60 * 6, // 6 hours in milliseconds
}

export function isTimeWithinBounds(timeMs: number, targetTimeMs: number): boolean {
  // Making the bounds of checking the time the middle of the intervals to prevent overlap
  const lowerBound = targetTimeMs - TIME_CHECK_INTERVAL / 2;
  const upperBound = targetTimeMs + TIME_CHECK_INTERVAL / 2;
  // If the event is at -/+ 2.5mins from the target time, it will be valid only if it is at the upper bound
  return timeMs > lowerBound && timeMs <= upperBound;
}

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

export function remindUpcomingEvent(event: CalendarEvent, app: App): void {
  if (!event.minervaEventMetadata) {
    return;
  }

  const reminderType = getEventReminderType(event);
  console.log(`Reminder type for ${event.title} is ${reminderType ?? "null"}.`);
  if (!reminderType) {
    return;
  }

  const reminderText = generateEventReminderText(event, reminderType);
  postMessage(app, event.minervaEventMetadata.channel, reminderText);
}

export function remindUpcomingEvents(event: CalendarEvent[], app: App): void {
  event.forEach((event) => {
    remindUpcomingEvent(event, app);
  });
}

export function generateEventReminderText(event: CalendarEvent, reminderType: EventReminderType): string {
  return `I should be generating a reminder for ${event.title} at ${event.start} with reminder type ${EventReminderType[reminderType]}!`;
}
