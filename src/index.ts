import { App } from "@slack/bolt";
import * as environment from "./utils/env";
import registerListeners from "./listeners";
import { OAuth2Client } from "google-auth-library";
import { getEvents, parseEvents } from "./utils/googleCalendar";
import { getAllSlackChannels } from "./utils/channels";

// Set up Google OAuth2 client
const auth = new OAuth2Client({
  clientId: process.env.GOOGLE_ACCOUNT_CLIENT,
  clientSecret: process.env.GOOGLE_ACCOUNT_SECRET,
  redirectUri: process.env.GOOGLE_ACCOUNT_OAUTH_REDIRECT,
});

// Set up OAuth2 credentials
auth.setCredentials({
  refresh_token: process.env.GOOGLE_ACCOUNT_TOKEN,
});

// Set up Slack app
const app = new App({
  token: environment.slackBotToken,
  signingSecret: environment.slackSigningSecret,
  socketMode: true,
  appToken: environment.slackAppToken,
});

// Setup Google OAuth
async function main() {
  // Register listeners
  registerListeners(app);

  // Call the initialize function from googleCalendar.ts
  const nextEvents = await getEvents();

  // Fetch all channels
  const channels = await getAllSlackChannels(app);

  // Parse events
  const eventsToParse = await parseEvents(nextEvents, channels);

  console.log(eventsToParse);

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
