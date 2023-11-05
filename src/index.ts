import { App } from '@slack/bolt';

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

(async () => {
  // Start your app
  await app.start();

  console.log(`⚡️ Bolt app is running on port!`);
})();


console.log('There is nothing here yet.');
console.error('This is an error.');
while (true) {}
