import { App } from "@slack/bolt";
import * as environment from "./utils/env";
import registerListeners from "./listeners";
import { createGoogleAuth } from "./utils/googleAuth";
import scheduleTasks from "./scheduled";

import { SlackLogger } from "./classes/SlackLogger";

// Set up Google credentials: the service account if configured, otherwise the OAuth refresh token
const auth = createGoogleAuth({
  serviceAccountKey: environment.minervaGoogleServiceAccount,
  impersonatedUser: environment.minervaGoogleImpersonatedUser,
  oauth: {
    clientId: environment.googleAccountClient,
    clientSecret: environment.googleAccountSecret,
    redirectUri: environment.googleAccountOauthRedirect,
    refreshToken: environment.googleAccountToken,
  },
});

// Initialize app
const app = new App({
  token: environment.slackBotToken,
  signingSecret: environment.slackSigningSecret,
  socketMode: true,
  appToken: environment.slackAppToken,
});

// Register listeners
registerListeners(app, auth);

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
      error,
    );
  }
})();
