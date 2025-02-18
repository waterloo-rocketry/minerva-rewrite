import { WebClient, ChatPostMessageResponse } from "@slack/web-api";
import moment from "moment-timezone";

import CalendarEvent from "../classes/CalendarEvent";
import { postMessage, getMessagePermalink, getAllSlackUsers } from "./slack";
import { getDefaultSlackChannels } from "./channels";
import { generateEmojiPair, seedMessageReactions } from "./slackEmojis";
import SlackChannel from "../classes/SlackChannel";
import SlackUser from "../classes/SlackUser";
import { postMessageToSingleChannelGuestsInChannels } from "./users";
import { SlackLogger } from "../classes/SlackLogger";

/**
 * The interval in milliseconds at which the scheduled event checking task runs
 */
export const TIME_CHECK_INTERVAL = 1000 * 60 * 5; // 5 minutes in milliseconds

/**
 * The types of event reminders that can be sent
 */
export enum EventReminderType {
  MANUAL = 1,
  MANUAL_PING = 2,
  FIVE_MINUTES = 1000 * 60 * 5, // 5 minutes in milliseconds
  SIX_HOURS = 1000 * 60 * 60 * 6, // 6 hours in milliseconds
}

/**
 * Checks if the given time is within the bounds of the target time, with the bounds being +/- the TIME_CHECK_INTERVAL with an open lower bound and a closed upper bound
 * @param timeMs The time to check in milliseconds
 * @param targetTimeMs The target time to check against in milliseconds
 * @returns Whether the time is within the bounds of the target time
 */
export function isTimeWithinBounds(timeMs: number, targetTimeMs: number): boolean {
  // Making the bounds of checking the time the middle of the intervals to prevent overlap
  const lowerBound = targetTimeMs - TIME_CHECK_INTERVAL / 2;
  const upperBound = targetTimeMs + TIME_CHECK_INTERVAL / 2;
  // If the event is at -/+ 2.5mins from the target time, it will be valid only if it is at the upper bound
  return timeMs > lowerBound && timeMs <= upperBound;
}

/**
 * Gets the type of reminder that should be sent for the given event based on the current time
 * @param event The event to get the reminder type for
 * @returns The type of reminder to send, or null if no reminder should be sent
 */
export function getEventReminderType(event: CalendarEvent): EventReminderType | null {
  const nowMs = new Date().getTime();
  const eventStartMs = event.start.getTime();

  if (isTimeWithinBounds(nowMs, eventStartMs - EventReminderType.SIX_HOURS)) {
    return EventReminderType.SIX_HOURS;
  } else if (isTimeWithinBounds(nowMs, eventStartMs - EventReminderType.FIVE_MINUTES)) {
    return EventReminderType.FIVE_MINUTES;
  } else {
    return null;
  }
}

/**
 * Posts a reminder for the given event to the channel it is associated with
 * @param event The event to post a reminder for
 * @param client Slack Web API client
 * @param reminderType The type of reminder to post
 * @param defaultSlackChannels The default Slack channels to post reminders to. If not provided, the default channels will be fetched from the Slack API
 * @param allSlackUsersInWorkspace All Slack users in the workspace. If not provided, the users will be fetched from the Slack API
 */
export async function remindUpcomingEvent(
  event: CalendarEvent,
  client: WebClient,
  reminderType: EventReminderType | null,
  defaultSlackChannels?: SlackChannel[],
  allSlackUsersInWorkspace?: SlackUser[],
): Promise<void> {
  // If the event does not have event metadata, then minerva ignores it
  if (!event.minervaEventMetadata) {
    return;
  }

  if (reminderType == null) {
    return;
  }

  let reminderText = generateEventReminderChannelText(event, reminderType);
  let reactEmojis: string[] = [];

  if (reminderType === EventReminderType.SIX_HOURS) {
    reactEmojis = await generateEmojiPair(client);

    reminderText += `\nReact with :${reactEmojis[0]}: if you're coming, or :${reactEmojis[1]}: if you're not!`;
  }

  const channel = event.minervaEventMetadata.channel;
  const messageUrl = await postReminderToChannel(client, channel, reminderText, reactEmojis);

  if (messageUrl == undefined) {
    return;
  }

  // If event is not set up to DM single channel guests, singleChannelGuestsMessaged will be -1 to indicate that it was not messaged
  let singleChannelGuestsMessaged = -1;
  if (event.minervaEventMetadata.DMSingleChannelGuests) {
    const DmReminderText = generateEventReminderDMText(messageUrl);
    singleChannelGuestsMessaged = await postReminderToDMs(
      client,
      channel,
      DmReminderText,
      defaultSlackChannels,
      allSlackUsersInWorkspace,
    );
  }

  const reminderTypeStrings = {
    [EventReminderType.MANUAL]: "manually triggered",
    [EventReminderType.MANUAL_PING]: "manually triggered (with ping)",
    [EventReminderType.FIVE_MINUTES]: "5 minute",
    [EventReminderType.SIX_HOURS]: "6 hour",
  };

  SlackLogger.getInstance().info(
    `Sent ${reminderTypeStrings[reminderType]} reminder for event \`${
      event.title
    }\` at \`${event.start.toISOString()}\` to channel \`${event.minervaEventMetadata.channel.name}\` ${
      singleChannelGuestsMessaged != -1 ? `and ${singleChannelGuestsMessaged} single channel guests` : ""
    }`,
  );
}

/**
 * Posts an event reminder to the given channel
 * @param client Slack Web API client
 * @param channel The channel to post the reminder to
 * @param reminderText The text of the reminder
 * @param reactEmojis The emojis to react to the reminder with
 * @returns The URL of the posted reminder message
 */
export async function postReminderToChannel(
  client: WebClient,
  channel: SlackChannel,
  reminderText: string,
  reactEmojis?: string[],
): Promise<string | undefined> {
  let res: ChatPostMessageResponse | undefined = undefined;
  try {
    res = await postMessage(client, channel, reminderText, {
      unfurl_links: false,
      unfurl_media: false,
    });
  } catch (error) {
    SlackLogger.getInstance().error(
      `Failed to post reminder message to channel \`${channel.name}\` with error:`,
      error,
    );
    return;
  }

  if (res == undefined || res.ts == undefined) {
    return;
  }

  const timestamp = res.ts;

  if (reactEmojis != undefined && reactEmojis.length > 0) {
    try {
      await seedMessageReactions(client, channel.id, reactEmojis, timestamp);
    } catch (error) {
      SlackLogger.getInstance().error(
        `Failed to add reactions \`${reactEmojis}\` to message \`${timestamp}\` in \`${channel.name}\` with error:`,
        error,
      );
    }
  }
  const messageUrl = getMessagePermalink(client, channel.id, res.ts);
  return messageUrl;
}

/**
 * Posts a reminder for the given event to the DMs of all single channel guests in the given channels
 * @param client Slack Web API client
 * @param eventChannel The channel the event is associated with
 * @param reminderText The text of the reminder
 * @param defaultSlackChannels The default Slack channels to post reminders to. If not provided, the default channels will be fetched from the Slack API
 * @param allSlackUsersInWorkspace All Slack users in the workspace. If not provided, the users will be fetched from the Slack API
 * @returns The number of single channel guests messaged
 */
export async function postReminderToDMs(
  client: WebClient,
  eventChannel: SlackChannel,
  reminderText: string,
  defaultSlackChannels?: SlackChannel[],
  allSlackUsersInWorkspace?: SlackUser[],
): Promise<number> {
  if (defaultSlackChannels == undefined) {
    defaultSlackChannels = await getDefaultSlackChannels(client);
  }

  const slackChannels = defaultSlackChannels.filter((channel) => channel != eventChannel);
  const singleChannelGuestsMessaged = await postMessageToSingleChannelGuestsInChannels(
    client,
    slackChannels,
    reminderText,
    allSlackUsersInWorkspace,
  );

  return singleChannelGuestsMessaged;
}

/**
 * Posts reminders for the given events to the channels they are associated with
 * @param client Slack Web API client
 * @param events The events to post reminders for
 */
export async function remindUpcomingEvents(client: WebClient, events: CalendarEvent[]): Promise<void> {
  const defaultSlackChannels = await getDefaultSlackChannels(client);
  const allSlackUsersInWorkspace = await getAllSlackUsers(client);

  events
    .filter((event) => event.minervaEventMetadata != undefined)
    .forEach((event) => {
      const reminderType = getEventReminderType(event);
      remindUpcomingEvent(event, client, reminderType, defaultSlackChannels, allSlackUsersInWorkspace);
    });
}

/**
 * Generates the text body for the event reminder message
 * @param event The event to generate the reminder text for
 * @param reminderType The type of reminder to generate the text for
 * @returns The generated reminder text
 */
export function generateEventReminderChannelText(event: CalendarEvent, reminderType: EventReminderType): string {
  let message = `${
    !event.is_cancelled &&
    (reminderType == EventReminderType.FIVE_MINUTES || reminderType == EventReminderType.MANUAL_PING)
      ? "<!channel>\n"
      : ""
  }Reminder: *${event.title}*`;

  let timeUntilEventMessage: string;

  if (reminderType === EventReminderType.FIVE_MINUTES) {
    const timeUntilEvent = event.start.getTime() - new Date().getTime();
    timeUntilEventMessage = `in *${Math.ceil(timeUntilEvent / 1000 / 60)} minutes*`;
  } else {
    timeUntilEventMessage = `at *${moment(event.start).tz("America/Toronto").format("MMMM Do, YYYY [at] h:mm A")}*`;
  }

  if (event.is_cancelled) {
    message += ` that was supposed to occur ${timeUntilEventMessage} *has been cancelled*`;
  } else {
    message += ` is occurring ${timeUntilEventMessage}`;
  }

  if (event.url) {
    message += `\n<${event.url}|Event Details>`;
  }

  message += `\nWays to attend:`;
  if (event.location) {
    message += `\n\t:office: In person @ ${event.location}`;
  }

  message += `\n\t:globe_with_meridians: Online @ ${
    event.minervaEventMetadata?.meetingLink ?? "https://meet.waterloorocketry.com/bay_area"
  }`;

  return message;
}

/**
 * Generates the text body for the event reminder DM
 * @param eventChannelMessageUrl The URL of the event reminder message
 * @returns The text body for the event reminder DM
 */
export function generateEventReminderDMText(eventChannelMessageUrl: string): string {
  return `${eventChannelMessageUrl}\n_You have been sent this message because you are a single channel guest who might have otherwise missed this alert._`;
}
