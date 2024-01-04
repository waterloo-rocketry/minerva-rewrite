import { App } from "@slack/bolt";
import helloMessageCallback from "./helloMessage";
<<<<<<< HEAD
import { generateEmojiPair, seedMessageReactions } from "../../utils/slackEmojis";
=======
>>>>>>> 876a8abb602728144021a28928219c8a3d994356

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const register = (app: App): void => {
  app.message(/^(hi|hello|hey).*/, helloMessageCallback);

  // Add a new message listener for reacting to messages with a certain pattern
  app.message("Nice to meet you", async ({ message, say }) => {
    try {
      const emojis = await generateEmojiPair(app);

      await seedMessageReactions(app, message.channel, emojis, message.ts);

      await say(`Emoji reaction added to the message!`);
    } catch (error) {
      console.error("Failed to add emoji reaction:", error);
    }
  });
};

export default { register };
