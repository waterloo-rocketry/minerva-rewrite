import { App } from "@slack/bolt";
import * as environment from "./utils/env";
import registerListeners from "./listeners";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import CalendarEvent from "./classes/CalendarEvent";
import { getAllSlackChannels } from "./utils/channels";
const calendar = google.calendar("v3");
import { config } from "dotenv";

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

  // Get info of next 10 events
  const getNextEvents = await calendar.events.list({
    auth: auth,
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
  });

  // Events data
  const nextEvents = getNextEvents.data;

  // Test if event start and end date is defined
  if (nextEvents.items) {
    nextEvents.items.forEach((event) => {
      console.log("Event Start:", JSON.stringify(event.start));
      console.log("Event End:", JSON.stringify(event.end));
    });
  } else {
    console.log("No events found.");
  }

  // // Call getAllSlackChannels function
  // const channelsPromise = getAllSlackChannels(app);

  // // Wait for the channels to be fetched
  // try {
  //   const channels = await channelsPromise;
  //   const calendarEvent1 = new CalendarEvent(nextEvents, channels);
  //   console.log(calendarEvent1);
  // } catch (error) {
  //   console.error("Error fetching Slack channels:", error);
  // }

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
