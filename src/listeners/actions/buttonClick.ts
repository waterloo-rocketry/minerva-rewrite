import { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from "@slack/bolt";

const buttonClickCallback = async ({
  body,
  ack,
  say,
}: AllMiddlewareArgs & SlackActionMiddlewareArgs<BlockAction>): Promise<void> => {
  // Acknowledge the action
  await ack();
  await say(`<@${body.user.id}> clicked the button`);
};

export default buttonClickCallback;
