import { App } from '@slack/bolt';
import { config } from 'dotenv';

config();

const app = new App({
  token: process.env.SLACK_OAUTH_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  // You may remove the 'port' option if you're using only socketMode and no HTTP
});

app.message('Hello', async ({ message, say }) => {
  // Check if 'message' is properly typed, as 'user' might not be a direct property.
  // If 'message' is of type 'MessageEvent', it should have a 'user' property.
  if ('user' in message) {
    await say({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Hey there <@${message.user}>!`,
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Click Me',
            },
            action_id: 'button_click',
          },
        },
      ],
      text: `Hey there <@${message.user}>!`,
    });
  } else {
    console.error('The message event did not have a user property.');
  }
});

app.action('button_click', async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack();
  await say(`<@${body.user.id}> clicked the button`);
});

(async () => {
  try {
    // Start your app
    await app.start();
    console.log(`⚡️ Bolt app is running!`);
  } catch (error) {
    console.error('Failed to start the Bolt app', error);
  }
})();
