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
          id: googleCalendarEvent.id,
          title: googleCalendarEvent.summary,
          is_cancelled: false,
          url: googleCalendarEvent.htmlLink,
          description: "This is a description\nYep it is.",
          minervaEventMetadata: {
            channel: slackChannels[0],
            additionalChannels: [],
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

    it("should find a meeting link attached through Google Calendar's conference field", () => {
      const eventWithMeet = {
        ...googleCalendarEvent,
        conferenceData: {
          entryPoints: [
            { entryPointType: "phone", uri: "tel:+1-555-0100" },
            { entryPointType: "video", uri: "https://meet.google.com/abc-mnop-xyz" },
          ],
        },
      };

      const parsedEvent = parseEvents({ items: [eventWithMeet] }, slackChannels)[0];

      expect(parsedEvent.conferenceLink).toBe("https://meet.google.com/abc-mnop-xyz");
    });

    it("should fall back to the hangout link when there is no conference data", () => {
      const eventWithHangout = { ...googleCalendarEvent, hangoutLink: "https://meet.google.com/old-link" };

      const parsedEvent = parseEvents({ items: [eventWithHangout] }, slackChannels)[0];

      expect(parsedEvent.conferenceLink).toBe("https://meet.google.com/old-link");
    });

    it("should find the meeting link Minerva attached to the event", () => {
      const eventWithAttachedLink = {
        ...googleCalendarEvent,
        extendedProperties: { private: { minervaMeetingLink: "https://meet.google.com/minerva-made" } },
      };

      const parsedEvent = parseEvents({ items: [eventWithAttachedLink] }, slackChannels)[0];

      expect(parsedEvent.minervaMeetingLink).toBe("https://meet.google.com/minerva-made");
      expect(parsedEvent.conferenceLink).toBeUndefined();
    });

    it("should report no extra links for an event without any", () => {
      const parsedEvent = parseEvents(googleCalendarEvents, slackChannels)[0];

      expect(parsedEvent.conferenceLink).toBeUndefined();
      expect(parsedEvent.minervaMeetingLink).toBeUndefined();
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
      additionalChannels: [],
      meetingLink: "https://example.com",
      DMSingleChannelGuests: true,
    };

    it("should parse a Google Calendar event with one channel specified", () => {
      expect(filterEventsForChannels([event], [slackChannels[0].name])).toEqual([event]);
    });

    it("should match events by any of their channels", () => {
      const multiChannelEvent = new CalendarEvent(
        "Test Event",
        new Date("2021-10-10T10:00:00.000Z"),
        new Date("2021-10-10T11:00:00.000Z"),
        "https://example.com",
        false,
      );
      multiChannelEvent.minervaEventMetadata = {
        channel: slackChannels[0],
        additionalChannels: [slackChannels[2]],
        DMSingleChannelGuests: true,
      };
      expect(filterEventsForChannels([multiChannelEvent], [slackChannels[2].name])).toEqual([multiChannelEvent]);
    });

    it("should return empty if no calendar events match the specified channel", () => {
      expect(filterEventsForChannels([event], [slackChannels[1].name])).toEqual([]);
    });
  });
});
