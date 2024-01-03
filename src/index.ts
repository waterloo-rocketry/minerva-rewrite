import { App } from "@slack/bolt";
import * as environment from "./utils/env";
import registerListeners from "./listeners";
import { OAuth2Client } from "google-auth-library";
import scheduleTasks from "./scheduled";

// Set up Google OAuth2 client
const auth = new OAuth2Client({
  clientId: environment.googleAccountClient,
  clientSecret: environment.googleAccountSecret,
  redirectUri: environment.googleAccountOauthRedirect,
});

// Set up OAuth2 credentials
auth.setCredentials({
  refresh_token: environment.googleAccountToken,
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
scheduleTasks(app, auth);

// Start app
(async (): Promise<void> => {
  try {
    await app.start();
    console.log("⚡️ Bolt app is running!");
  } catch (error) {
    console.error("Failed to start the Bolt app", error);
    throw error;
  }
})();
