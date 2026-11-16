import { convert } from "html-to-text";

import SlackChannel from "../classes/SlackChannel";
import { EventMetadata } from "../types/EventMetadata";
import { filterSlackChannelFromName } from "../utils/channels";

/**
 * Splits the given description into its components.
 * @param description - The description to split.
 * @param isChannel - Whether a name is a real channel. Extra channel lines only count if their channel is real.
 * @returns An object containing the split components of the description.
 */
export function splitDescription(
  description: string,
  isChannel: (name: string) => boolean = (): boolean => true,
): {
  descriptionText: string;
  channelLine?: string;
  meetingLink?: string;
} {
  // Split the description by line
  const lines = description.split("\n");
  // If there are multiple lines, the first 1-2 lines can contain the metadata
  // Check the first two lines for this metadata, plus any more channel lines right after them
  let descriptionStartLineNumber = 0;
  const channelLines: string[] = [];
  let meetingLink: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    // Skip blank lines between channel lines, e.g. from channels written in separate paragraphs
    if (lines[i].trim() == "" && channelLines.length > 0 && descriptionStartLineNumber == i) {
      descriptionStartLineNumber = i + 1;
      continue;
    }
    // Lines after the first channel line only count as more channels if they start with a real channel,
    // so description text like `#1 priority` right under the metadata stays in the description
    const isExtraChannelLine =
      lines[i].startsWith("#") && channelLines.length > 0 && isChannel(lines[i].replace("#", "").split(/[\s,]+/)[0]);
    if (i >= 2 && !(descriptionStartLineNumber == i && isExtraChannelLine)) {
      break;
    }
    // If one of the first two lines starts with `#`, it is the channel line
    if (lines[i].startsWith("#") && channelLines.length == 0) {
      channelLines.push(lines[i].replace("#", "").trim());
      descriptionStartLineNumber = i + 1;
    } else if (isExtraChannelLine) {
      channelLines.push(lines[i].replace("#", "").trim());
      descriptionStartLineNumber = i + 1;
    } else if (lines[i].startsWith("#")) {
      break;
    }
    // If one of the first two lines is a valid URL it is the meeting link
    else if (lines[i].startsWith("http")) {
      meetingLink = lines[i].trim();
      descriptionStartLineNumber = i + 1;
    }
  }

  // Channels on separate lines are treated the same as channels on one line, e.g. `general #software`
  const channelLine = channelLines.length > 0 ? channelLines.join(" #") : undefined;

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
  const isChannel = (name: string): boolean => workspaceChannels.some((channel) => channel.name == name);
  const { descriptionText, channelLine, meetingLink } = splitDescription(plainDescription, isChannel);

  // Short-circuit if there is no metadata
  if (channelLine == undefined && meetingLink == undefined) {
    return { description: descriptionText };
  }

  // If description contains no line with channel, the meeting url is prepended to the description
  if (channelLine == undefined) {
    return { description: `${meetingLink}\n${descriptionText}` };
  }

  // The first word is the main channel. Any other `#channel` that is a real channel also gets the reminder.
  // Other `#` words are ignored, and anything else is a modifier
  const [channelName, ...words] = channelLine.split(/[\s,]+/).filter((word) => word != "");
  const modifiers = words.filter((word) => !word.startsWith("#"));
  const additionalChannelNames = words
    .filter((word) => word.startsWith("#"))
    .map((word) => word.replace("#", ""))
    .filter((name, i, names) => isChannel(name) && name != channelName && names.indexOf(name) == i);

  const channel = filterSlackChannelFromName(channelName, workspaceChannels);
  if (channel == undefined) throw new Error(`channel "${channelName}" not found`);

  const additionalChannels = additionalChannelNames.map((name) => {
    const additionalChannel = filterSlackChannelFromName(name, workspaceChannels);
    if (additionalChannel == undefined) throw new Error(`channel "${name}" not found`);
    return additionalChannel;
  });

  const minervaEventMetadata = {
    channel,
    additionalChannels,
    meetingLink,
    DMSingleChannelGuests: !modifiers.includes("no-dm"),
  };

  return { description: descriptionText, minervaEventMetadata };
}
