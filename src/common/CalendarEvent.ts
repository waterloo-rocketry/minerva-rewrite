import yaml from 'js-yaml';
import { calendar_v3 } from 'googleapis';
import  SlackChannel  from './SlackChannel';


type EventYaml = {
    mainChannel?: string;
    additionalChannels?: string;
    meetingLink?: string;
}

export default class CalendarEvent {
    title: string;
    description?: string;
    meetingLink?: string;
    mainChannel?: SlackChannel;
    additionalChannels?: SlackChannel[];
    location?: string;
    start: Date;
    end: Date;

    // Constructor takes a Google Calendar event object
    constructor(event: calendar_v3.Schema$Event) {
        if (event.summary == undefined) throw new Error("Event summary is undefined")
        this.title = event.summary;
        if (event.start?.dateTime == undefined) throw new Error("Event start is undefined")
        this.start = new Date(event.start.dateTime);
        if (event.end?.dateTime == undefined) throw new Error("Event end is undefined")
        this.end = new Date(event.end.dateTime);

        this.location = event.location ?? undefined;

        // Parse description if it exists
        if (event?.description != undefined) { 
            { this.description, this.additionalChannels, this.mainChannel, this.meetingLink } = this.parseDescription(event.description);
        }
    }

    parseDescription(description: string): { description?: string, additionalChannels?: SlackChannel[], mainChannel?: SlackChannel, meetingLink?: string } {
        const {descriptionText, yamlText} = this.splitDescriptionAndYamlText(description);
        if (yamlText != undefined) {
            const yamlObject = yaml.load(yamlText) as EventYaml;
            if (yamlObject != undefined) {
                

                const mainChannel = yamlObject.mainChannel;
                
                // Additional channels are separated by commas
                const additionalChannels = yamlObject.additionalChannels?.split(',').map(channel => new SlackChannel(channel, channel));
                const meetingLink = yamlObject.meetingLink;
                return { descriptionText, additionalChannels, mainChannel, meetingLink };
            }
        } else {
            return { descriptionText };
        }
    }

    splitDescriptionAndYamlText(description: string): { descriptionText?: string, yamlText?: string } {
        // Description and YAML are separated by a line containing only '---'
        const splitDescription = description.split('\n---\n');
        if (splitDescription.length == 1) {
            return { description: splitDescription[0] };
        } else if (splitDescription.length == 2) {
            return { description: splitDescription[0], yaml: splitDescription[1] };
        } else {
            throw new Error("Description contains multiple '---' lines");
        }
    }
}
