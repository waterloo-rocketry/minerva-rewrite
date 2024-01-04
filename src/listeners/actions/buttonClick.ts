import { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from "@slack/bolt";

<<<<<<< HEAD
const buttonClickCallback = async ({ body, ack, say }: AllMiddlewareArgs & SlackActionMiddlewareArgs<BlockAction>) => {
=======
const buttonClickCallback = async ({
  body,
  ack,
  say,
}: AllMiddlewareArgs & SlackActionMiddlewareArgs<BlockAction>): Promise<void> => {
>>>>>>> 876a8abb602728144021a28928219c8a3d994356
  // Acknowledge the action
  await ack();
  await say(`<@${body.user.id}> clicked the button`);
};

export default buttonClickCallback;
