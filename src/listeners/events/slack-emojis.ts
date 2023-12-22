import { App } from '@slack/bolt';
import * as slack_handler from '../../utils/handlers/slack-handler';

interface SlackAPIResponse {
  ok: boolean;
}

function isSlackAPIResponse(object: unknown): object is SlackAPIResponse {
  if (typeof object === 'object' && object !== null) {
    return (
      'ok' in object && typeof (object as SlackAPIResponse).ok === 'boolean'
    );
  }
  return false;
}

export async function generateEmojiPair(app: App): Promise<string[]> {
  const emoji1 = await slack_handler.getRandomEmoji(app);
  let emoji2: string;

  for (let i = 0; i < 5; i++) {
    emoji2 = await slack_handler.getRandomEmoji(app);
    if (emoji2 !== emoji1) {
      return [emoji1, emoji2];
    }
  }

  return ['white_check_mark', 'x'];
}

export async function seedMessageReactions(
  app: App,
  channel: string,
  emojis: string[],
  timestamp: string | number,
): Promise<void> {
  const response = await slack_handler.addReactionToMessage(
    app,
    channel,
    emojis[0],
    timestamp,
  );

  if (isSlackAPIResponse(response) && response.ok) {
    setTimeout(async () => {
      await slack_handler.addReactionToMessage(
        app,
        channel,
        emojis[1],
        timestamp,
      );
    }, 1000);
  }
}
