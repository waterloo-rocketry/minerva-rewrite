import { OAuth2Client } from "google-auth-library";
import { getEvents, parseEvents, filterEventsForChannels } from "../../../src/utils/googleCalendar";
import { slackChannels } from "../../fixtures/slackChannels";
import CalendarEvent from "../../../src/classes/CalendarEvent";
import googleCalendarEvent from "../../fixtures/googleCalendarEvent.json";
import googleCalendarEvents from "../../fixtures/googleCalendarEvents.json";

const mockEventsList = jest.fn();
jest.mock("googleapis", () => ({
  google: { calendar: (): unknown => ({ events: { list: mockEventsList } }) },
}));

describe("utils/googleCalendar", () => {
  describe("getEvents", () => {
    const auth = {} as OAuth2Client;
    const eventAt = (id: string, dateTime: string): object => ({ id, start: { dateTime } });

    it("should fetch from every calendar and merge the events in start time order", async () => {
      mockEventsList.mockImplementation(async ({ calendarId }) => ({
        data: {
          items:
            calendarId == "primary"
              ? [eventAt("a", "2021-10-10T10:00:00Z"), eventAt("c", "2021-10-10T12:00:00Z")]
              : [eventAt("b", "2021-10-10T11:00:00Z")],
        },
      }));

      const events = await getEvents(auth, ["primary", "leads@group.calendar.google.com"]);

      expect(mockEventsList.mock.calls.map(([params]) => params.calendarId)).toEqual([
        "primary",
        "leads@group.calendar.google.com",
      ]);
      expect(events.items?.map((event) => event.id)).toEqual(["a", "b", "c"]);
    });

    it("should still return the other calendars' events when one calendar fails", async () => {
      mockEventsList.mockImplementation(async ({ calendarId }) => {
        if (calendarId == "not-shared") throw new Error("Not Found");
        return { data: { items: [eventAt("a", "2021-10-10T10:00:00Z")] } };
      });

      const events = await getEvents(auth, ["primary", "not-shared"]);

      expect(events.items?.map((event) => event.id)).toEqual(["a"]);
    });
  });

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
