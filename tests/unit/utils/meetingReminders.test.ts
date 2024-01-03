import {
  getEventReminderType,
  isTimeWithinBounds,
  EventReminderType,
  TIME_CHECK_INTERVAL,
} from "../../../src/utils/eventReminders";
import CalendarEvent from "../../../src/classes/CalendarEvent";

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
});
