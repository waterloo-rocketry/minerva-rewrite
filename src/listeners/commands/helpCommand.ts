import { slackBotToken } from '../../utils/env';
import { App } from '@slack/bolt';

const READMEURL =
  'https://github.com/waterloo-rocketry/minerva-rewrite/blob/main/README.md';
const message = `For more information, check out this ${READMEURL}!`;

//create a help command handler
const register = (app: App) => {
  app.command('/help', async ({ command, ack, client }) => {
    await ack();

    await client.chat.postEphemeral({
      token: slackBotToken,
      channel: command.channel_id,
      user: command.user_id,
      text: message,
    });
  });
};

export default { register };
