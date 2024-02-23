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
