import { calendar_v3 } from "googleapis";
import SlackChannel from "../classes/SlackChannel";
import { MinervaEventMetadata, parseDescription } from "../utils/calendarDescription";

export default class CalendarEvent {
  title: string;
  description?: string;
  minervaEventMetadata?: MinervaEventMetadata;
  location?: string;
  start: Date;
  end: Date;

  // Constructor takes a Google Calendar event object
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
