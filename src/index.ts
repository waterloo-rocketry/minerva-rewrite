import { App } from "@slack/bolt";
import * as environment from "./utils/env";
import registerListeners from "./listeners";
import { OAuth2Client } from "google-auth-library";
import scheduleTasks from "./scheduled";

import { SlackLogger } from "./classes/SlackLogger";

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
scheduleTasks(app.client, auth);

// Start app
(async (): Promise<void> => {
  try {
    await app.start();
    SlackLogger.getInstance().info(
      `Minerva has started. Deployment commit hash: \`${environment.deploymentCommitHash}\``,
    );
  } catch (error) {
    SlackLogger.getInstance().error(
      `Minerva has failed to start. Deployment commit hash: \`${environment.deploymentCommitHash}\``,
      String(error),
    );
  }
})();
