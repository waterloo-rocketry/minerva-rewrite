import { App } from '@slack/bolt';

import { config } from 'dotenv';

config();

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_OAUTH_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

(async () => {
  // Start your app
  const port = process.env.PORT || 3000; // Use a port from the environment or default to 3000
  await app.start(port);

  console.log(`⚡️ Bolt app is running on port!`);
})();

console.log('There is nothing here yet.');
console.error('This is an error.');
while (true) {}
