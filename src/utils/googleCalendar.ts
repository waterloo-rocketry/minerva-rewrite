import { OAuth2Client } from "google-auth-library";
import { google, calendar_v3 } from "googleapis";
import CalendarEvent from "../classes/CalendarEvent";
import SlackChannel from "../classes/SlackChannel";

/**
 * Fetches all events in the next 24 hours from the Rocketry calendar.
 * @param auth The OAuth2 client instance for authentication.
 * @returns A promise that resolves to the list of events.
 */
export async function getEvents(auth: OAuth2Client): Promise<calendar_v3.Schema$Events> {
  const currentTime = new Date();
  const next24Hours = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
  const calendar = google.calendar("v3");
  const getNextEvents = await calendar.events.list({
    auth: auth,
    calendarId: "primary",
    timeMin: currentTime.toISOString(),
    timeMax: next24Hours.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return getNextEvents.data;
}

/**
 * Parses events fetched from the Google API into a list of CalendarEvents.
 * @param events The list of events to be parsed.
 * @param channels The array of SlackChannels to associate with the events.
 * @returns A promise that resolves to the list of parsed CalendarEvents.
 */
export async function parseEvents(
  events: calendar_v3.Schema$Events,
  channels: SlackChannel[],
): Promise<CalendarEvent[]> {
  const eventsList: CalendarEvent[] = [];
  if (events.items) {
    events.items.forEach((event) => {
      const calendarEvent = new CalendarEvent(event, channels);
      eventsList.push(calendarEvent);
    });
  } else {
    return [];
  }
  return eventsList;
}

/**
 * Filters CalendarEvents into those only from specified Slack channels.
 * @param calendarEvents The list of CalendarEvents to be filtered.
 * @param channelNames The names of SlackChannels to filter and associate with the events.
 * @returns The filtered list of CalendarEvents.
 */
export function parseEventsOfChannels(calendarEvents: CalendarEvent[], channelNames: string[]): CalendarEvent[] {
  const filteredEvents = calendarEvents.filter((event) => {
    const metadata = event.minervaEventMetadata;
    if (metadata && metadata.channel) {
      return channelNames.includes(metadata.channel.name);
    }
    return false;
  });
  return filteredEvents;
}
