import SlackChannel from "../classes/SlackChannel";

/**
 * The representation metadata of the event that minerva uses. This includes the main channel, additional channels, and meeting link
 */
export type EventMetadata = {
  /**
   * The channels that event reminders should be posted to
   */
  channels: SlackChannel[];
  /**
   * The meeting link for the event, if it exists
   */
  meetingLink?: string;
};
