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

  // Constructor takes a Google Calendar event object
  // Also takes a list of workspace channels so they don't have to be fetched every time
  constructor(event: calendar_v3.Schema$Event, workspaceChannels: SlackChannel[]) {
    if (event.summary == undefined) throw new Error("Event summary is undefined");
    this.title = event.summary;
    if (event.start?.dateTime == undefined) throw new Error("Event start is undefined");
    this.start = new Date(event.start.dateTime);
    if (event.end?.dateTime == undefined) throw new Error("Event end is undefined");
    this.end = new Date(event.end.dateTime);

    this.location = event.location ?? undefined;

    if (event?.description != undefined) {
      const { description, minervaEventMetadata } = parseDescription(event.description, workspaceChannels);

      this.description = description;
      this.minervaEventMetadata = minervaEventMetadata;
    }
  }
}
