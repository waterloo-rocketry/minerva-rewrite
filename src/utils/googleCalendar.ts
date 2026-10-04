import { OAuth2Client } from "google-auth-library";
import { google, calendar_v3 } from "googleapis";
import CalendarEvent from "../classes/CalendarEvent";
import SlackChannel from "../classes/SlackChannel";
import { SlackLogger } from "../classes/SlackLogger";
import { googleCalendarIds } from "./env";

/**
 * Fetches all events in the next 24 hours from the given calendars, merged in start time order.
 * A calendar that fails to fetch (e.g. it isn't shared with Minerva) is logged and skipped so the others still work.
 * @param auth The OAuth2 client instance for authentication.
 * @param calendarIds The IDs of the calendars to fetch from. Defaults to the GOOGLE_CALENDAR_IDS env variable.
 * @returns A promise that resolves to the list of events.
 */
export async function getEvents(
  auth: OAuth2Client,
  calendarIds: string[] = googleCalendarIds,
): Promise<calendar_v3.Schema$Events> {
  const currentTime = new Date();
  const next24Hours = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
  const calendar = google.calendar("v3");

  const results = await Promise.allSettled(
    calendarIds.map((calendarId) =>
      calendar.events.list({
        auth: auth,
        calendarId: calendarId,
        eventTypes: ["default"],
        timeMin: currentTime.toISOString(),
        timeMax: next24Hours.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      }),
    ),
  );

  const items: calendar_v3.Schema$Event[] = [];
  results.forEach((result, i) => {
    if (result.status == "fulfilled") {
      items.push(...(result.value.data.items ?? []));
    } else {
      SlackLogger.getInstance().error(
        `Failed to fetch events from Google Calendar \`${calendarIds[i]}\`:`,
        result.reason,
      );
    }
  });

  const startTime = (event: calendar_v3.Schema$Event): number =>
    new Date(event.start?.dateTime ?? event.start?.date ?? 0).getTime();
  items.sort((a, b) => startTime(a) - startTime(b));

  return { items };
}

/**
 * Parses events fetched from the Google API into a list of CalendarEvents. Ignores all-day events
 * @param events The list of events to be parsed.
 * @param channels The array of SlackChannels to associate with the events.
 * @returns A promise that resolves to the list of parsed CalendarEvents.
 */
export function parseEvents(events: calendar_v3.Schema$Events, channels: SlackChannel[]): CalendarEvent[] {
  const eventsList: CalendarEvent[] = [];
  if (events.items) {
    events.items
      .filter((event) => event.start?.dateTime && event.end?.dateTime) // All-day events don't have these properties
      .forEach((event) => {
        try {
          const calendarEvent = CalendarEvent.fromGoogleCalendarEvent(event, channels);
          eventsList.push(calendarEvent);
        } catch (error) {
          SlackLogger.getInstance().error(`Failed to parse Google Calendar event:`, error);
        }
      });

    return eventsList;
  } else {
    return [];
  }
}

/**
 * Filters CalendarEvents into those including only specified Slack channel.
 * @param calendarEvents The list of CalendarEvents to be filtered.
 * @param channelNames The names of SlackChannels to filter and associate with the events.
 * @returns The filtered list of CalendarEvents.
 */
export function filterEventsForChannels(calendarEvents: CalendarEvent[], channelNames: string[]): CalendarEvent[] {
  const filteredEvents = calendarEvents.filter((event) => {
    const metadata = event.minervaEventMetadata;
    if (metadata && metadata.channel) {
      return channelNames.includes(metadata.channel.name);
    }
    return false;
  });
  return filteredEvents;
}
