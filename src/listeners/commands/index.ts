// commands/index.ts
import { App } from "@slack/bolt";
import { OAuth2Client } from "google-auth-library";

import { helpCommandHandler } from "./helpCommand";
import { meetingReminderCommandHandler } from "./meetingReminderCommand";

const register = (app: App, googleAuth: OAuth2Client): void => {
  app.command("/help", helpCommandHandler);
  app.command("/meeting_reminder", (payload) => meetingReminderCommandHandler(payload, googleAuth));
  // Other command registrations would go here
};

export default { register };
