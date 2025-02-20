import { parseEvents, filterEventsForChannels } from "../../../src/utils/googleCalendar";
import { slackChannels } from "../../fixtures/slackChannels";
import CalendarEvent from "../../../src/classes/CalendarEvent";
import googleCalendarEvent from "../../fixtures/googleCalendarEvent.json";
import googleCalendarEvents from "../../fixtures/googleCalendarEvents.json";

describe("utils/googleCalendar", () => {
  describe("parseEvents", () => {
    it("should parse a Google Calendar event", () => {
      expect(parseEvents(googleCalendarEvents, slackChannels)).toEqual([
        {
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
        },
      ]);
    });

    it("should parse a cancelled Google Calendar event", () => {
      const cancelledEvent = {
        ...googleCalendarEvent,
        summary: "[cancelled]" + googleCalendarEvent.summary,
      };
      const parsedEvent = parseEvents({ items: [cancelledEvent] }, slackChannels)[0];
      expect(parsedEvent.is_cancelled).toBe(true);
    });

    it("should ignore all-day events", () => {
      const allDayEvent = {
        ...googleCalendarEvent,
        start: { date: "2021-10-10" },
        end: { date: "2021-10-11" },
      };

      expect(parseEvents({ items: [allDayEvent] }, slackChannels)).toEqual([]);
    });
  });

  describe("parseEventsOfChannels", () => {
    const event = new CalendarEvent(
      "Test Event",
      new Date("2021-10-10T10:00:00.000Z"),
      new Date("2021-10-10T11:00:00.000Z"),
      "https://example.com",
    );
    event.minervaEventMetadata = {
      channel: slackChannels[0],
      meetingLink: "https://example.com",
      DMSingleChannelGuests: true,
    };

    it("should parse a Google Calendar event with one channel specified", () => {
      expect(filterEventsForChannels([event], [slackChannels[0].name])).toEqual([event]);
    });

    it("should return empty if no calendar events match the specified channel", () => {
      expect(filterEventsForChannels([event], [slackChannels[1].name])).toEqual([]);
    });
  });
});
