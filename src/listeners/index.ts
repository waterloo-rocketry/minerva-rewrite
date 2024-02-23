import { App } from "@slack/bolt";
import { OAuth2Client } from "google-auth-library";

import actions from "./actions";
import commands from "./commands";
import events from "./events";
import messages from "./messages";
import shortcuts from "./shortcuts";
import views from "./views";

const registerListeners = (app: App, googleClient: OAuth2Client): void => {
  actions.register(app);
  commands.register(app, googleClient);
  events.register(app);
  messages.register(app);
  shortcuts.register(app);
  views.register(app);
};

export default registerListeners;
