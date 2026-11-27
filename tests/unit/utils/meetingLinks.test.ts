import CalendarEvent from "../../../src/classes/CalendarEvent";
import { createMeetingLinkProvider, findExistingMeetingLink } from "../../../src/utils/meetingLinks";
import { slackChannels } from "../../fixtures/slackChannels";

/**
 * Makes an event with Minerva metadata and no meeting link.
 * @param overrides Fields to set on the event.
 * @returns The event.
 */
function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  const event = new CalendarEvent(
    "Software Meeting",
    new Date("2023-01-01T06:00:00.000Z"),
    new Date("2023-01-01T07:00:00.000Z"),
    "https://example.com/event",
    false,
  );
  event.id = "event-1";
  event.minervaEventMetadata = { channel: slackChannels[0], DMSingleChannelGuests: false };
  return Object.assign(event, overrides);
}

/**
 * Stands in for Google: each created link is unique, and attached links are recorded.
 * @returns The two Google operations, and what they created and attached.
 */
function fakeGoogle(): {
  createMeetingLink: () => Promise<string>;
  attachMeetingLink: (event: CalendarEvent, link: string) => Promise<void>;
  created: string[];
  attached: string[];
} {
  const created: string[] = [];
  const attached: string[] = [];
  return {
    created,
    attached,
    createMeetingLink: async (): Promise<string> => {
      const link = `https://meet.google.com/created-${created.length + 1}`;
      created.push(link);
      return link;
    },
    attachMeetingLink: async (_event, link): Promise<void> => {
      attached.push(link);
    },
  };
}

describe("utils/meetingLinks", () => {
  describe("findExistingMeetingLink", () => {
    it("prefers the description link, then the conference link, then the one Minerva attached", () => {
      const event = makeEvent({
        conferenceLink: "https://zoom.example/c",
        minervaMeetingLink: "https://meet.google.com/m",
      });
      event.minervaEventMetadata = { channel: slackChannels[0], meetingLink: "https://example.com/d" };

      expect(findExistingMeetingLink(event)).toBe("https://example.com/d");
      event.minervaEventMetadata.meetingLink = undefined;
      expect(findExistingMeetingLink(event)).toBe("https://zoom.example/c");
      event.conferenceLink = undefined;
      expect(findExistingMeetingLink(event)).toBe("https://meet.google.com/m");
      event.minervaMeetingLink = undefined;
      expect(findExistingMeetingLink(event)).toBeUndefined();
    });
  });

  describe("createMeetingLinkProvider", () => {
    it("creates, attaches and returns a link for an event without one", async () => {
      const google = fakeGoogle();
      const getMeetingLink = createMeetingLinkProvider(google.createMeetingLink, google.attachMeetingLink);

      const link = await getMeetingLink(makeEvent());

      expect(link).toBe("https://meet.google.com/created-1");
      expect(google.attached).toEqual(["https://meet.google.com/created-1"]);
    });

    it("keeps sending the link Minerva attached without creating another", async () => {
      const google = fakeGoogle();
      const getMeetingLink = createMeetingLinkProvider(google.createMeetingLink, google.attachMeetingLink);

      const link = await getMeetingLink(makeEvent({ minervaMeetingLink: "https://meet.google.com/earlier" }));

      expect(link).toBe("https://meet.google.com/earlier");
      expect(google.created).toEqual([]);
    });

    it("sends the same link on every reminder for the same event", async () => {
      const google = fakeGoogle();
      const getMeetingLink = createMeetingLinkProvider(google.createMeetingLink, google.attachMeetingLink);
      const event = makeEvent();

      const first = await getMeetingLink(event);
      const second = await getMeetingLink(event);

      expect(second).toBe(first);
      expect(google.created).toHaveLength(1);
    });

    it("switches to a custom link added after Minerva attached its own", async () => {
      const google = fakeGoogle();
      const getMeetingLink = createMeetingLinkProvider(google.createMeetingLink, google.attachMeetingLink);
      const event = makeEvent({ minervaMeetingLink: "https://meet.google.com/earlier" });
      event.minervaEventMetadata = { channel: slackChannels[0], meetingLink: "https://example.com/custom" };

      expect(await getMeetingLink(event)).toBe("https://example.com/custom");
    });

    it("gives overlapping reminders for one event the same single link", async () => {
      const google = fakeGoogle();
      const getMeetingLink = createMeetingLinkProvider(google.createMeetingLink, google.attachMeetingLink);

      const [scheduled, manual] = await Promise.all([getMeetingLink(makeEvent()), getMeetingLink(makeEvent())]);

      expect(manual).toBe(scheduled);
      expect(google.created).toHaveLength(1);
    });

    it("creates separate links for different events", async () => {
      const google = fakeGoogle();
      const getMeetingLink = createMeetingLinkProvider(google.createMeetingLink, google.attachMeetingLink);

      const first = await getMeetingLink(makeEvent({ id: "event-1" }));
      const second = await getMeetingLink(makeEvent({ id: "event-2" }));

      expect(second).not.toBe(first);
    });

    it("does not create a meeting for a cancelled event", async () => {
      const google = fakeGoogle();
      const getMeetingLink = createMeetingLinkProvider(google.createMeetingLink, google.attachMeetingLink);

      const link = await getMeetingLink(makeEvent({ is_cancelled: true }));

      expect(link).toBeUndefined();
      expect(google.created).toEqual([]);
    });

    it("gives no link when the link can't be saved on the event, so it can't change on the next reminder", async () => {
      const google = fakeGoogle();
      const getMeetingLink = createMeetingLinkProvider(google.createMeetingLink, async () => {
        throw new Error("calendar write failed");
      });

      expect(await getMeetingLink(makeEvent())).toBeUndefined();
    });

    it("gives no link when creating the meeting fails, and tries again on the next reminder", async () => {
      const google = fakeGoogle();
      let shouldFail = true;
      const getMeetingLink = createMeetingLinkProvider(async () => {
        if (shouldFail) {
          throw new Error("meet unavailable");
        }
        return google.createMeetingLink();
      }, google.attachMeetingLink);
      const event = makeEvent();

      expect(await getMeetingLink(event)).toBeUndefined();
      shouldFail = false;
      expect(await getMeetingLink(event)).toBe("https://meet.google.com/created-1");
    });
  });
});
