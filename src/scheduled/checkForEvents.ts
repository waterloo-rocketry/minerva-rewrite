import { WebClient } from "@slack/web-api";
import { OAuth2Client } from "google-auth-library";
import { getEvents, parseEvents } from "../utils/googleCalendar";
import { getAllSlackChannels } from "../utils/channels";
import { remindUpcomingEvents } from "../utils/eventReminders";
import { MeetingLinkProvider } from "../utils/meetingLinks";

const checkForEvents = async (
  client: WebClient,
  auth: OAuth2Client,
  getMeetingLink: MeetingLinkProvider,
): Promise<void> => {
  const slackChannels = await getAllSlackChannels(client);
  const fetchedEvents = await getEvents(auth);
  const events = await parseEvents(fetchedEvents, slackChannels);

  remindUpcomingEvents(client, events, getMeetingLink);
};

export default checkForEvents;
