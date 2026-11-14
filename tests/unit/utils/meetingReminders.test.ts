import {
  getEventReminderType,
  isTimeWithinBounds,
  EventReminderType,
  generateEventReminderChannelText,
  generateMeetingLink,
  TIME_CHECK_INTERVAL,
} from "../../../src/utils/eventReminders";
import CalendarEvent from "../../../src/classes/CalendarEvent";
import { slackChannels } from "../../fixtures/slackChannels";

describe("utils/eventReminders", () => {
  describe("isTimeWithinBounds", () => {
    it("should return false if the time is below the lower bound", () => {
      const result = isTimeWithinBounds(1000000 - TIME_CHECK_INTERVAL / 2 - 1, 1000000);
      expect(result).toBe(false);
    });

    it("should return false if the time is at the lower bound", () => {
      const result = isTimeWithinBounds(1000000 - TIME_CHECK_INTERVAL / 2, 1000000);
      expect(result).toBe(false);
    });

    it("should return true if the time is within the bounds", () => {
      const result = isTimeWithinBounds(1000000, 1000000);
      expect(result).toBe(true);
    });

    it("should return true if the time is at the upper bound", () => {
      const result = isTimeWithinBounds(1000000 + TIME_CHECK_INTERVAL / 2, 1000000);
      expect(result).toBe(true);
    });

    it("should return false if the time is above the upper bound", () => {
      const result = isTimeWithinBounds(1000000 + TIME_CHECK_INTERVAL / 2 + 1, 1000000);
      expect(result).toBe(false);
    });
  });

  describe("getEventReminderType", () => {
    jest.useFakeTimers().setSystemTime(new Date("2023-01-01T00:00:00.000Z").getTime());
    const event = new CalendarEvent(
      "Test event",
      new Date("2023-01-01T06:00:01.000Z"),
      new Date("2024-01-01T07:00:00.000Z"),
      "https://www.google.com/calendar/event?eid=MGJyczFiMjJuZHJjZzRnZmx0Z2c1OGRocmkgdXdhdGVybG9vLnJvY2tldHJ5LmRxxxxx",
    );

    it("should return null if the event is more than 6h2m30s away", () => {
      event.start = new Date("2023-01-01T06:02:31.000Z");
      const result = getEventReminderType(event);
      expect(result).toBeNull();
    });

    it("should return null if the event is exactly 6h2m30s away", () => {
      event.start = new Date("2023-01-01T06:02:30.000Z");
      const result = getEventReminderType(event);
      expect(result).toBeNull();
    });

    it("should return EventReminderType.SIX_HOURS if the event is in the range [5h57m30s, 6h2m30s) away (6h2m30s edge)", () => {
      event.start = new Date("2023-01-01T06:02:29.000Z");
      const result = getEventReminderType(event);
      expect(result).toBe(EventReminderType.SIX_HOURS);
    });

    it("should return EventReminderType.SIX_HOURS if the event is in the range [5h57m30s, 6h2m30s) away (5h57m30s edge)", () => {
      event.start = new Date("2023-01-01T05:57:31.000Z");
      const result = getEventReminderType(event);
      expect(result).toBe(EventReminderType.SIX_HOURS);
    });

    it("should return EventReminderType.SIX_HOURS if the event is exactly 5h57m30s away", () => {
      event.start = new Date("2023-01-01T05:57:30.000Z");
      const result = getEventReminderType(event);
      expect(result).toBe(EventReminderType.SIX_HOURS);
    });

    it("should return null if the event is between 7m30s and 5h57m30s away (5h57m30s edge)", () => {
      event.start = new Date("2023-01-01T05:57:29.000Z");
      const result = getEventReminderType(event);
      expect(result).toBeNull();
    });

    it("should return null if the event is between 7m30s and 5h57m30s away (7m30s edge)", () => {
      event.start = new Date("2023-01-01T00:07:31.000Z");
      const result = getEventReminderType(event);
      expect(result).toBeNull();
    });

    it("should return null if the event is exactly 7m30s away", () => {
      event.start = new Date("2023-01-01T00:07:30.000Z");
      const result = getEventReminderType(event);
      expect(result).toBeNull();
    });

    it("should return EventReminderType.FIVE_MINUTES if the event is in the range [2m30s, 7m30s) away (7m30s edge)", () => {
      event.start = new Date("2023-01-01T00:07:29.000Z");
      const result = getEventReminderType(event);
      expect(result).toBe(EventReminderType.FIVE_MINUTES);
    });

    it("should return EventReminderType.FIVE_MINUTES if the event is in the range [2m30s, 7m30s) away (2m30s edge)", () => {
      event.start = new Date("2023-01-01T00:02:31.000Z");
      const result = getEventReminderType(event);
      expect(result).toBe(EventReminderType.FIVE_MINUTES);
    });

    it("should return EventReminderType.FIVE_MINUTES if the event is exactly 2m30s away", () => {
      event.start = new Date("2023-01-01T00:02:30.000Z");
      const result = getEventReminderType(event);
      expect(result).toBe(EventReminderType.FIVE_MINUTES);
    });

    it("should return null if the event is between now and 2m30s away", () => {
      event.start = new Date("2023-01-01T00:02:29.000Z");
      const result = getEventReminderType(event);
      expect(result).toBeNull();
    });

    it("should return null if the event is now", () => {
      event.start = new Date("2023-01-01T00:00:00.000Z");
      const result = getEventReminderType(event);
      expect(result).toBeNull();
    });

    it("should return null if the event is in the past", () => {
      event.start = new Date("2022-12-31T23:59:59.000Z");
      const result = getEventReminderType(event);
      expect(result).toBeNull();
    });
  });
  describe("generateMeetingLink", () => {
    const makeEvent = (title: string, url: string) =>
      new CalendarEvent(title, new Date("2023-01-01T06:00:00.000Z"), new Date("2023-01-01T07:00:00.000Z"), url, false);

    it("should use the event title as the room name", () => {
      const link = generateMeetingLink(makeEvent("Software Meeting: Q&A!", "https://example.com/a"));
      expect(link).toMatch(/^https:\/\/meet\.waterloorocketry\.com\/bay_area_software_meeting_q_a_[0-9a-f]{6}$/);
    });

    it("should give the same link every time for the same event", () => {
      const a = generateMeetingLink(makeEvent("Software Meeting", "https://example.com/a"));
      const b = generateMeetingLink(makeEvent("Software Meeting", "https://example.com/a"));
      expect(a).toBe(b);
    });

    it("should give different links to events with the same title", () => {
      const a = generateMeetingLink(makeEvent("Software Meeting", "https://example.com/a"));
      const b = generateMeetingLink(makeEvent("Software Meeting", "https://example.com/b"));
      expect(a).not.toBe(b);
    });

    it("should fall back to 'meeting' if the title has no letters or numbers", () => {
      const link = generateMeetingLink(makeEvent("!!!", "https://example.com/a"));
      expect(link).toMatch(/^https:\/\/meet\.waterloorocketry\.com\/bay_area_meeting_[0-9a-f]{6}$/);
    });

    it("should cap long titles at 40 characters", () => {
      const link = generateMeetingLink(makeEvent("a".repeat(100), "https://example.com/a"));
      expect(link).toMatch(new RegExp(`/bay_area_${"a".repeat(40)}_[0-9a-f]{6}$`));
    });
  });

  describe("generateEventReminderText", () => {
    let event: CalendarEvent;
    beforeEach(() => {
      event = new CalendarEvent(
        "Test event",
        new Date("2023-01-01T06:00:00.000Z"),
        new Date("2024-01-01T07:00:00.000Z"),
        "https://www.google.com/calendar/event?eid=MGJyczFiMjJuZHJjZzRnZmx0Z2c1OGRocmkgdXdhdGVybG9vLnJvY2tldHJ5LmRxxxxx",
      );
    });

    it("should generate a reminder for 6 hours with the meeting link and location provided", () => {
      jest.useFakeTimers().setSystemTime(new Date("2023-01-01T00:00:00.000Z").getTime());
      event.location = "Test location";
      event.minervaEventMetadata = {
        channel: slackChannels[0],
        meetingLink: "https://example.com",
      };
      const result = generateEventReminderChannelText(event, EventReminderType.SIX_HOURS);

      expect(result).toBe(
        `Reminder: *Test event* is occurring at *January 1st, 2023 at 1:00 AM*
<https://www.google.com/calendar/event?eid=MGJyczFiMjJuZHJjZzRnZmx0Z2c1OGRocmkgdXdhdGVybG9vLnJvY2tldHJ5LmRxxxxx|Event Details>
Ways to attend:
\t:office: In person @ Test location
\t:globe_with_meridians: Online @ https://example.com`,
      );
    });

    it("should generate a reminder for 5 minutes with the meeting link and location provided", () => {
      jest.useFakeTimers().setSystemTime(new Date("2023-01-01T05:55:00.000Z").getTime());
      event.location = "Test location";
      event.minervaEventMetadata = {
        channel: slackChannels[0],
        meetingLink: "https://example.com",
      };
      const result = generateEventReminderChannelText(event, EventReminderType.FIVE_MINUTES);

      expect(result).toBe(
        `<!channel>
Reminder: *Test event* is occurring in *5 minutes*
<https://www.google.com/calendar/event?eid=MGJyczFiMjJuZHJjZzRnZmx0Z2c1OGRocmkgdXdhdGVybG9vLnJvY2tldHJ5LmRxxxxx|Event Details>
Ways to attend:
\t:office: In person @ Test location
\t:globe_with_meridians: Online @ https://example.com`,
      );
    });

    it("should generate a manually triggered reminder with the meeting link and location provided", () => {
      jest.useFakeTimers().setSystemTime(new Date("2023-01-01T00:00:00.000Z").getTime());
      event.location = "Test location";
      event.minervaEventMetadata = {
        channel: slackChannels[0],
        meetingLink: "https://example.com",
      };
      const result = generateEventReminderChannelText(event, EventReminderType.MANUAL);

      expect(result).toBe(
        `Reminder: *Test event* is occurring at *January 1st, 2023 at 1:00 AM*
<https://www.google.com/calendar/event?eid=MGJyczFiMjJuZHJjZzRnZmx0Z2c1OGRocmkgdXdhdGVybG9vLnJvY2tldHJ5LmRxxxxx|Event Details>
Ways to attend:
\t:office: In person @ Test location
\t:globe_with_meridians: Online @ https://example.com`,
      );
    });

    it("should generate a manually triggered reminder with a ping with the meeting link and location provided", () => {
      jest.useFakeTimers().setSystemTime(new Date("2023-01-01T00:00:00.000Z").getTime());
      event.location = "Test location";
      event.minervaEventMetadata = {
        channel: slackChannels[0],
        meetingLink: "https://example.com",
      };
      const result = generateEventReminderChannelText(event, EventReminderType.MANUAL_PING);

      expect(result).toBe(`<!channel>
Reminder: *Test event* is occurring at *January 1st, 2023 at 1:00 AM*
<https://www.google.com/calendar/event?eid=MGJyczFiMjJuZHJjZzRnZmx0Z2c1OGRocmkgdXdhdGVybG9vLnJvY2tldHJ5LmRxxxxx|Event Details>
Ways to attend:
\t:office: In person @ Test location
\t:globe_with_meridians: Online @ https://example.com`);
    });

    it("should generate a reminder for 6 hours with no meeting link or location provided", () => {
      jest.useFakeTimers().setSystemTime(new Date("2023-01-01T00:00:00.000Z").getTime());
      event.minervaEventMetadata = {
        channel: slackChannels[0],
      };
      const result = generateEventReminderChannelText(event, EventReminderType.SIX_HOURS);

      expect(result).toBe(
        `Reminder: *Test event* is occurring at *January 1st, 2023 at 1:00 AM*
<https://www.google.com/calendar/event?eid=MGJyczFiMjJuZHJjZzRnZmx0Z2c1OGRocmkgdXdhdGVybG9vLnJvY2tldHJ5LmRxxxxx|Event Details>
Ways to attend:
\t:globe_with_meridians: Online @ https://meet.waterloorocketry.com/bay_area_test_event_89ef16`,
      );
    });

    it("should generate a reminder for 5 minutes with no meeting link or location provided", () => {
      jest.useFakeTimers().setSystemTime(new Date("2023-01-01T05:55:00.000Z").getTime());
      event.minervaEventMetadata = {
        channel: slackChannels[0],
      };
      const result = generateEventReminderChannelText(event, EventReminderType.FIVE_MINUTES);

      expect(result).toBe(
        `<!channel>
Reminder: *Test event* is occurring in *5 minutes*
<https://www.google.com/calendar/event?eid=MGJyczFiMjJuZHJjZzRnZmx0Z2c1OGRocmkgdXdhdGVybG9vLnJvY2tldHJ5LmRxxxxx|Event Details>
Ways to attend:
\t:globe_with_meridians: Online @ https://meet.waterloorocketry.com/bay_area_test_event_89ef16`,
      );
    });

    it("should generate a reminder for 6 hours with only location provided", () => {
      jest.useFakeTimers().setSystemTime(new Date("2023-01-01T00:00:00.000Z").getTime());
      event.location = "Test location";
      event.minervaEventMetadata = {
        channel: slackChannels[0],
      };
      const result = generateEventReminderChannelText(event, EventReminderType.SIX_HOURS);

      expect(result).toBe(
        `Reminder: *Test event* is occurring at *January 1st, 2023 at 1:00 AM*
<https://www.google.com/calendar/event?eid=MGJyczFiMjJuZHJjZzRnZmx0Z2c1OGRocmkgdXdhdGVybG9vLnJvY2tldHJ5LmRxxxxx|Event Details>
Ways to attend:
\t:office: In person @ Test location
\t:globe_with_meridians: Online @ https://meet.waterloorocketry.com/bay_area_test_event_89ef16`,
      );
    });

    it("should generate a reminder for 5 minutes with only location provided", () => {
      jest.useFakeTimers().setSystemTime(new Date("2023-01-01T05:55:00.000Z").getTime());
      event.minervaEventMetadata = {
        channel: slackChannels[0],
      };
      event.location = "Test location";
      const result = generateEventReminderChannelText(event, EventReminderType.FIVE_MINUTES);

      expect(result).toBe(
        `<!channel>
Reminder: *Test event* is occurring in *5 minutes*
<https://www.google.com/calendar/event?eid=MGJyczFiMjJuZHJjZzRnZmx0Z2c1OGRocmkgdXdhdGVybG9vLnJvY2tldHJ5LmRxxxxx|Event Details>
Ways to attend:
\t:office: In person @ Test location
\t:globe_with_meridians: Online @ https://meet.waterloorocketry.com/bay_area_test_event_89ef16`,
      );
    });

    it("should generate a reminder for 6 hours with only meeting link provided", () => {
      jest.useFakeTimers().setSystemTime(new Date("2023-01-01T00:00:00.000Z").getTime());
      event.minervaEventMetadata = {
        channel: slackChannels[0],
        meetingLink: "https://example.com",
      };
      const result = generateEventReminderChannelText(event, EventReminderType.SIX_HOURS);

      expect(result).toBe(
        `Reminder: *Test event* is occurring at *January 1st, 2023 at 1:00 AM*
<https://www.google.com/calendar/event?eid=MGJyczFiMjJuZHJjZzRnZmx0Z2c1OGRocmkgdXdhdGVybG9vLnJvY2tldHJ5LmRxxxxx|Event Details>
Ways to attend:
\t:globe_with_meridians: Online @ https://example.com`,
      );
    });

    it("should generate a reminder for 5 minutes with only meeting link provided", () => {
      jest.useFakeTimers().setSystemTime(new Date("2023-01-01T05:55:00.000Z").getTime());
      event.minervaEventMetadata = {
        channel: slackChannels[0],
        meetingLink: "https://example.com",
      };
      const result = generateEventReminderChannelText(event, EventReminderType.FIVE_MINUTES);

      expect(result).toBe(
        `<!channel>
Reminder: *Test event* is occurring in *5 minutes*
<https://www.google.com/calendar/event?eid=MGJyczFiMjJuZHJjZzRnZmx0Z2c1OGRocmkgdXdhdGVybG9vLnJvY2tldHJ5LmRxxxxx|Event Details>
Ways to attend:
\t:globe_with_meridians: Online @ https://example.com`,
      );
    });
  });
});
