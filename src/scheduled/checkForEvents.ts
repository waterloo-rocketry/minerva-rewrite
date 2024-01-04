import { App } from "@slack/bolt";
import { OAuth2Client } from "google-auth-library";
import { getEvents, parseEvents } from "../utils/googleCalendar";
import { getAllSlackChannels } from "../utils/channels";
import { remindUpcomingEvents } from "../utils/eventReminders";

const checkForEvents = async (app: App, auth: OAuth2Client): Promise<void> => {
  const slackChannels = await getAllSlackChannels(app);
  const fetchedEvents = await getEvents(auth);
  const events = await parseEvents(fetchedEvents, slackChannels);

  remindUpcomingEvents(events, app);
};

export default checkForEvents;
