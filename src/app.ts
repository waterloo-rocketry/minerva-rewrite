import { App } from '@slack/bolt';

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true, // add this for Socket Mode
  appToken: process.env.SLACK_APP_TOKEN // add this for Socket Mode
});

(async () => {
  // Start your app
  await app.start();

  console.log(`⚡️ Bolt app is running on port!`);
})();

