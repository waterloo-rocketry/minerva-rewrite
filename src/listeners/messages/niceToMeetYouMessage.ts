import { AllMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { generateEmojiPair, seedMessageReactions } from "../../utils/slackEmojis";

const niceToMeetYouCallback = async ({
  message,
  client,
  say,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<"message"> & { client: WebClient }): Promise<void> => {
  try {
    // Check if the message text is exactly "Nice to meet you"
    if (message.text === "Nice to meet you") {
      const emojis = await generateEmojiPair(client);

      await seedMessageReactions(client, message.channel, emojis, message.ts);

      await say(`Emoji reaction added to the message.`);
    }
  } catch (error) {
    console.error("Error in niceToMeetYouCallback:", error);
  }
};

export default niceToMeetYouCallback;
