import CalendarEvent from "../classes/CalendarEvent";
import { SlackLogger } from "../classes/SlackLogger";

/**
 * Finds the meeting link to send for an event.
 */
export type MeetingLinkProvider = (event: CalendarEvent) => Promise<string | undefined>;

/**
 * Finds a meeting link already on the event. A link a person added always wins over the one Minerva attached, so
 * adding a custom link later takes over from Minerva's.
 * @param event The event to look at
 * @returns The link in the description, else the one in the conference field, else the one Minerva attached
 */
export function findExistingMeetingLink(event: CalendarEvent): string | undefined {
  return event.minervaEventMetadata?.meetingLink ?? event.conferenceLink ?? event.minervaMeetingLink;
}

/**
 * Creates a provider that uses a link already on the event and otherwise creates a Meet link and attaches it to the
 * event, so every later reminder for that event sends the same link.
 * @param createMeetingLink Creates a new meeting link
 * @param attachMeetingLink Saves a meeting link on the event
 * @returns The provider. It gives no link when a new one couldn't be created and saved, since a link that wasn't saved
 * would change on the next reminder.
 */
export function createMeetingLinkProvider(
  createMeetingLink: () => Promise<string>,
  attachMeetingLink: (event: CalendarEvent, meetingLink: string) => Promise<void>,
): MeetingLinkProvider {
  // Reminders for one event can overlap, such as the scheduled check and a manual reminder, and must share one link
  const linksBeingCreated = new Map<string, Promise<string | undefined>>();

  /**
   * Creates a meeting link and saves it on the event
   * @param event The event to create the link for
   * @returns The saved link, or undefined if it couldn't be created and saved
   */
  async function createAndAttach(event: CalendarEvent): Promise<string | undefined> {
    try {
      const meetingLink = await createMeetingLink();
      await attachMeetingLink(event, meetingLink);
      event.minervaMeetingLink = meetingLink;
      return meetingLink;
    } catch (error) {
      SlackLogger.getInstance().error(`Failed to create a meeting link for event \`${event.title}\`:`, error);
      return undefined;
    }
  }

  return async (event) => {
    const existingLink = findExistingMeetingLink(event);
    // A cancelled event doesn't need a new meeting
    if (existingLink != undefined || event.is_cancelled) {
      return existingLink;
    }

    const eventKey = event.id ?? event.url;
    let linkBeingCreated = linksBeingCreated.get(eventKey);
    if (linkBeingCreated == undefined) {
      linkBeingCreated = createAndAttach(event).finally(() => linksBeingCreated.delete(eventKey));
      linksBeingCreated.set(eventKey, linkBeingCreated);
    }
    return linkBeingCreated;
  };
}
