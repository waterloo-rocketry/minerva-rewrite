import { App, AllMiddlewareArgs, SlackEventMiddlewareArgs, GenericMessageEvent } from "@slack/bolt";
import { generateEmojiPair, seedMessageReactions } from "../../utils/slackEmojis";

const helloMessageCallback = async ({
  message,
  say,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<"message">): Promise<void> => {
  // Check if 'message' is properly typed, as 'user' might not be a direct property.
  // If 'message' is of type 'MessageEvent', it should have a 'user' property.
  if ("user" in message) {
    await say({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Hey there <@${message.user}>!`,
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Click Me",
            },
            action_id: "button_click",
          },
        },
      ],
      text: `Hey there <@${message.user}>!`,
    });
  } else {
    console.error("The message event did not have a user property.");
  }
};

// Define a separate callback for "Nice to meet you"
const niceToMeetYouCallback = async ({
  message,
  say,
  context,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<"message"> & { context: { app: App } }): Promise<void> => {
  const genericMessage = message as GenericMessageEvent; // Use type assertion
  if (genericMessage && genericMessage.text && genericMessage.text.includes("Nice to meet you")) {
    try {
      const emojis = await generateEmojiPair(context.app);
      await seedMessageReactions(context.app, message.channel, emojis, message.ts);
      await say(`Emoji reaction added to the message.`);
    } catch (error) {
      console.error("Failed to add emoji reaction:", error);
    }
  }
};

export { helloMessageCallback, niceToMeetYouCallback };
