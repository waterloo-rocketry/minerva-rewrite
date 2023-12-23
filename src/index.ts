import { App } from "@slack/bolt";
import * as environment from "./utils/env";
import registerListeners from "./listeners";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import CalendarEvent from "./classes/CalendarEvent";
import { getAllSlackChannels, filterSlackChannelsFromNames } from "./utils/channels";
const calendar = google.calendar("v3");

// Initialize app
const app = new App({
  token: environment.slackBotToken,
  signingSecret: environment.slackSigningSecret,
  socketMode: true,
  appToken: environment.slackAppToken,
});

// Register listeners
registerListeners(app);

// Setup Google OAuth
async function main() {
  // Set up OAuth2 client
  const auth = new OAuth2Client({
    clientId: process.env.GOOGLE_ACCOUNT_CLIENT,
    clientSecret: process.env.GOOGLE_ACCOUNT_SECRET,
    redirectUri: "https://developers.google.com/oauthplayground",
  });

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_ACCOUNT_TOKEN,
  });

  // Calculate the current time and the time 24 hours from now
  const currentTime = new Date();
  const next24Hours = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000); // Adding 24 hours in milliseconds

  // Get info of all events from all channels in the next 24 hours
  const getNextEvents = await calendar.events.list({
    auth: auth,
    calendarId: "primary",
    timeMin: currentTime.toISOString(),
    timeMax: next24Hours.toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
  });

  // Events data
  const nextEvents = getNextEvents.data;

  // Function to fetch all channels
  const channels = await getAllSlackChannels(app);

  // Parsing all events from all channels in the next 24 hours into a list of CalendarEvents
  const parseEvents = function () {
    const events: CalendarEvent[] = [];
    if (nextEvents.items) {
      nextEvents.items.forEach((event) => {
        const calendarEvent = new CalendarEvent(event, channels);
        events.push(calendarEvent);
      });
    } else {
      return "No events found.";
    }
    return events;
  };

  // Parsing all events from specific channels in the next 24 hours into a list of CalendarEvents
  const parseEventsOfChannels = function (channelNames: string[]) {
    const filteredChannels = filterSlackChannelsFromNames(channelNames, channels);
    const events: CalendarEvent[] = [];
    if (nextEvents.items) {
      nextEvents.items.forEach((event) => {
        const calendarEvent = new CalendarEvent(event, filteredChannels);
        events.push(calendarEvent);
      });
    } else {
      return "No events found.";
    }
    return events;
  };

  while (true) {}
}

// Start app
(async () => {
  try {
    await app.start();
    console.log(`⚡️ Bolt app is running!`);
  } catch (error) {
    console.error("Failed to start the Bolt app", error);
    throw error;
  }
})();

main();
