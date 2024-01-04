// commands/index.ts
import { App } from "@slack/bolt";
import { helpCommandHandler } from "./helpCommand";

<<<<<<< HEAD
const register = (app: App) => {
=======
const register = (app: App): void => {
>>>>>>> 876a8abb602728144021a28928219c8a3d994356
  app.command("/help", helpCommandHandler);
  // Other command registrations would go here
};

export default { register };
