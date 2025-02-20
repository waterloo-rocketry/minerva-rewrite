import CalendarEvent from "../../../src/classes/CalendarEvent";
import { slackChannels } from "../../fixtures/slackChannels";
import googleCalendarEvent from "../../fixtures/googleCalendarEvent.json";

describe("classes/CalendarEvent", () => {
  describe("CalendarEvent.fromGoogleEvent", () => {
    it("should create a CalendarEvent from a Google Calendar event", () => {
      const calendarEvent = CalendarEvent.fromGoogleCalendarEvent(googleCalendarEvent, slackChannels);
      expect(calendarEvent).toEqual({
        title: googleCalendarEvent.summary,
        is_cancelled: false,
        url: googleCalendarEvent.htmlLink,
        description: "This is a description\nYep it is.",
        minervaEventMetadata: {
          channel: slackChannels[0],
          meetingLink: "https://example.com",
          DMSingleChannelGuests: true,
        },
        location: googleCalendarEvent.location,
        start: new Date(googleCalendarEvent.start.dateTime),
        end: new Date(googleCalendarEvent.end.dateTime),
      });
    });

    it("should create a cancelled CalendarEvent from a Google Calendar event", () => {
      const cancelledEvent = {
        ...googleCalendarEvent,
        summary: "[Cancelled]" + googleCalendarEvent.summary,
      };
      const calendarEvent = CalendarEvent.fromGoogleCalendarEvent(cancelledEvent, slackChannels);
      expect(calendarEvent.is_cancelled).toBe(true);
    });

    it("should create a CalendarEvent from a Google Calendar event when there's no metadata", () => {
      const calendarEventJson = JSON.parse(JSON.stringify(googleCalendarEvent));
      calendarEventJson.description = "This is a description<br>Yep it is.";
      const calendarEvent = CalendarEvent.fromGoogleCalendarEvent(calendarEventJson, slackChannels);
      expect(calendarEvent).toEqual({
        title: googleCalendarEvent.summary,
        is_cancelled: false,
        url: googleCalendarEvent.htmlLink,
        description: "This is a description\nYep it is.",
        location: googleCalendarEvent.location,
        start: new Date(googleCalendarEvent.start.dateTime),
        end: new Date(googleCalendarEvent.end.dateTime),
      });
    });

    it("should throw an error when the event summary is undefined", () => {
      const calendarEventJson = JSON.parse(JSON.stringify(googleCalendarEvent));
      delete calendarEventJson.summary;
      expect(() => CalendarEvent.fromGoogleCalendarEvent(calendarEventJson, slackChannels)).toThrowError(
        "Event summary is undefined",
      );
    });

    it("should throw an error when the event start is undefined", () => {
      const calendarEventJson = JSON.parse(JSON.stringify(googleCalendarEvent));
      delete calendarEventJson.start;
      expect(() => CalendarEvent.fromGoogleCalendarEvent(calendarEventJson, slackChannels)).toThrowError(
        "Event start is undefined",
      );
    });

    it("should throw an error when the event end is undefined", () => {
      const calendarEventJson = JSON.parse(JSON.stringify(googleCalendarEvent));
      delete calendarEventJson.end;
      expect(() => CalendarEvent.fromGoogleCalendarEvent(calendarEventJson, slackChannels)).toThrowError(
        "Event end is undefined",
      );
    });
  });
});
