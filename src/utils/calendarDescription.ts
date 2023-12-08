import { convert } from "html-to-text";

import yaml from "js-yaml";
import SlackChannel from "../classes/SlackChannel";

import { filterSlackChannelFromName, filterSlackChannelsFromNames } from "../utils/channels";

export type EventYaml = {
  channels: string;
  meetingLink?: string;
};

export type MinervaEventMetadata = {
  mainChannel?: SlackChannel;
  additionalChannels?: SlackChannel[];
  meetingLink?: string;
};

export function splitDescriptionAndYamlText(description: string): {
  descriptionText: string;
  yamlText?: string;
} {
  // Description and YAML are separated by a line containing only '---'
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

export function replaceATagsWithHref(html: string): string {
  // Replace <a> tags with their href attribute
  // TODO replace this with a custom html-to-text formatter:
  // https://github.com/html-to-text/node-html-to-text/blob/master/packages/html-to-text/README.md#override-formatting
  const aTagRegex = /<a href="(.*)">(.*)<\/a>/g;
  return html.replace(aTagRegex, "$1");
}

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

export function parseDescription(
  description: string,
  workspaceChannels: SlackChannel[],
): { description: string; minervaEventMetadata?: MinervaEventMetadata } {
  const plainDescription = parseDescriptionFromHtml(description);
  const { descriptionText, yamlText } = splitDescriptionAndYamlText(plainDescription);
  if (yamlText != undefined) {
    const yamlObject = yaml.load(yamlText) as EventYaml;
    if (yamlObject != undefined) {
      const channels = yamlObject.channels?.split(/,\s|\s|,/);
      if (channels == undefined || channels.length == 0)
        throw new Error("nothing specified for `channels` in metadata");
      if (channels[0] == "default") throw new Error("main channel cannot be `default`");

      const mainChannelName = channels[0];
      const additionalChannelNames = channels.slice(1);

      const mainChannel = filterSlackChannelFromName(mainChannelName, workspaceChannels);

      if (mainChannel == undefined) throw new Error(`channel ${mainChannelName} not found`);

      let additionalChannels = filterSlackChannelsFromNames(additionalChannelNames, workspaceChannels);

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
