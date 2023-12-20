import { App } from "@slack/bolt";
import * as environment from "./utils/env";
import registerListeners from "./listeners";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
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

  const getNextEvents = await calendar.events.list({
    auth: auth,
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
  });
  console.log(getNextEvents.data);

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
