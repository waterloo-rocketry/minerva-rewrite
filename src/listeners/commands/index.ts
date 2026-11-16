// commands/index.ts
import { App } from "@slack/bolt";
import { OAuth2Client } from "google-auth-library";
import helpCommandHandler from "./helpCommand";
import notifyCommandHandler from "./notifyCommand";
import meetingReminderCommandHandler from "./meetingReminderCommand";
import requestCommandHandler from "./requestCommand";

const register = (app: App, googleAuth: OAuth2Client): void => {
  app.command("/help", helpCommandHandler);
  app.command("/meeting_reminder", (payload) => meetingReminderCommandHandler(payload, googleAuth));
  app.command("/notify", notifyCommandHandler);
  app.command("/request", requestCommandHandler);
};

export default { register };
