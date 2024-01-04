import { AllMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";

<<<<<<< HEAD
const helloMessageCallback = async ({ message, say }: AllMiddlewareArgs & SlackEventMiddlewareArgs<"message">) => {
=======
const helloMessageCallback = async ({
  message,
  say,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<"message">): Promise<void> => {
>>>>>>> 876a8abb602728144021a28928219c8a3d994356
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

export default helloMessageCallback;
