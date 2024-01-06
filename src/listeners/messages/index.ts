import { App } from "@slack/bolt";
import helloMessageCallback from "./helloMessage";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const register = (app: App): void => {
  app.message(/^(hi|hello|hey).*/, helloMessageCallback);
};

export default { register };
