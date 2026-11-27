import { App } from "@slack/bolt";
import * as environment from "./utils/env";
import registerListeners from "./listeners";
import { createGoogleAuth, createMeetAuth } from "./utils/googleAuth";
import { attachMeetingLink } from "./utils/googleCalendar";
import { createMeetingSpace } from "./utils/googleMeet";
import { generateMeetingLink } from "./utils/eventReminders";
import { createMeetingLinkProvider, findExistingMeetingLink, MeetingLinkProvider } from "./utils/meetingLinks";
import scheduleTasks from "./scheduled";

import { SlackLogger } from "./classes/SlackLogger";

// Set up Google credentials: the service account if configured, otherwise the OAuth refresh token
const auth = createGoogleAuth({
  serviceAccountKey: environment.minervaGoogleServiceAccount,
  calendarId: environment.minervaGoogleCalendarId,
  oauth: {
    clientId: environment.googleAccountClient,
    clientSecret: environment.googleAccountSecret,
    redirectUri: environment.googleAccountOauthRedirect,
    refreshToken: environment.googleAccountToken,
  },
});

// Create Meet links for events without one if Meet is configured. Otherwise keep generating the default link
const meetAuth = createMeetAuth({
  serviceAccountKey: environment.minervaGoogleServiceAccount,
  impersonatedUser: environment.minervaGoogleImpersonatedUser,
});
const getMeetingLink: MeetingLinkProvider = meetAuth
  ? createMeetingLinkProvider(
      () => createMeetingSpace(meetAuth),
      (event, meetingLink) => attachMeetingLink(auth, event, meetingLink),
    )
  : async (event): Promise<string | undefined> => findExistingMeetingLink(event) ?? generateMeetingLink(event);

// Initialize app
const app = new App({
  token: environment.slackBotToken,
  signingSecret: environment.slackSigningSecret,
  socketMode: true,
  appToken: environment.slackAppToken,
});

// Register listeners
registerListeners(app, auth, getMeetingLink);

// Schedule tasks
scheduleTasks(app.client, auth, getMeetingLink);

// Start app
(async (): Promise<void> => {
  try {
    await app.start();
    SlackLogger.getInstance().info(
      `Minerva has started. Deployment commit hash: \`${environment.deploymentCommitHash}\``,
    );
  } catch (error) {
    SlackLogger.getInstance().error(
      `Minerva has failed to start. Deployment commit hash: \`${environment.deploymentCommitHash}\``,
      error,
    );
  }
})();
