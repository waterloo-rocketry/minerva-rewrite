import { environment } from "../utils/env";
import SlackChannel from "../classes/SlackChannel";

/**
 * The "default" slack channels for use in sending DM reminders to single-channel guests
 */
export const defaultSlackChannelNames =
  environment == "production"
    ? [
        "general",
        "airframe",
        "business",
        "controls",
        "electrical",
        "flight-dynamics",
        "infrastructure",
        "payload",
        "propulsion",
        "recovery",
        "software",
      ]
    : ["general", "random", "software", "test", "propulsion"]; // default channels for development

export const loggingChannel =
  environment == "production"
    ? new SlackChannel("minerva-log", "C016AAGP83F")
    : new SlackChannel("minerva-log", "C015FSK7FQE");

export const slackWorkspaceUrl =
  environment == "production" ? "https://waterloorocketry.slack.com" : "https://waterloorocketrydev.slack.com";
