// commands/index.ts
import { App } from "@slack/bolt";
import { helpCommandHandler } from "./helpCommand";

const register = (app: App): void => {
  app.command("/help", helpCommandHandler);
  // Other command registrations would go here
};

export default { register };
