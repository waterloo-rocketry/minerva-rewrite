import { App } from "@slack/bolt";
import { OAuth2Client } from "google-auth-library";

import actions from "./actions";
import commands from "./commands";
import events from "./events";
import messages from "./messages";
import shortcuts from "./shortcuts";
import views from "./views";
import { MeetingLinkProvider } from "../utils/meetingLinks";

const registerListeners = (app: App, googleClient: OAuth2Client, getMeetingLink: MeetingLinkProvider): void => {
  actions.register(app);
  commands.register(app, googleClient, getMeetingLink);
  events.register(app);
  messages.register(app);
  shortcuts.register(app);
  views.register(app);
};

export default registerListeners;
