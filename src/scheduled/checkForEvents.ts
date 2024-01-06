import { WebClient } from "@slack/web-api";
import { OAuth2Client } from "google-auth-library";
import { getEvents, parseEvents } from "../utils/googleCalendar";
import { getAllSlackChannels } from "../utils/channels";
import { remindUpcomingEvents } from "../utils/eventReminders";

const checkForEvents = async (client: WebClient, auth: OAuth2Client): Promise<void> => {
  const slackChannels = await getAllSlackChannels(client);
  const fetchedEvents = await getEvents(auth);
  const events = await parseEvents(fetchedEvents, slackChannels);

  remindUpcomingEvents(events, client);
};

export default checkForEvents;
