import { AllMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";
import { generateEmojiPair, seedMessageReactions } from "../../utils/slackEmojis";

const niceToMeetYouCallback = async ({
  message,
  client,
  say,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<"message">): Promise<void> => {
  try {
    const emojis = await generateEmojiPair(client);

    await seedMessageReactions(client, message.channel, emojis, message.ts);

    await say(`Emoji reaction added to the message.`);
  } catch (error) {
    console.error("Error in niceToMeetYouCallback:", error);
  }
};

export default niceToMeetYouCallback;
