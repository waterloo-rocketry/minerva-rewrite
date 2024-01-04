import CalendarEvent from "../../../src/classes/CalendarEvent";
import { slackChannels } from "../../fixtures/slackChannels";
import googleCalendarEvent from "../../fixtures/googleCalendarEvent.json";

describe("classes/CalendarEvent", () => {
  describe("CalendarEvent.fromGoogleEvent", () => {
    it("should create a CalendarEvent from a Google Calendar event", () => {
      const calendarEvent = CalendarEvent.fromGoogleCalendarEvent(googleCalendarEvent, slackChannels);
      expect(calendarEvent).toEqual({
        title: googleCalendarEvent.summary,
        description: "This is a description\nYep it is.",
        minervaEventMetadata: {
          channel: slackChannels[0],
          meetingLink: "https://example.com",
        },
        location: googleCalendarEvent.location,
        start: new Date(googleCalendarEvent.start.dateTime),
        end: new Date(googleCalendarEvent.end.dateTime),
      });
    });

    it("should create a CalendarEvent from a Google Calendar event when there's no metadata", () => {
      const calendarEventJson = JSON.parse(JSON.stringify(googleCalendarEvent));
      calendarEventJson.description = "This is a description<br>Yep it is.";
      const calendarEvent = CalendarEvent.fromGoogleCalendarEvent(calendarEventJson, slackChannels);
      expect(calendarEvent).toEqual({
        title: googleCalendarEvent.summary,
        description: "This is a description\nYep it is.",
        location: googleCalendarEvent.location,
        start: new Date(googleCalendarEvent.start.dateTime),
        end: new Date(googleCalendarEvent.end.dateTime),
      });
    });
  });
});
