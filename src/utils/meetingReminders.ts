import CalendarEvent from "../classes/CalendarEvent";

export const TIME_CHECK_INTERVAL = 1000 * 60 * 5; // 5 minutes in milliseconds

export enum MeetingReminderType {
  FIVE_MINUTES = 1000 * 60 * 5, // 5 minutes in milliseconds
  SIX_HOURS = 1000 * 60 * 60 * 6, // 6 hours in milliseconds
}

export function getMeetingReminderType(event: CalendarEvent): MeetingReminderType | null {
  const nowMs = new Date().getTime();
  const eventStartMs = event.start.getTime();

  if (isTimeWithinBounds(nowMs, eventStartMs - MeetingReminderType.SIX_HOURS)) {
    return MeetingReminderType.SIX_HOURS;
  } else if (isTimeWithinBounds(nowMs, eventStartMs - MeetingReminderType.FIVE_MINUTES)) {
    return MeetingReminderType.FIVE_MINUTES;
  } else {
    return null;
  }
}

export function isTimeWithinBounds(timeMs: number, targetTimeMs: number): boolean {
  const lowerBound = targetTimeMs - TIME_CHECK_INTERVAL;
  const upperBound = targetTimeMs + TIME_CHECK_INTERVAL;
  return timeMs >= lowerBound && timeMs <= upperBound;
}
