import { convert } from "html-to-text";

import SlackChannel from "../classes/SlackChannel";
import { EventMetadata } from "../types/EventMetadata";
import { filterSlackChannelFromName } from "../utils/channels";

/**
 * Splits the given description into its components.
 * @param description - The description to split.
 * @param isChannel - Whether a name is a real channel. Channel lines after the first only count if their channel is real.
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
  // The metadata is the block of lines at the top of the description: the channel line(s) and the meeting link, in
  // any order. The first line that isn't metadata starts the description text, so `#` lines further down stay in it
  let descriptionStartLineNumber = 0;
  const channelLines: string[] = [];
  let meetingLink: string | undefined;

  for (const line of lines.map((line) => line.trim())) {
    // The first `#` line is the channel line. Later `#` lines only count as more channels if they start with a real
    // channel, so description text like `#1 priority` right under the metadata stays in the description
    const isChannelLine =
      line.startsWith("#") && (channelLines.length == 0 || isChannel(line.replace("#", "").split(/[\s,]+/)[0]));

    if (isChannelLine) {
      channelLines.push(line.replace("#", "").trim());
    } else if (line.startsWith("http") && meetingLink == undefined) {
      meetingLink = line;
    } else if (line != "") {
      break;
    }
    descriptionStartLineNumber++;
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
