import * as slack_handler from '../../utils/handlers/slack-handler';

export async function generateEmojiPair(): Promise<string[]> {
  const emoji1 = await slack_handler.getRandomEmoji();
  let emoji2: string;

  // Make sure that the two reactions are not the same
  for (let i = 0; i < 5; i++) {
    emoji2 = await slack_handler.getRandomEmoji();
    if (emoji2 !== emoji1) {
      return [emoji1, emoji2];
    }
  }

  return ['white_check_mark', 'x'];
}

export async function seedMessageReactions(
  channel: string,
  emojis: string[],
  timestamp: string | number,
): Promise<void> {
  const response = await slack_handler.addReactionToMessage(
    channel,
    emojis[0],
    timestamp,
  );
  if (response.ok) {
    setTimeout(async () => {
      await slack_handler.addReactionToMessage(channel, emojis[1], timestamp);
    }, 1000);
  }
}
