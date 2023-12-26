import { App } from "@slack/bolt";
import * as environment from "./utils/env";
import registerListeners from "./listeners";
import scheduleTasks from "./scheduled";

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

// Initialize app
const app = new App({
  token: environment.slackBotToken,
  signingSecret: environment.slackSigningSecret,
  socketMode: true,
  appToken: environment.slackAppToken,
});

// Register listeners
registerListeners(app);

// Schedule tasks
scheduleTasks(app);

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
