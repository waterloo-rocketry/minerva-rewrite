import yaml from 'js-yaml';
import { calendar_v3 } from 'googleapis';
import SlackChannel from './SlackChannel';
import {
  filterSlackChannelFromName,
  filterSlackChannelsFromNames,
} from '../utils/channels';

type EventYaml = {
  channels: string;
  meetingLink?: string;
};

type MinervaEventMetadata = {
  mainChannel?: SlackChannel;
  additionalChannels?: SlackChannel[];
  meetingLink?: string;
};

export default class CalendarEvent {
  title: string;
  description?: string;
  minervaEventMetadata?: MinervaEventMetadata;
  location?: string;
  start: Date;
  end: Date;

  // Constructor takes a Google Calendar event object
  constructor(
    event: calendar_v3.Schema$Event,
    workspaceChannels: SlackChannel[],
  ) {
    if (event.summary == undefined)
      throw new Error('Event summary is undefined');
    this.title = event.summary;
    if (event.start?.dateTime == undefined)
      throw new Error('Event start is undefined');
    this.start = new Date(event.start.dateTime);
    if (event.end?.dateTime == undefined)
      throw new Error('Event end is undefined');
    this.end = new Date(event.end.dateTime);

    this.location = event.location ?? undefined;

    if (event?.description != undefined) {
      const { description, minervaEventMetadata } = this.parseDescription(
        event.description,
        workspaceChannels,
      );

      this.description = description;
      this.minervaEventMetadata = minervaEventMetadata;
    }
  }

  parseDescription(
    description: string,
    workspaceChannels: SlackChannel[],
  ): { description?: string; minervaEventMetadata?: MinervaEventMetadata } {
    const { descriptionText, yamlText } =
      this.splitDescriptionAndYamlText(description);
    if (yamlText != undefined) {
      const yamlObject = yaml.load(yamlText) as EventYaml;
      if (yamlObject != undefined) {
        const channels = yamlObject.channels?.split(' ');
        if (channels == undefined || channels.length == 0)
          throw new Error('nothing specified for `channels` in metadata');
        if (channels[0] == 'default')
          throw new Error('main channel cannot be `default`');

        const mainChannelName = channels[0];
        const additionalChannelNames = channels.slice(1);

        const mainChannel = filterSlackChannelFromName(
          mainChannelName,
          workspaceChannels,
        );

        const additionalChannels = filterSlackChannelsFromNames(
          additionalChannelNames,
          workspaceChannels,
        );

        const meetingLink = yamlObject.meetingLink;
        // Validate meeting link
        if (meetingLink != undefined) {
          const urlRegex =
            /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
          if (!urlRegex.test(meetingLink))
            console.error(
              `meetingLink ${meetingLink} is not a valid URL. Please check that it is a valid URL.`,
            );
        }

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

  splitDescriptionAndYamlText(description: string): {
    descriptionText?: string;
    yamlText?: string;
  } {
    // Description and YAML are separated by a line containing only '---'
    const splitDescription = description.split('\n---\n');
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
}
