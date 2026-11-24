// commands/index.ts
import { App } from "@slack/bolt";
import { OAuth2Client } from "google-auth-library";
import helpCommandHandler from "./helpCommand";
import notifyCommandHandler from "./notifyCommand";
import meetingReminderCommandHandler from "./meetingReminderCommand";
import { MeetingLinkProvider } from "../../utils/meetingLinks";

const register = (app: App, googleAuth: OAuth2Client, getMeetingLink: MeetingLinkProvider): void => {
  app.command("/help", helpCommandHandler);
  app.command("/meeting_reminder", (payload) => meetingReminderCommandHandler(payload, googleAuth, getMeetingLink));
  app.command("/notify", notifyCommandHandler);
};

export default { register };
