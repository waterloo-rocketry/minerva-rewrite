import { convert } from "html-to-text";
import yaml from "js-yaml";

import SlackChannel from "../classes/SlackChannel";
import { filterSlackChannelFromName, filterSlackChannelsFromNames } from "../utils/channels";

/**
 * The representation of the YAML metadata in the description of a calendar event
 */
export type EventYaml = {
  /**
   * The channels that event reminders should be posted to. The first channel is the main channel, and the rest are additional channels
   */
  channels: string;
  /**
   * The meeting link for the event, if it exists
   */
  meetingLink?: string;
};

/**
 * The representation metadata of the event that minerva uses. This includes the main channel, additional channels, and meeting link
 */
export type MinervaEventMetadata = {
  /**
   * The main channel that event reminders should be posted to
   */
  mainChannel?: SlackChannel;
  /**
   * The additional channels that event reminders should be posted to
   */
  additionalChannels?: SlackChannel[];
  /**
   * The meeting link for the event, if it exists
   */
  meetingLink?: string;
};

/**
 * Split the description into the description text and the YAML text that contains the metadata
 * These are separated by a line containing only '---'
 * @param description The description of the event to split
 * @returns The description text and the YAML text
 */
export function splitDescriptionAndYamlText(description: string): {
  descriptionText: string;
  yamlText?: string;
} {
  // Description and YAML are separated by a line containing only '---'
  // Since the `---` can be at the start or end of the description, we need optional newlines
  const splitDescription = description.split(/\n?---\n?/);
  if (splitDescription.length == 1) {
    return { descriptionText: splitDescription[0] };
  } else if (splitDescription.length == 2) {
    return {
      descriptionText: splitDescription[0],
      yamlText: splitDescription[1],
    };
  } else {
    throw new Error("Description contains multiple '---' lines");
  }
}

/**
 * Replace <a> tags with their href attribute to allow for cleaner parsing of the description
 * @param html The html to replace the <a> tags in
 * @returns The html with the <a> tags replaced with their href attribute
 */
export function replaceATagsWithHref(html: string): string {
  // Replace <a> tags with their href attribute
  // TODO replace this with a custom html-to-text formatter:
  // https://github.com/html-to-text/node-html-to-text/blob/master/packages/html-to-text/README.md#override-formatting
  const aTagRegex = /<a href="(.*)">(.*)<\/a>/g;
  return html.replace(aTagRegex, "$1");
}

/**
 * Parse the description from HTML to plain text
 * @param description The description to parse
 * @returns The parsed description
 */
export function parseDescriptionFromHtml(description: string): string {
  // Replace <a> tags with their href attribute
  description = replaceATagsWithHref(description);

  // Convert HTML to plain text
  // TODO parse description as markdown potentially - would allow for slack to have more formatting
  const plainDescription = convert(description, {
    wordwrap: false,
  });

  return plainDescription;
}

/**
 * Parse the description of a calendar event
 * @param description The description of the event to parse
 * @param workspaceChannels The Slack channels in the workspace
 * @returns The parsed description and the metadata of the event that minerva uses
 */
export function parseDescription(
  description: string,
  workspaceChannels: SlackChannel[],
): { description: string; minervaEventMetadata?: MinervaEventMetadata } {
  // Parse the description into plain text
  const plainDescription = parseDescriptionFromHtml(description);
  const { descriptionText, yamlText } = splitDescriptionAndYamlText(plainDescription);

  if (yamlText != undefined) {
    const yamlObject = yaml.load(yamlText) as EventYaml;
    if (yamlObject != undefined) {
      // Split the list of channels by `,` or `, ` or ` ,` or ` `
      const channels = yamlObject.channels?.split(/,\s|\s|,/);
      if (channels == undefined || channels.length == 0)
        throw new Error("nothing specified for `channels` in metadata");
      if (channels[0] == "default") throw new Error("main channel cannot be `default`");

      const mainChannelName = channels[0];
      // Channels after the first are additional channels
      const additionalChannelNames = channels.slice(1);

      const mainChannel = filterSlackChannelFromName(mainChannelName, workspaceChannels);

      if (mainChannel == undefined) throw new Error(`channel ${mainChannelName} not found`);

      let additionalChannels = filterSlackChannelsFromNames(additionalChannelNames, workspaceChannels);

      // Remove the main channel from the additional channels if it is duplicated
      additionalChannels = additionalChannels.filter((channel) => channel.name != mainChannel.name);

      const meetingLink = yamlObject.meetingLink;
      const minervaEventMetadata = {
        mainChannel,
        additionalChannels,
        meetingLink,
      };

      return { description: descriptionText, minervaEventMetadata };
    }
  }

  return { description: descriptionText };
}
