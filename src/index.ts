import { App } from '@slack/bolt';
import * as environment from './utils/env';
import registerListeners from './listeners';

// Initialize app
const app = new App({
  token: environment.slackBotToken,
  signingSecret: environment.slackSigningSecret,
  socketMode: true,
  appToken: environment.slackAppToken,
});

// Register listeners
registerListeners(app);

// Start app
(async () => {
  try {
    await app.start();
    console.log(`⚡️ Bolt app is running!`);
  } catch (error) {
    console.error('Failed to start the Bolt app', error);
    throw error;
  }
})();
