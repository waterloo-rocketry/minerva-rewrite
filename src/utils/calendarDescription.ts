import { convert } from "html-to-text";

import SlackChannel from "../classes/SlackChannel";
import { EventMetadata } from "../types/EventMetadata";
import { filterSlackChannelFromName, filterDefaultSlackChannels } from "../utils/channels";

/**
 * Splits the given description into its components.
 *
 * @param description - The description to split.
 * @returns An object containing the split components of the description.
 */
export function splitDescription(description: string): {
  descriptionText: string;
  channelName?: string;
  meetingLink?: string;
} {
  // Split the description by line
  const lines = description.split("\n");
  // If there are multiple lines, the first 1-2 lines can contain the metadata
  // Check the first two lines for this metadata
  let descriptionStartLineNumber = 0;
  let channelName: string | undefined;
  let meetingLink: string | undefined;

  for (let i = 0; i < Math.min(lines.length, 2); i++) {
    // If one of the first two lines starts with `#`, it is the channel
    if (lines[i].startsWith("#")) {
      channelName = lines[i].replace("#", "").trim();
      descriptionStartLineNumber = i + 1;
    }
    // If one of the first two lines is a valid URL it is the meeting link
    else if (lines[i].startsWith("http")) {
      meetingLink = lines[i].trim();
      descriptionStartLineNumber = i + 1;
    }
  }

  // Remove the meeting link and channel lines from the description and then join the lines back together
  const descriptionText = lines.slice(descriptionStartLineNumber).join("\n").trim();

  return {
    descriptionText,
    channelName,
    meetingLink,
  };
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
): { description: string; minervaEventMetadata?: EventMetadata } {
  const plainDescription = parseDescriptionFromHtml(description);
  const { descriptionText, channelName, meetingLink } = splitDescription(plainDescription);

  // Short-circuit if there is no metadata
  if (channelName == undefined && meetingLink == undefined) {
    return { description: descriptionText };
  }

  if (channelName == undefined) {
    throw new Error("channel name not specified");
  }

  let channels;

  if (channelName == "default") {
    channels = filterDefaultSlackChannels(workspaceChannels);
  } else {
    const channel = filterSlackChannelFromName(channelName, workspaceChannels);
    if (channel == undefined) throw new Error(`channel ${channelName} not found`);
    channels = [channel];
  }

  const minervaEventMetadata = {
    channels,
    meetingLink,
  };

  return { description: descriptionText, minervaEventMetadata };
}
