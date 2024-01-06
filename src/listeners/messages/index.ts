import { App } from "@slack/bolt";
import helloMessageCallback from "./helloMessage";
import niceToMeetYouCallback from "./niceToMeetYouMessage";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const register = (app: App): void => {
  app.message(/^(hi|hello|hey).*/, helloMessageCallback);
  app.message("Nice to meet you", niceToMeetYouCallback);
};

export default { register };
