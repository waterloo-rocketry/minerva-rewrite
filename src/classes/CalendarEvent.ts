import { calendar_v3 } from "googleapis";
import SlackChannel from "../classes/SlackChannel";
import { EventMetadata, parseDescription } from "../utils/calendarDescription";

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
   */
  static fromGoogleCalendarEvent(event: calendar_v3.Schema$Event, workspaceChannels: SlackChannel[]): CalendarEvent {
    if (event.summary == undefined) throw new Error("Event summary is undefined");
    const title = event.summary;
    if (event.start?.dateTime == undefined) throw new Error("Event start is undefined");
    const start = new Date(event.start.dateTime);
    if (event.end?.dateTime == undefined) throw new Error("Event end is undefined");
    const end = new Date(event.end.dateTime);

    const parsedEvent = new CalendarEvent(title, start, end);

    parsedEvent.location = event.location ?? undefined;

    if (event?.description != undefined) {
      const { description, minervaEventMetadata } = parseDescription(event.description, workspaceChannels);

      parsedEvent.description = description;
      parsedEvent.minervaEventMetadata = minervaEventMetadata;
    }

    return parsedEvent;
  }

  constructor(
    title: string,
    start: Date,
    end: Date,
    description?: string,
    location?: string,
    minervaEventMetadata?: EventMetadata,
  ) {
    this.title = title;
    this.start = start;
    this.end = end;
    this.description = description;
    this.location = location;
    this.minervaEventMetadata = minervaEventMetadata;
  }
}
