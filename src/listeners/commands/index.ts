// commands/index.ts
import { App } from "@slack/bolt";
import helpCommandHandler from "./helpCommand";
import notifyCommandHandler from "./notifyCommand";

const register = (app: App): void => {
  app.command("/help", helpCommandHandler);
  app.command("/notify", notifyCommandHandler);
};

export default { register };
