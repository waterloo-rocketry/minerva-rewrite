import { calendar_v3 } from "googleapis";
import SlackChannel from "../classes/SlackChannel";
import { parseDescription } from "../utils/calendarDescription";
import { EventMetadata } from "../types/EventMetadata";

/**
 * Class representing a google calendar event
 */
export default class CalendarEvent {
  /**
   * The title of the event
   */
  title: string;
  /**
   * The description of the event
   */
  description?: string;
  /**
   * A read-only URL to the event in Google Calendar
   */
  url: string;
  /**
   * The metadata of the event that minerva uses. This includes the main channel, additional channels, and meeting link
   */
  minervaEventMetadata?: EventMetadata;
  /**
   * The location of the event
   */
  location?: string;
  /**
   * The start time of the event
   */
  start: Date;
  /**
   * The end time of the event
   */
  end: Date;

  /**
   * Parses a google calendar event into a CalendarEvent object
   * @param event The google calendar event to parse
   * @param workspaceChannels The list of slack channels in the workspace. Used to create SlackChannel objects from the channel names in the event description
   * @returns The parsed CalendarEvent object
   * @throws Error if the event summary, start time, end time, or URL is undefined
   */
  static fromGoogleCalendarEvent(event: calendar_v3.Schema$Event, workspaceChannels: SlackChannel[]): CalendarEvent {
    if (event.summary == undefined) {
      throw new Error("Event summary is undefined");
    }
    const title = event.summary;
    if (event.start?.dateTime == undefined) {
      throw new Error(`Event start is undefined for event "${event.summary}"`);
    }
    const start = new Date(event.start.dateTime);
    if (event.end?.dateTime == undefined) {
      throw new Error(`Event end is undefined for event "${event.summary}"`);
    }
    const end = new Date(event.end.dateTime);
    if (event.htmlLink == undefined) {
      throw new Error(`Event URL is undefined for event "${event.summary}"`);
    }
    const url = event.htmlLink;

    const parsedEvent = new CalendarEvent(title, start, end, url);

    parsedEvent.location = event.location ?? undefined;
    parsedEvent.url = event.htmlLink ?? undefined;

    if (event?.description != undefined) {
      try {
        const { description, minervaEventMetadata } = parseDescription(event.description, workspaceChannels);
        parsedEvent.minervaEventMetadata = minervaEventMetadata;
        parsedEvent.description = description;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(
            `Failed to parse event description for event "${event.summary}" with error: ${error.message}`,
          );
        }
        throw new Error(`Failed to parse event description for event ${event.summary}: ${error}`);
      }
    }

    return parsedEvent;
  }

  constructor(
    title: string,
    start: Date,
    end: Date,
    url: string,
    description?: string,
    location?: string,
    minervaEventMetadata?: EventMetadata,
  ) {
    this.title = title;
    this.start = start;
    this.end = end;
    this.url = url;
    this.description = description;
    this.location = location;
    this.minervaEventMetadata = minervaEventMetadata;
  }
}
