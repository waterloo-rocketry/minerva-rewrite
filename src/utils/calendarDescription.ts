import { convert } from "html-to-text";

import SlackChannel from "../classes/SlackChannel";
import { EventMetadata } from "../types/EventMetadata";
import { filterSlackChannelFromName } from "../utils/channels";

/**
 * Splits the given description into its components.
 * @param description - The description to split.
 * @returns An object containing the split components of the description.
 */
export function splitDescription(description: string): {
  descriptionText: string;
  channelLine?: string;
  meetingLink?: string;
} {
  // Split the description by line
  const lines = description.split("\n");
  // If there are multiple lines, the first 1-2 lines can contain the metadata
  // Check the first two lines for this metadata
  let descriptionStartLineNumber = 0;
  let channelLine: string | undefined;
  let meetingLink: string | undefined;

  for (let i = 0; i < Math.min(lines.length, 2); i++) {
    // If one of the first two lines starts with `#`, it is the channel
    if (lines[i].startsWith("#")) {
      channelLine = lines[i].replace("#", "").trim();
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
    channelLine,
    meetingLink,
  };
}

/**
 * Parse the description from HTML to plain text
 * @param description The description to parse
 * @returns The parsed description
 */
export function parseDescriptionFromHtml(description: string): string {
  // Convert HTML to plain text
  // TODO parse description as markdown potentially - would allow for slack to have more formatting
  const plainDescription = convert(description, {
    wordwrap: false,
    preserveNewlines: true,
    selectors: [{ selector: "a", options: { ignoreHref: true } }],
  });

  return plainDescription;
}

/**
 * Parse the description of a calendar event
 * @param description The description of the event to parse
 * @param workspaceChannels The Slack channels in the workspace
 * @returns The parsed description and the metadata of the event that minerva uses
 * @throws Error if the channel name is not specified or if the channel is not found
 */
export function parseDescription(
  description: string,
  workspaceChannels: SlackChannel[],
): { description: string; minervaEventMetadata?: EventMetadata } {
  const plainDescription = parseDescriptionFromHtml(description);
  const { descriptionText, channelLine, meetingLink } = splitDescription(plainDescription);

  // Short-circuit if there is no metadata
  if (channelLine == undefined && meetingLink == undefined) {
    return { description: descriptionText };
  }

  // If description contains no line with channel, the meeting url is prepended to the description
  if (channelLine == undefined) {
    return { description: `${meetingLink}\n${descriptionText}` };
  }

  const [channelName, ...modifiers] = channelLine.split(" ");

  const channel = filterSlackChannelFromName(channelName, workspaceChannels);
  if (channel == undefined) throw new Error(`channel "${channelName}" not found`);

  const minervaEventMetadata = {
    channel,
    meetingLink,
    DMSingleChannelGuests: !modifiers.includes("no-dm"),
  };

  return { description: descriptionText, minervaEventMetadata };
}
